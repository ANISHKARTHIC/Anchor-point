from datetime import datetime, timedelta, timezone
import json
import os
import pandas as pd
from app_routes.booking import utils as booking_utils
from app_routes.booking.schema import BookingType
from app_routes.coordinator.utils import get_or_create_coordinator
from typing import List, Union
from app_routes.invoice.schema import InvoiceEvent
from app_routes.invoice.utils import generate_excel_stream_response, generate_invoice_id, generate_hotel_invoice, store_document, store_documents_in_s3
from app_routes.organizer.utils import build_organizer_json
from app_routes.vendor.utils import build_vendor_json
from app_schemas.schema import Role
from common_utils.hotel_booking_push_notification import NotificationSenderFactory
from app_models import crud
from app_models.models import (
    BookingActivityLog, Coordinator, CostCentre, Guest, HotelBookingEditRequest, HotelBookingEditRequestHistory, HotelInvoice, HotelInvoiceItem, Organizer,
    HotelBooking, HotelBookingEvent, HotelBookingGuest, HotelBookingRoomDetail, Vendor, VendorCity, VendorHotelBookings, hotel_invoice_id_seq,
    HotelMealPlan, HotelRoomCategory, HotelPricing
)
from twilio.base.exceptions import TwilioRestException
from sqlalchemy.exc import SQLAlchemyError
from fastapi import BackgroundTasks, UploadFile
from sqlalchemy.orm import aliased
from sqlalchemy import func, asc, desc, case, or_, exc
from app_routes.hotel_bookings.schema import GuestCreate, HotelBookingEditRequestModel, HotelBookingEditRequestStatusEnum, HotelBookingEditRequestUpdate, HotelBookingStatus, HotelBookingCreate, HotelBookingUpdate, HotelInvoiceItemModel, VendorHotelBookingStatus, HotelInvoiceModel, HotelMealPlanModal, HotelPricingModal, HotelRoomCategoryModal
from common_utils import utils as cutils
from common_utils import obj_to_dict
from app_utils import utils as app_utils
from app_utils.decorators import email_exists_or_raise, transactional, verify_jwt_role_and_email
from app_configs import constants as const
from app_utils import exception as ex
from logger import logger as logging
from itertools import chain

def send_push_notification(booking_id: str, status: str, metadata: dict = None):
    NotificationSenderFactory.create_notification_sender(
        booking_id=booking_id, status=status, metadata=metadata
    ).send_notification()
    logging.info(f"Booking notification for booking {booking_id} has been sent.")

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def create_hotel_booking(user: Union[Coordinator, Organizer], booking_request: HotelBookingCreate, background_tasks: BackgroundTasks):
    try:   
        organizer_id = None
        event = HotelBookingStatus.PENDING.value 
        metadata = {"coordinator_name": user.name}
        cur_utc_time = cutils.current_utc_time()

        if isinstance(user, Organizer):
            organizer_id = user.id
            event = HotelBookingStatus.ORGANIZER_ASSIGNED.value 
            metadata={"organizer_name": user.name}
        
        coordinator = get_or_create_coordinator(booking_request.coordinator_email)
        booking_record = insert_booking_record(booking_request, coordinator.id, organizer_id, cur_utc_time)
        insert_guest_details(booking_record.id, booking_request.guests, cur_utc_time)
        insert_booking_event(booking_record.id, metadata, event, cur_utc_time)
        send_booking_creation_email(booking_record.bid, booking_request, booking_record.id, booking_request.coordinator_email, booking_request.cc_recipients, background_tasks)
        send_push_notification(booking_record.id, HotelBookingStatus.PENDING.value)
        return {
            "booking_id": booking_record.id,
            "message": "Successfully created new hotel booking record",
        }
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")
    
def send_booking_creation_email(bid: str, booking_request: HotelBookingCreate, booking_id: int, to_email: str, cc_recipient_emails: List[str], background_tasks: BackgroundTasks):
    try:
        email_body = booking_utils.render_template(
            const.HOTEL_BOOKING_CREATED_HTML,
            booking_id=booking_id,
            booking_request=booking_request,
            bid=bid
        )
        background_tasks.add_task(
            cutils.send_mail,
            recipient_email=to_email,
            subject=const.HOTEL_BOOKING_CREATED_MAIL_SUBJECT,
            body=email_body,
            cc_recipient_emails=cc_recipient_emails,
            content_type="html",
        )
        logging.info(f"New Booking request email to coordinator for hotel booking {booking_id} has been sent.")
    except Exception as e:
        logging.error(f"Error sending booking creation email for hotel booking {booking_id}: {str(e)}")
        
@transactional
def insert_booking_record(booking_request, coordinator_id, organizer_id, cur_utc_time):
    records_to_insert = {
        "trip_type": booking_request.trip_type,
        "bid": func.generate_bid_id(),
        "no_of_rooms": booking_request.no_of_rooms,
        "room_type": booking_request.room_type,
        "coordinator_id": coordinator_id,
        "city": booking_request.city,
        "organizer_id": organizer_id,
        "cost_centre_id": booking_request.cost_centre.id,
        "no_of_adults": booking_request.no_of_adults,
        "no_of_children": booking_request.no_of_children,
        "check_in": booking_request.check_in,
        "check_out": booking_request.check_out,
        "description": booking_request.description,
        "related_booking_id": booking_request.related_booking_id,
        "cc_recipients": booking_request.cc_recipients,
        "po_number": booking_request.po_number,
        "pickup": booking_request.pickup,
        "drop": booking_request.drop,
        "billing_option": booking_request.billing_option,
        "cdate": cur_utc_time,
        "mdate": cur_utc_time
    }
    return crud.insert_record(HotelBooking, **records_to_insert)

@transactional
def insert_booking_room_details(booking_id, room_details, cur_utc_time):
    records_to_insert = [
        {
            "booking_id": booking_id,
            "room_type": room_detail.room_type,
            "no_of_rooms": room_detail.no_of_rooms,
            "cdate": cur_utc_time
        } for room_detail in room_details]
    
    return crud.insert_records(HotelBookingRoomDetail, records_to_insert)


@transactional
def insert_guest_details(booking_id, guests, cur_utc_time):
    records_to_insert = []
    for guest in guests:
        records_to_insert.append({
            "booking_id": booking_id,
            "name": guest.name,
            "email": guest.email,
            "mobile": guest.mobile,
            "is_primary": guest.is_primary,
            "rank": guest.rank, 
            "vessel_name": guest.vessel_name,
            "internal_id": guest.internal_id,
            "cdate": cur_utc_time
        })
    
    return crud.insert_records(HotelBookingGuest, records_to_insert)

@transactional
def insert_booking_event(booking_id: str, metadata: dict, event: str, cur_utc_time: datetime):
    records_to_insert = {
        "booking_id": booking_id,
        "event": event,
        "meta_data": metadata,
        "cdate": cur_utc_time,
        "mdate": cur_utc_time
    }
    return crud.insert_record(HotelBookingEvent, **records_to_insert)

def build_hotel_booking_json(latest_booking_event, is_vendor_request=False):
   return func.jsonb_build_object(
        "id", HotelBooking.id,
        "bid", HotelBooking.bid,
        "city", HotelBooking.city,
        "trip_type", HotelBooking.trip_type,
        "no_of_rooms", HotelBooking.no_of_rooms,
        "room_type", HotelBooking.room_type,
        "no_of_adults", HotelBooking.no_of_adults,
        "no_of_children", HotelBooking.no_of_children,
        "no_of_guests", HotelBooking.no_of_children + HotelBooking.no_of_adults,
        "coordinator", app_utils.build_coordinator_json(),
        "cost_centre", app_utils.build_cost_centre_json(),
        "organizer", case((HotelBooking.organizer_id != None, build_organizer_json()), else_=None),
        "vendor",  case((HotelBooking.vendor_id != None, build_vendor_json()), else_=None),
        "check_in", func.to_char(HotelBooking.check_in, const.DATE_FORMAT),
        "check_out", func.to_char(HotelBooking.check_out, const.DATE_FORMAT),
        "description", HotelBooking.description,
        "pickup", HotelBooking.pickup,
        "drop", HotelBooking.drop,
        "status",
        case((
            or_(
                VendorHotelBookings.status == VendorHotelBookingStatus.VENDOR_REASSIGNED.value,
                VendorHotelBookings.status == VendorHotelBookingStatus.CANCELLED.value
            ),
            VendorHotelBookings.status
        ), else_=latest_booking_event.c.event) if is_vendor_request else latest_booking_event.c.event,
        "billing_option", func.coalesce(HotelBooking.billing_option, ''),
        "confirmation_no", HotelBooking.confirmation_no,
        "cc_recipients", HotelBooking.cc_recipients,
        "related_booking_id", HotelBooking.related_booking_id,    
        "created_at", booking_utils.convert_booking_datetime(HotelBooking.cdate),
    )

def build_hotel_booking_room_json():
   return func.jsonb_build_object(
        "id", HotelBookingRoomDetail.id,
        "room_type", HotelBookingRoomDetail.room_type,
        "no_of_rooms", HotelBookingRoomDetail.no_of_rooms
    )

def build_hotel_booking_guest_json():
   return func.jsonb_build_object(
        "hotel_booking_guest_id", HotelBookingGuest.id,
        "is_primary", HotelBookingGuest.is_primary,
        "mobile", HotelBookingGuest.mobile,
        "email", HotelBookingGuest.email,
        "name", HotelBookingGuest.name,
        "vessel_name",func.coalesce(HotelBookingGuest.vessel_name, 'NA'), 
        "rank", func.coalesce(HotelBookingGuest.rank, 'NA'), 
        "internal_id", func.coalesce(HotelBookingGuest.internal_id, 'NA')    
   )

def build_hotel_booking_events_json():
   return func.jsonb_build_object(
        "id", HotelBookingGuest.id,
        "is_primary", HotelBookingGuest.is_primary,
        "mobile", Guest.mobile,
        "email", Guest.email,
        "name", Guest.name, 
   )

@transactional
def fetch_room_details_by_booking_id(booking_id: str):
    select_cols = [build_hotel_booking_room_json()]
    filter_conditions=[HotelBookingRoomDetail.booking_id == booking_id]

    result = crud.select_records(HotelBookingRoomDetail, select_cols=select_cols, filter_conditions=filter_conditions).all()
    return {
        "hotel_booking_room_details": list(chain.from_iterable(result))
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_room_details_by_booking_id(user: Union[Coordinator, Organizer], booking_id: str):
    return fetch_room_details_by_booking_id(booking_id)

@transactional
def fetch_guest_details_by_booking_id(booking_id: str):
    select_cols = [build_hotel_booking_guest_json()]
    filter_conditions=[HotelBookingGuest.booking_id == booking_id]
    result = crud.select_records(HotelBookingGuest, select_cols=select_cols, filter_conditions=filter_conditions).all()
    return {
        "hotel_booking_guests": list(chain.from_iterable(result))
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value, Role.VENDOR.value])
def get_guest_details_by_booking_id(user: Union[Coordinator, Organizer, Vendor], booking_id: str):
    return fetch_guest_details_by_booking_id(booking_id)

def latest_booking_event_query():
    select_cols = [HotelBookingEvent.booking_id, HotelBookingEvent.event, HotelBookingEvent.meta_data]
    order_by = [HotelBookingEvent.booking_id, desc(HotelBookingEvent.cdate)]
    return (
        crud.select_records(HotelBookingEvent, select_cols=select_cols, order_by=order_by)
        .distinct(HotelBookingEvent.booking_id)
        .subquery()
    )

@transactional
def get_hotel_bookings(**filters):
    latest_booking_event = aliased(latest_booking_event_query())
    select_cols = [build_hotel_booking_json(latest_booking_event)]

    join_conditions = [
        (Coordinator, Coordinator.id == HotelBooking.coordinator_id),
        (CostCentre, CostCentre.id == HotelBooking.cost_centre_id),
        (Organizer, Organizer.id == HotelBooking.organizer_id, 'left'),
        (Vendor, Vendor.id == HotelBooking.vendor_id, 'left'),
        (VendorCity, VendorCity.id == Vendor.city_id, 'left'),
        (latest_booking_event, latest_booking_event.c.booking_id == HotelBooking.id, 'left'),
    ]

    order_by = [desc(HotelBooking.cdate)]

    limit = filters.get("limit", 10)
    page = filters.get("page", 1)
    offset = (page - 1) * limit

    filter_conditions = build_filter_conditions(filters, latest_booking_event)

    query = crud.select_records(
        primary_table=HotelBooking,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        order_by=order_by,
    )

    if filters.get("booking_id"):
        return query.scalar()
        
    result = query.limit(limit).offset(offset).all()
    total_bookings = query.count()
    booking_records = list(chain.from_iterable(result))
    return {
        "page": page,
        "total_records": total_bookings,
        "records_per_page": limit,
        "total_pages": (total_bookings + limit - 1) // limit,
        "bookings": booking_records,
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value, Role.VENDOR.value])
def get_hotel_booking_history_by_booking_id(user: Union[Coordinator, Organizer, Vendor], booking_id: str):
    filter_conditions = [HotelBookingEvent.booking_id == booking_id]
    order_by=[asc(HotelBookingEvent.cdate)]
    
    records = crud.select_records(HotelBookingEvent, filter_conditions=filter_conditions, order_by=order_by).all()
    return {"hotel_booking_history": [obj_to_dict.hotel_booking_history_as_dict(hotel_booking_history) for hotel_booking_history in records]}

def build_filter_conditions(filters, latest_booking_event=None):
    curr_date = cutils.current_utc_time().date()
    filter_conditions = []

    for key, value in filters.items():
        if value is None or value == "":
            continue  # Skip empty or None values
        elif key == "trip_type":
            filter_conditions.append(HotelBooking.trip_type.in_(value))
        elif key == "status":
            filter_conditions.append(latest_booking_event.c.event.in_(value))
        elif key == "vendor_booking_status":
            filter_conditions.append(VendorHotelBookings.status.in_(value))
        elif key == "city":
            filter_conditions.append(HotelBooking.city.in_(value))
        elif key == "room_type":
            filter_conditions.append(HotelBooking.room_type.in_(value))
        elif key == "coordinator":
            filter_conditions.append(Coordinator.name.in_(value))
        elif key == "cost_centre":
            filter_conditions.append(CostCentre.code.in_(value))
        elif key == "organizer":
            filter_conditions.append(Organizer.name.in_(value))
        elif key == "vendor":
            filter_conditions.append(Vendor.name.in_(value))
        elif key == "vendor_id":
            filter_conditions.append(VendorHotelBookings.vendor_id == value)
        elif key == "organizer_id":
            filter_conditions.append(HotelBooking.organizer_id == value)
        elif key == "coordinator_id":
            filter_conditions.append(HotelBooking.coordinator_id == value)
        elif key == "booking_id":
            filter_conditions.append(HotelBooking.id == value)
        elif key == "guest":
            booking_ids = app_utils.get_bookings_ids_by_name(HotelBookingGuest, value)
            filter_conditions.append(HotelBooking.id.in_(booking_ids or []))
        elif key == "booking_ids":
            value = value.split(",") if isinstance(value, str) else value
            if value:
                filter_conditions.append(HotelBooking.id.in_(value))
        elif key == "bid":
            filter_conditions.append(HotelBooking.bid == value)
        elif key.startswith("check"):
            value = booking_utils.parse_date(value) if isinstance(value, str) else value

            if key == "check_in_date":
                filter_conditions.append(HotelBooking.check_in == value)
            elif key == "check_in_date_gte":
                filter_conditions.append(HotelBooking.check_in >= value)
            elif key == "check_in_date_lte":
                filter_conditions.append(HotelBooking.check_in <= value)
            elif key == "check_out_date":
                filter_conditions.append(HotelBooking.check_out == value)
            elif key == "check_out_date_gte":
                filter_conditions.append(HotelBooking.check_out >= value)
            elif key == "check_out_date_lte":
                filter_conditions.append(HotelBooking.check_out <= value)

        elif key == "today":
            filter_conditions.append(HotelBooking.check_in == curr_date)
        elif key == "this_week":
            current_weekday = curr_date.weekday()
            days_to_saturday = 5 - current_weekday
            saturday_date = curr_date + timedelta(days=days_to_saturday)
            filter_conditions.append(HotelBooking.check_in.between(curr_date, saturday_date))

    return filter_conditions

@transactional
def get_booking_by_booking_id(booking_id: str):
    booking_record = crud.select_records(
        HotelBooking, filter_conditions=[HotelBooking.id == booking_id]
    ).first()
    if not booking_record:
        raise ex.RecordNotFound(model="Hotel Booking")
    return booking_record

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value, Role.VENDOR.value])
def update_hotel_booking_by_booking_id(user: Union[Coordinator, Organizer, Vendor], update_request: HotelBookingUpdate):
    booking_id = update_request.booking_id
    status = update_request.status
    metadata = update_request.metadata
    cur_utc_time = cutils.current_utc_time()

    booking_info = get_booking_by_booking_id(booking_id)
    update_booking_info(booking_info, status, metadata, cur_utc_time)
    insert_booking_event(booking_id, metadata, status, cur_utc_time)
    send_push_notification(booking_id, status, metadata)
    return {
        "hotel_booking_id": booking_id,
        "message": "Successfully updated booking status",
    }

@transactional
def update_booking_info(booking_info, status, metadata, cur_utc_time):
    booking_id = booking_info.id
    records_to_update = { "mdate": cur_utc_time }

    if status == HotelBookingStatus.ORGANIZER_ASSIGNED.value:
        if booking_info.organizers:
            raise ex.BookingAlreadyTaken
        records_to_update.update({"organizer_id": metadata["organizer_id"]})
    
    elif status == HotelBookingStatus.VENDOR_REQUESTED.value:
        if booking_info.vendor:
            raise ex.VendorBookingAssigned
        insert_vendor_hotel_booking_record(metadata["vendor_id"], booking_id, metadata)

    elif status == HotelBookingStatus.VENDOR_ACCEPTED.value:
        if booking_info.vendor:
            raise ex.VendorBookingAssigned
        vendor_id =  metadata["vendor_id"]
        records_to_update["vendor_id"] = vendor_id
        update_vendor_hotel_booking_status(VendorHotelBookingStatus.OWNED.value, booking_id, vendor_id)
        update_vendor_hotel_booking_status(VendorHotelBookingStatus.VENDOR_REASSIGNED.value, booking_id, vendor_id)
    
    elif status == HotelBookingStatus.VENDOR_DECLINED.value:
        records_to_update["vendor_id"] = None
        delete_vendor_hotel_booking_record(metadata["vendor_id"], booking_id)
    
    elif status == HotelBookingStatus.VENDOR_ASSIGN_REVOKED.value:
        vendor_id =  booking_info.vendor.id
        records_to_update.update({"confirmation_no": None, "vendor_id": None})
        update_vendor_hotel_booking_status(VendorHotelBookingStatus.REVOKED.value, booking_id, vendor_id)
    
    elif status == HotelBookingStatus.CANCELLED.value: 
        update_vendor_hotel_booking_status(VendorHotelBookingStatus.CANCELLED.value, booking_id)

    crud.update_records(
        HotelBooking,
        filter_criteria=[HotelBooking.id == booking_id],
        records_to_update=records_to_update,
    )

@transactional
def update_vendor_hotel_booking_status(action: str, booking_id: str, vendor_id: int = None):
    if action == VendorHotelBookingStatus.VENDOR_REASSIGNED.value:
        filter_conditions = [VendorHotelBookings.status == VendorHotelBookingStatus.REQUESTED.value, VendorHotelBookings.booking_id == booking_id]
        status = VendorHotelBookingStatus.VENDOR_REASSIGNED.value
    
    elif action == VendorHotelBookingStatus.REVOKED.value:
        filter_conditions = [VendorHotelBookings.vendor_id == vendor_id, VendorHotelBookings.booking_id == booking_id]
        status = VendorHotelBookingStatus.VENDOR_REASSIGNED.value
    
    elif action == VendorHotelBookingStatus.OWNED.value:
        filter_conditions = [VendorHotelBookings.vendor_id == vendor_id, VendorHotelBookings.booking_id == booking_id]
        status = VendorHotelBookingStatus.OWNED.value

    else:
        filter_conditions = [VendorHotelBookings.booking_id == booking_id]
        status = VendorHotelBookingStatus.CANCELLED.value

    return crud.update_records(VendorHotelBookings, filter_conditions, {"status": status, "mdate": cutils.current_utc_time()})

@transactional
def delete_vendor_hotel_booking_record(vendor_id: int, booking_id: str):
    filter_criteria = [VendorHotelBookings.vendor_id == vendor_id, VendorHotelBookings.booking_id == booking_id]
    return crud.delete_record(VendorHotelBookings, filter_criteria=filter_criteria)

@transactional
def insert_vendor_hotel_booking_record(vendor_id: int, booking_id: str, metadata: dict):
    filter_conditions=[VendorHotelBookings.vendor_id == vendor_id, VendorHotelBookings.booking_id == booking_id]
    status = VendorHotelBookingStatus.REQUESTED.value
    record = crud.select_records(VendorHotelBookings, filter_conditions=filter_conditions).first()
    cur_utc_time = cutils.current_utc_time()

    if not record:
        vendor_booking_data = {
            "vendor_id": vendor_id,
            "booking_id": booking_id,
            "status": status,
            "meta_data": metadata,
            "cdate": cur_utc_time,
            "mdate": cur_utc_time
        }
        return crud.insert_record(VendorHotelBookings, **vendor_booking_data)
    return crud.update_records(VendorHotelBookings, filter_conditions, {"status": status, "meta_data": metadata, "mdate": cur_utc_time})

@transactional
def get_vendor_hotel_bookings(**filters):
    latest_booking_event = aliased(latest_booking_event_query())
    select_cols = [build_hotel_booking_json(latest_booking_event, is_vendor_request=True)]

    join_conditions = [
        (HotelBooking, HotelBooking.id == VendorHotelBookings.booking_id),
        (Coordinator, Coordinator.id == HotelBooking.coordinator_id),
        (CostCentre, CostCentre.id == HotelBooking.cost_centre_id),
        (Organizer, Organizer.id == HotelBooking.organizer_id, 'left'),
        (Vendor, Vendor.id == HotelBooking.vendor_id, 'left'),
        (VendorCity, VendorCity.id == Vendor.city_id, 'left'),
        (latest_booking_event, latest_booking_event.c.booking_id == HotelBooking.id, 'left'),
    ]

    order_by = [desc(HotelBooking.cdate)]

    limit = filters.get("limit", 10)
    page = filters.get("page", 1)
    offset = (page - 1) * limit

    filter_conditions = build_filter_conditions(filters, latest_booking_event)

    query = crud.select_records(
        primary_table=VendorHotelBookings,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        order_by=order_by,
    )
    result = query.limit(limit).offset(offset).all()
    total_bookings = query.count()
    booking_records = list(chain.from_iterable(result))
    return {
        "page": page,
        "total_records": total_bookings,
        "records_per_page": limit,
        "total_pages": (total_bookings + limit - 1) // limit,
        "bookings": booking_records,
    }

@transactional
def get_edit_request_by_id(request_id: int):
    filter_conditions = [HotelBookingEditRequest.id == request_id]
    result = crud.select_records(HotelBookingEditRequest, filter_conditions=filter_conditions).first()
    if not result:
        raise ex.RecordNotFound(model="Hotel booking edit request")
    return obj_to_dict.hotel_booking_edit_request_as_dict(result)

@transactional
def insert_booking_edit_request(booking_id: str, description: str, cur_utc_time: datetime):
    result = crud.insert_record(HotelBookingEditRequest, booking_id=booking_id, description=description, cdate=cur_utc_time)
    if not result:
        raise ex.DatabaseOperationFailed(action="insert")
    return obj_to_dict.hotel_booking_edit_request_as_dict(result)

@transactional
def insert_booking_edit_request_history(edit_request_id: int, status: str,  cur_utc_time: datetime, metadata: dict = None):
    result = crud.insert_record(HotelBookingEditRequestHistory, edit_request_id=edit_request_id, status=status, meta_data=metadata, cdate=cur_utc_time)
    if not result:
        raise ex.DatabaseOperationFailed(action="insert")
    return obj_to_dict.hotel_booking_edit_request_history_as_dict(result)

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def create_booking_edit_request(user: Union[Coordinator, Organizer], booking_id: str, booking_edit_request: HotelBookingEditRequestModel):
    booking_info = get_booking_by_booking_id(booking_id)
    status = booking_edit_request.status.value
    description = booking_edit_request.description
    metadata = booking_edit_request.metadata
    cur_utc_time = cutils.current_utc_time()

    edit_request_record = insert_booking_edit_request(booking_id, description, cur_utc_time)
    edit_request_history_record = insert_booking_edit_request_history(edit_request_record["id"], status, cur_utc_time, metadata)
    send_push_notification(booking_id, status, metadata)
    return {
        "booking_id": booking_id,
        "request_id": edit_request_record["id"],
        "message": "Successfully created a new edit request"
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def update_booking_edit_request(user: Union[Coordinator, Organizer], booking_id: str, booking_edit_request: HotelBookingEditRequestUpdate, background_tasks: BackgroundTasks):
    status = booking_edit_request.status.value
    metadata = booking_edit_request.metadata
    booking_info = get_hotel_bookings(booking_id=booking_id)
    edit_request_record = get_edit_request_by_id(booking_edit_request.request_id)
    cur_utc_time = cutils.current_utc_time()

    insert_booking_edit_request_history(edit_request_record["id"], status, cur_utc_time, metadata)
    send_push_notification(booking_id, status, metadata)
    
    if status == HotelBookingEditRequestStatusEnum.confirmed.value:
        send_booking_edit_request_confirmation_mail(background_tasks, booking_info, edit_request_record["description"], metadata.get("confirmation_description"))
    
    return {
        "booking_id": booking_id,
        "request_id": booking_edit_request.request_id,
        "message": "Successfully updated existing edit request"
    }

def build_hotel_booking_edit_request_json(latest_edit_history_sub_query):
    return func.json_build_object(
        "id", HotelBookingEditRequest.id,
        "booking_id", HotelBookingEditRequest.booking_id,
        "description", HotelBookingEditRequest.description,
        "status", latest_edit_history_sub_query.c.status,
        "created_at", cutils.convert_utc_to_local_timezone(latest_edit_history_sub_query.c.cdate),
        "metadata", latest_edit_history_sub_query.c.meta_data
    )

def build_hotel_booking_edit_request_history_json():
    return func.json_build_object(
        "id", HotelBookingEditRequestHistory.id,
        "edit_request_id", HotelBookingEditRequestHistory.edit_request_id,
        "status", HotelBookingEditRequestHistory.status,
        "created_at", cutils.convert_utc_to_local_timezone(HotelBookingEditRequestHistory.cdate),
        "metadata", HotelBookingEditRequestHistory.meta_data
    )

def build_hotel_booking_edit_request_history_by_booking_id_json():
    return func.json_build_object(
        "id", HotelBookingEditRequestHistory.id,
        "edit_request", func.json_build_object(
            "id", HotelBookingEditRequest.id,
            "description", HotelBookingEditRequest.description
        ),
        "status", HotelBookingEditRequestHistory.status,
        "created_at", cutils.convert_utc_to_local_timezone(HotelBookingEditRequestHistory.cdate),
        "metadata", HotelBookingEditRequestHistory.meta_data
    )

@transactional
def latest_edit_history():
    select_cols = [HotelBookingEditRequestHistory.edit_request_id, HotelBookingEditRequestHistory.status, HotelBookingEditRequestHistory.cdate, HotelBookingEditRequestHistory.meta_data]
    order_by = [HotelBookingEditRequestHistory.edit_request_id, desc(HotelBookingEditRequestHistory.cdate)]
    return (
        crud.select_records(HotelBookingEditRequestHistory, select_cols=select_cols, order_by=order_by)
        .distinct(HotelBookingEditRequestHistory.edit_request_id)
        .subquery()
    )

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_hotel_booking_edit_request(user: Union[Coordinator, Organizer], booking_id: str):
    booking_info = get_booking_by_booking_id(booking_id)
    latest_edit_history_sub_query = aliased(latest_edit_history())
    
    select_cols = [build_hotel_booking_edit_request_json(latest_edit_history_sub_query)]
    join_conditions = [(latest_edit_history_sub_query, latest_edit_history_sub_query.c.edit_request_id == HotelBookingEditRequest.id)]
    filter_conditions = [HotelBookingEditRequest.booking_id == booking_id]
    order_by = [desc(HotelBookingEditRequest.id)]

    result = crud.select_records(HotelBookingEditRequest, select_cols=select_cols, join_conditions=join_conditions, filter_conditions=filter_conditions, order_by=order_by).all()
    return {
        "hotel_booking_edit_requests": list(chain.from_iterable(result))
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_hotel_booking_edit_request_history_by_booking_id(user: Union[Coordinator, Organizer], booking_id: str):
    booking_info = get_booking_by_booking_id(booking_id)

    select_cols = [build_hotel_booking_edit_request_history_by_booking_id_json()]
    join_conditions = [(HotelBookingEditRequestHistory, HotelBookingEditRequestHistory.edit_request_id == HotelBookingEditRequest.id)]
    filter_conditions = [HotelBookingEditRequest.booking_id == booking_id]
    order_by = [asc(HotelBookingEditRequestHistory.cdate)]

    result = crud.select_records(HotelBookingEditRequest, select_cols=select_cols, join_conditions=join_conditions, filter_conditions=filter_conditions, order_by=order_by).all()
    return {
        "hotel_booking_edit_request_history": list(chain.from_iterable(result))
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_hotel_booking_edit_request_history(user: Union[Coordinator, Organizer], booking_id: str, edit_request_id: int):
    booking_info = get_booking_by_booking_id(booking_id)
    edit_request_record = get_edit_request_by_id(edit_request_id)

    select_cols = [build_hotel_booking_edit_request_history_json()]
    filter_conditions = [HotelBookingEditRequestHistory.edit_request_id == edit_request_id]
    order_by = [asc(HotelBookingEditRequestHistory.cdate)]

    result = crud.select_records(HotelBookingEditRequestHistory, select_cols=select_cols, filter_conditions=filter_conditions, order_by=order_by).all()
    return {
        "hotel_booking_edit_request_history": list(chain.from_iterable(result))
    }

@transactional
def update_booking_data_confirmation(booking_id, vendor_id, confirmation_no, cur_utc_time):
    records_to_update = { "vendor_id": vendor_id, "confirmation_no": confirmation_no , "mdate": cur_utc_time }
    result = crud.update_records(
        HotelBooking,
        filter_criteria=[HotelBooking.id == booking_id],
        records_to_update=records_to_update,
    )
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")

@transactional
def get_primary_guest_info_by_booking_id(booking_id):
    guests = fetch_guest_details_by_booking_id(booking_id).get("hotel_booking_guests")
    for guest in guests:
        if guest["is_primary"]:
            return guest
        
def send_booking_confirmation_mail(to_email: str, booking_info: dict, background_tasks: BackgroundTasks, confirmation_attachment: UploadFile = None, metadata=None):
    email_subject = const.HOTEL_BOOKING_CONFIRMATION_SUBJECT
    email_body = booking_utils.render_template(
        const.HOTEL_BOOKING_CONFIRMATION_HTML,
        coordinator_name=booking_info["coordinator"]["name"],
        vendor_name=booking_info["vendor"]["name"],
        vendor_address=booking_info["vendor"]["address"],
        bid=booking_info["bid"],
        check_in=booking_info["check_in"],
        check_out=booking_info["check_out"],
        room_type=booking_info["room_type"],
        no_of_rooms=booking_info["no_of_rooms"],
        no_of_guests=booking_info["no_of_adults"] + booking_info["no_of_children"],
        confirmation_no=booking_info["confirmation_no"],
        description= metadata.get("confirmation_description"),
        contact_support=os.environ.get("CONTACT_SUPPORT")
    )
    background_tasks.add_task(
        cutils.send_mail,
        recipient_email=to_email,
        subject=email_subject,
        body=email_body,
        cc_recipient_emails=booking_info["cc_recipients"],
        attachment=confirmation_attachment,
        content_type="html",
    )
   
def send_booking_edit_request_confirmation_mail(background_tasks: BackgroundTasks, booking_info: dict, edit_request_description, confirmation_description=None):
    email_subject = const.HOTEL_BOOKING_EDIT_CONFIRMATION_SUBJECT
    email_body = const.HOTEL_BOOKING_EDIT_CONFIRMATION_BODY.format(
        bid=booking_info["bid"],
        coordinator_name = booking_info["coordinator"]["name"],
        edit_request_description = edit_request_description,
        confirmation_description= confirmation_description or 'NA',
        contact_support=os.environ.get("CONTACT_SUPPORT")
    )
    background_tasks.add_task(
        cutils.send_mail,
        recipient_email=booking_info["coordinator"]["email"],
        subject=email_subject,
        body=email_body,
        cc_recipient_emails=booking_info["cc_recipients"],
    )

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def confirm_hotel_booking(user: Union[Organizer, Vendor], booking_id: str, status: str, metadata: str, background_tasks, confirmation_attachment: UploadFile = None):
    metadata = json.loads(metadata)
    cur_utc_time = cutils.current_utc_time()

    update_booking_data_confirmation(booking_id, metadata["vendor_id"], metadata["confirmation_no"], cur_utc_time)
    insert_booking_event(booking_id, metadata, status, cur_utc_time)

    if confirmation_attachment:
        store_document(confirmation_attachment, f"{booking_id}/confirmation_attachment/{confirmation_attachment.filename}")

    booking_info = get_hotel_bookings(booking_id=booking_id)
    primary_guest_info = get_primary_guest_info_by_booking_id(booking_id)
    
    send_guest_sms(booking_info, primary_guest_info)
    send_booking_confirmation_mail(primary_guest_info["email"], booking_info, background_tasks, confirmation_attachment, metadata)   
    send_push_notification(booking_id, status, metadata)
    return {
        "hotel_booking_id": booking_id,
        "message": "Successfully updated booking status",
    }

@transactional
def update_guest_message_sid(hotel_booking_guest_id: int, message_sid: str):
    result = crud.update_records(HotelBookingGuest, filter_criteria=[HotelBookingGuest.id == hotel_booking_guest_id], records_to_update={"guest_message_sid": message_sid})
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")
        
@transactional
def send_guest_sms(booking_payload, guest, messaging_type = "whatsapp"):
    try:
        api_url=os.getenv("API_URL")
        callback_url=const.WHATSAPP_HOTEL_GUEST_CALLBACK_URL.format(api_url=api_url)

        content_sid = const.HOTEL_MESSAGE_CONTENT_SID
        content_variables = get_guest_whatsapp_body_content_variables(booking_payload, guest)
        to = guest["mobile"]
        callback_url = const.WHATSAPP_HOTEL_GUEST_CALLBACK_URL.format(api_url=os.getenv("API_URL"))

        if messaging_type == "whatsapp":
            body = get_guest_whatsapp_body(booking_payload, guest)
        else:
            body = get_guest_sms_body(guest["name"], booking_payload["vendor"]["name"], booking_payload["confirmation_no"])
        
        content_variables["7"] = str(content_variables["7"])
        content_variables["8"] = str(content_variables["8"])
        
        message_sid = cutils.send_message(messaging_type=messaging_type, to=to, body=body, content_sid=content_sid, content_variables=content_variables, callback_url=callback_url)
        update_guest_message_sid(guest["hotel_booking_guest_id"], message_sid)
        
        return {"message": "SMS sent successfully"}
    
    except TwilioRestException as e:
        err_msg = str(e)
        logging.error(err_msg)
        raise ex.SMSException(err_msg)
    
def get_guest_whatsapp_body_content_variables(booking_payload, guest):
    return {
        "1": guest["name"],
        "2": booking_payload["vendor"]["name"],
        "3": booking_payload["bid"],
        "4": booking_payload["check_in"],
        "5": booking_payload["check_out"],
        "6": booking_payload["room_type"] or " - ",
        "7": booking_payload["no_of_rooms"],
        "8": booking_payload["no_of_adults"] + booking_payload["no_of_children"],
        "9": booking_payload["confirmation_no"],
        "10": booking_payload["vendor"]["address"],
        "11": os.environ.get("CONTACT_SUPPORT")
    }

def get_guest_whatsapp_body(booking_payload, guest):
    return const.HOTEL_GUEST_WHATSAPP_BODY.format(
        guest_name=guest["name"],
        vendor_name=booking_payload["vendor"]["name"],
        bid=booking_payload["bid"],
        check_in=booking_payload["check_in"],
        check_out=booking_payload["check_out"],
        room_type=booking_payload["room_type"] or " - ",
        no_of_rooms=booking_payload["no_of_rooms"],
        no_of_guests=booking_payload["no_of_adults"] + booking_payload["no_of_children"],
        confirmation_no=booking_payload["confirmation_no"],
        hotel_address=booking_payload["vendor"]["address"],
        contact_support=os.environ.get("CONTACT_SUPPORT")
    )

def get_guest_sms_body(guest_name, vendor_name, confirmation_no):
    return const.HOTEL_GUEST_WHATSAPP_BODY.format(
        guest_name=guest_name,
        vendor_name=vendor_name,
        confirmation_no=confirmation_no,
        contact_support=os.environ.get("CONTACT_SUPPORT")
    )

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_bid_from_hotel_bookings(user: Union[Organizer, Vendor], bid_filter: str = None):
    filter_conditions = []
    if bid_filter:
        condition = HotelBooking.bid.ilike(bid_filter + "%")
        filter_conditions.append(condition)
    subquery = crud.select_records(HotelBooking, select_cols=[HotelBooking.bid], filter_conditions=filter_conditions).subquery()
    result = crud.select_records(subquery, select_cols=[func.array(subquery)]).scalar()
    return {"bid": result}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def update_hotel_booking_info_by_booking_id(user: Union[Coordinator, Organizer], booking_id: str, update_request: dict):
    hotel_booking_record = get_hotel_bookings(booking_id=booking_id)
    records_to_update  = {}
    if update_request.get("cc_recipients"):
        new_cc_recipients = update_request["cc_recipients"]
        meta_data = {"organizer_name": user.name, "prev_cc_recipients" : hotel_booking_record["cc_recipients"], "cur_cc_recipients": new_cc_recipients }
        event = "cc_recipients_change"
        records_to_update["cc_recipients"] = new_cc_recipients
        
    if "po_number" in update_request:
        records_to_update["po_number"] = update_request["po_number"]
    
    filter_criteria = [HotelBooking.id == booking_id]
    update_result = crud.update_records(HotelBooking, filter_criteria=filter_criteria, records_to_update=records_to_update)

    if not update_result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")

    return {
        "hotel_booking_id": booking_id,
        "message": "Successfully updated hotel booking info",
    }

@transactional
def fetch_latest_booking_event_counts(vendor_id = None):
    HotelBookingEventAlias = aliased(HotelBookingEvent)

    subquery = crud.select_records(HotelBookingEventAlias, 
        select_cols=[func.max(HotelBookingEventAlias.cdate)],
        filter_conditions=[HotelBookingEventAlias.booking_id == HotelBookingEvent.booking_id]
    ).scalar_subquery()

    select_cols = [HotelBookingEvent.event,  func.count(HotelBookingEvent.booking_id.distinct())]
    join_conditions = [(HotelBooking, HotelBooking.id == HotelBookingEvent.booking_id)]
    filter_conditions = [HotelBookingEvent.cdate == subquery]
    grouph_by = [HotelBookingEvent.event]
    
    if vendor_id:
        filter_conditions.append(HotelBooking.vendor_id == vendor_id)

    result = crud.select_records(HotelBookingEvent, select_cols=select_cols, group_by=grouph_by, join_conditions=join_conditions, filter_conditions=filter_conditions).all()

    return { event: count for event, count in result }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_hotel_booking_summary(user: Union[Organizer, Vendor]):
    return get_organizer_hotel_booking_summary() if isinstance(user, Organizer) else  get_vendor_hotel_booking_summary(vendor_id=user.id)
    
def calculate_event_count(event_count_map, event_list):
    return sum(event_count_map.get(event, 0) for event in event_list)

@transactional
def get_organizer_hotel_booking_summary():
    cur_date = cutils.current_utc_time().date()
    return {
        "pending_booking_confirmations": get_hotel_bookings(
            status=["pending", "organizer_assigned", "vendor_requested", "vendor_accepted", "vendor_declined", "vendor_assign_revoked"],
            check_in_date_gte=cur_date
        )["total_records"],
        "tomorrow_check_ins": get_hotel_bookings(
            check_in_date_gte=cur_date,
            check_in_date_lte=cur_date + timedelta(days=1)
        )["total_records"],        
        "edit_requests": get_latest_hotel_booking_edit_request(),
    }

@transactional
def get_tomorrow_check_in_bookings(cur_date: datetime, vendor_id=None):
    next_date = cur_date + timedelta(days=1)

    select_cols = [func.count(HotelBooking.id.distinct())]
    filter_conditions = [HotelBooking.check_in.between(cur_date, next_date)]
    if vendor_id:
        filter_conditions.append(HotelBooking.vendor_id == vendor_id)

    return crud.select_records(HotelBooking, select_cols=select_cols, filter_conditions=filter_conditions).scalar()

@transactional
def get_vendor_hotel_booking_summary(vendor_id):
    cur_date = cutils.current_utc_time().date()
    return {
        "pending_invoices": fetch_vendor_pending_invoices(vendor_id, cur_date),
        "pending_booking_confirmations": get_vendor_hotel_bookings(
            vendor_id=vendor_id,
            vendor_booking_status=["requested", "owned"], 
            status=["vendor_requested", "vendor_accepted"],
            check_in_date_gte=cur_date
        )["total_records"],
        "tomorrow_check_ins": get_vendor_hotel_bookings(
            vendor_id=vendor_id,
            check_in_date_gte=cur_date,
            check_in_date_lte=cur_date + timedelta(days=1)
        )["total_records"],
    }

@transactional
def get_latest_hotel_booking_edit_request():
    latest_edit_history_sub_query = aliased(latest_edit_history())

    select_cols = [func.count(HotelBookingEditRequest.booking_id.distinct())]
    join_conditions = [(latest_edit_history_sub_query, latest_edit_history_sub_query.c.edit_request_id == HotelBookingEditRequest.id)]
    filter_conditions = [latest_edit_history_sub_query.c.status != HotelBookingEditRequestStatusEnum.confirmed.value]

    return crud.select_records(HotelBookingEditRequest, select_cols=select_cols, join_conditions=join_conditions, filter_conditions=filter_conditions).scalar()

@transactional
def fetch_vendor_pending_invoices(vendor_id: int, cur_date: datetime):
    latest_booking_event = aliased(latest_booking_event_query())

    select_cols = [func.count(VendorHotelBookings.booking_id)]
    join_conditions = [
        (latest_booking_event, latest_booking_event.c.booking_id == VendorHotelBookings.booking_id),
        (HotelBooking , HotelBooking.id == VendorHotelBookings.booking_id)
    ]
    filter_conditions = [VendorHotelBookings.vendor_id == vendor_id, latest_booking_event.c.event == HotelBookingStatus.CONFIRMED.value, HotelBooking.check_out <= cur_date]

    return crud.select_records(VendorHotelBookings, select_cols=select_cols, join_conditions=join_conditions, filter_conditions=filter_conditions).scalar()    

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_edit_booking_requests(organizer: Organizer):
    latest_edit_history_sub_query = aliased(latest_edit_history())
    
    select_cols = [func.array_agg(HotelBookingEditRequest.booking_id.distinct())]
    join_conditions = [(latest_edit_history_sub_query, latest_edit_history_sub_query.c.edit_request_id == HotelBookingEditRequest.id)]
    filter_conditions = [latest_edit_history_sub_query.c.status != HotelBookingEditRequestStatusEnum.confirmed.value]

    booking_ids = crud.select_records(HotelBookingEditRequest, select_cols=select_cols, join_conditions=join_conditions, filter_conditions=filter_conditions).scalar()    

    return get_hotel_bookings(booking_ids=booking_ids) if booking_ids else {"page":1,"total_records":0,"records_per_page":10,"total_pages":0,"bookings":[]}

@transactional
def create_invoice_items(invoice_id: int, invoice_items: HotelInvoiceItemModel):
    cur_utc_time = cutils.current_utc_time()
    records_to_insert = []
    for item in invoice_items:
        records_to_insert.append({
            "name":  item.name,
            "sac": item.sac,
            "rate": item.rate,
            "tax_rate": item.tax_rate,
            "tax_percent": item.tax_percent,
            "rate": item.rate,
            "quantity": item.quantity,
            "amount": item.amount, 
            "invoice_id": invoice_id, 
            "cdate": cur_utc_time
        })
    crud.insert_records(HotelInvoiceItem, records=records_to_insert)

@transactional
def create_invoice(booking_id: str, invoice: HotelInvoiceModel):
    try:
        seq_id = crud.fetch_seq_value(hotel_invoice_id_seq)
        invoice_no = generate_invoice_id(id=seq_id, booking_type='HOT')
        cur_utc_time = cutils.current_utc_time()
        invoice_record = crud.insert_record(
            HotelInvoice, 
            booking_id=booking_id, invoice_no=invoice_no, taxable_amount=invoice.taxable_amount, non_taxable_amount=invoice.non_taxable_amount,
            cgst_amount=invoice.cgst_amount, sgst_amount=invoice.sgst_amount, igst_amount=invoice.igst_amount, po_number=invoice.po_number,
            hotel_name=invoice.hotel_name, supporting_document_url=invoice.supporting_document_url,
            total_amount=invoice.total_amount, description=invoice.description, cdate=cur_utc_time, mdate=cur_utc_time
        )
        if not invoice_no:
            raise ex.DatabaseOperationFailed(action="insert")
        
        return invoice_record
    except exc.IntegrityError as err:
        logging.error(err)
        crud.set_seq_value(seq_name='hotel_invoice_id_seq', reset_value=seq_id)
        raise ex.RecordExists(msg="Hotel invoice exists already")
    except Exception as err:
        crud.set_seq_value(seq_name='hotel_invoice_id_seq', reset_value=seq_id)
        raise err

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def generate_invoice(organizer: Organizer, booking_id: str, invoice_request: HotelInvoiceModel, background_tasks : BackgroundTasks):
    # Update invoice info
    invoice_id = update_hotel_invoice(booking_id, invoice_request)
    update_hotel_invoice_items(invoice_id, invoice_request.invoice_items)
    # Fetch booking details
    booking = get_hotel_bookings(booking_id=booking_id)
    guests = fetch_guest_details_by_booking_id(booking_id).get("hotel_booking_guests")
    invoice = get_invoice_by_booking_id(booking_id)
    invoice_items = get_invoice_items_by_invoice_id(invoice["id"])
    # Generate invoice PDF
    generate_hotel_invoice(booking, guests, invoice, invoice_items, background_tasks)
    # Add booking event
    event = InvoiceEvent.INVOICE_CREATED_BY_SUPER_ORGANIZER.value if organizer.role else InvoiceEvent.INVOICE_CREATED_BY_ORGANIZER.value
    insert_booking_event(booking_id=booking_id, metadata={}, event=event, cur_utc_time=cutils.current_utc_time())
    return {
        "invoice_id": booking_id,
        "message": "Successfully created invoice for hotel booking"
    }

@transactional
def get_invoice_by_id(invoice_id: int):
    filter_conditions = [HotelInvoice.id == invoice_id]
    result = crud.select_records(HotelInvoice, filter_conditions=filter_conditions).first()
    if not result:
        return {}
    return result

@transactional
def get_invoice_item_by_item_id(invoice_item_id: int):
    filter_conditions = [HotelInvoiceItem.id == invoice_item_id]
    return crud.select_records(HotelInvoiceItem, filter_conditions=filter_conditions).first()

@transactional
def get_invoice_items_by_invoice_id(invoice_id: int):
    filter_conditions = [HotelInvoiceItem.invoice_id == invoice_id]
    invoice_items = crud.select_records(HotelInvoiceItem, filter_conditions=filter_conditions).all()
    return [obj_to_dict.hotel_invoice_item_as_dict(invoice_item) for invoice_item in invoice_items]

@transactional
def get_invoice_by_booking_id(booking_id: int):
    filter_conditions = [HotelInvoice.booking_id == booking_id]
    result = crud.select_records(HotelInvoice, filter_conditions=filter_conditions).first()
    if not result:
        return {}
    return obj_to_dict.hotel_invoice_as_dict(result)

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def fetch_hotel_invoice(organizer: Organizer, booking_id: str):
    invoice_record = get_invoice_by_booking_id(booking_id=booking_id)
    if invoice_record:
        invoice_record["invoice_items"] = get_invoice_items_by_invoice_id(invoice_id=invoice_record["id"])
        invoice_record["s3_url"] = cutils.get_latest_object_after_time(folder_prefix=f"{booking_id}/invoices/") 
    return {"invoice": invoice_record}

@transactional
def update_hotel_invoice(booking_id: str, invoice: HotelInvoiceModel):
    cur_utc_time = cutils.current_utc_time()
    invoice_id = invoice.id
    
    if invoice_id: # Update existing invoice item
        filter_criteria = [HotelInvoice.id == invoice_id]
        records_to_update = {
            "taxable_amount": invoice.taxable_amount,
            "non_taxable_amount": invoice.non_taxable_amount,
            "cgst_amount": invoice.cgst_amount,
            "sgst_amount": invoice.sgst_amount,
            "total_amount": invoice.total_amount,
            "po_number": invoice.po_number,
            "hotel_name": invoice.hotel_name,
            "supporting_document_url": invoice.supporting_document_url,
            "description": invoice.description,
            "mdate": cur_utc_time
        }
        crud.update_records(HotelInvoice, filter_criteria, records_to_update)
    else: # Create new invoice item
        invoice_record = create_invoice(booking_id, invoice)
        invoice_id = invoice_record.id
    
    return invoice_id

@transactional
def update_hotel_invoice_items(invoice_id: int, invoice_items: HotelInvoiceItemModel):
    cur_utc_time = cutils.current_utc_time()
        
    for invoice_item in invoice_items:
        invoice_item_as_dict = {
            "name":  invoice_item.name,
            "sac": invoice_item.sac,
            "rate": invoice_item.rate,
            "tax_rate": invoice_item.tax_rate,
            "tax_percent": invoice_item.tax_percent,
            "rate": invoice_item.rate,
            "quantity": invoice_item.quantity,
            "amount": invoice_item.amount
        }
        filter_criteria = [HotelInvoiceItem.id == invoice_item.id]
        
        if invoice_item.delete: # Delete existing invoice item
            crud.delete_record(HotelInvoiceItem, filter_criteria)
        else:
            if invoice_item.id: # Update existing invoice item
                crud.update_records(HotelInvoiceItem, filter_criteria, records_to_update=invoice_item_as_dict)
            
            else: # Create new invoice item
                invoice_item_as_dict.update({ "invoice_id": invoice_id, "cdate": cur_utc_time})
                crud.insert_record(HotelInvoiceItem, **invoice_item_as_dict)


@transactional
def find_record_by_column(table, column, value):
    filter_conditions = [column.ilike(value)]
    return crud.select_records(table, filter_conditions=filter_conditions).first()

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_hotel_room_categories(organizer: Organizer):
    room_categories = crud.select_records(HotelRoomCategory, order_by=[HotelRoomCategory.name]).all()
    return { "room_category" : [obj_to_dict.hotel_room_category_as_dict(room_category) for room_category in room_categories] } 

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def fetch_hotel_room_category_by_id(organizer: Organizer, room_category_id: int):
    room_category_record = app_utils.get_model_record_by_id(HotelRoomCategory, room_category_id)
    return { "room_category" : obj_to_dict.hotel_room_category_as_dict(room_category_record) }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def create_hotel_room_category(organizer: Organizer, room_category: HotelRoomCategoryModal):
    room_category_record = find_record_by_column(HotelRoomCategory, HotelRoomCategory.name, room_category.name)
    
    if room_category_record:
        raise ex.RecordExists(field_name="Room category", field_value=room_category.name)
    
    result = crud.insert_record(HotelRoomCategory, name=room_category.name)
    if not result:
        raise ex.DatabaseOperationFailed(action="insert")
    return { 
        "room_category": obj_to_dict.hotel_room_category_as_dict(result),
        "message": "Successfully created new room category"
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def update_hotel_room_category_by_id(organizer: Organizer, room_category_id: int, room_category: HotelRoomCategoryModal):
    room_category_record = app_utils.get_model_record_by_id(HotelRoomCategory, room_category_id)
    filter_criteria = [HotelRoomCategory.id == room_category_id]
    result = crud.update_records(HotelRoomCategory, filter_criteria, records_to_update={"name": room_category.name})
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")
    return { 
        "room_category_id": room_category_id,
        "message": "Successfully updated room category"
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def delete_hotel_room_category_by_id(organizer: Organizer, room_category_id: int):
    room_category_record = app_utils.get_model_record_by_id(HotelRoomCategory, room_category_id)
    filter_criteria = [HotelRoomCategory.id == room_category_id]
    result = crud.delete_record(HotelRoomCategory, filter_criteria)
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="delete")
    return { 
        "room_category_id": room_category_id,
        "message": "Successfully deleted room category"
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_hotel_meal_plans(organizer: Organizer):
    meal_plans = crud.select_records(HotelMealPlan, order_by=[HotelMealPlan.name]).all()
    return { "meal_plan" : [obj_to_dict.hotel_meal_plan_as_dict(meal_plan) for meal_plan in meal_plans] } 

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def fetch_hotel_meal_plan_by_id(organizer: Organizer, meal_plan_id: int):
    meal_plan_record = app_utils.get_model_record_by_id(HotelMealPlan, meal_plan_id)
    return { "meal_plan" : obj_to_dict.hotel_meal_plan_as_dict(meal_plan_record) }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def create_hotel_meal_plan(organizer: Organizer, meal_plan: HotelMealPlanModal):
    meal_plan_record = find_record_by_column(HotelMealPlan, HotelMealPlan.name, meal_plan.name)
    
    if meal_plan_record:
        raise ex.RecordExists(field_name="Meal Plan", field_value=meal_plan.name)
    
    result = crud.insert_record(HotelMealPlan, name=meal_plan.name)
    if not result:
        raise ex.DatabaseOperationFailed(action="insert")
    return { 
        "meal_plan": obj_to_dict.hotel_meal_plan_as_dict(result),
        "message": "Successfully created new meal plan"
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def update_hotel_meal_plan_by_id(organizer: Organizer, meal_plan_id: int, meal_plan: HotelMealPlanModal):
    meal_plan_record = app_utils.get_model_record_by_id(HotelMealPlan, meal_plan_id)
    filter_criteria = [HotelMealPlan.id == meal_plan_id]
    result = crud.update_records(HotelMealPlan, filter_criteria, records_to_update={"name": meal_plan.name})
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")
    return { 
        "meal_plan_id": meal_plan_id,
        "message": "Successfully updated meal plan"
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def delete_hotel_meal_plan_by_id(organizer: Organizer, meal_plan_id: int):
    meal_plan_record = app_utils.get_model_record_by_id(HotelMealPlan, meal_plan_id)
    filter_criteria = [HotelMealPlan.id == meal_plan_id]
    result = crud.delete_record(HotelMealPlan, filter_criteria)
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="delete")
    return { 
        "meal_plan_id": meal_plan_id,
        "message": "Successfully deleted meal plan"
    }

def get_hotel_pricing_by_details(pricing: HotelPricingModal, pricing_id: int = None):
    filter_conditions=[
        HotelPricing.vendor_id == pricing.vendor_id,
        HotelPricing.meal_plan_id == pricing.meal_plan_id, 
        HotelPricing.room_category_id == pricing.room_category_id,
    ]
    if pricing_id:
        filter_conditions.append(HotelPricing.id != pricing_id)
    record = crud.select_records(
        primary_table=HotelPricing,
        filter_conditions=filter_conditions,
    ).first()
    if record:
        raise ex.RecordExists(msg="The vendor already has a pricing plan in place for this specific room category and meal plan.")
    return record

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_vendor_hotel_pricing(organizer: Organizer, vendor_id: int):
    filter_conditions = [HotelPricing.vendor_id == vendor_id]
    pricing_records = crud.select_records(HotelPricing, filter_conditions=filter_conditions).all()
    return {"hotel_pricing":[
        {
            "sac": const.SAC,
            "name": f"{record.room_category.name} - {room_type}",
            "rate": getattr(record, rate_field),
            "tax_percent": record.vendor.tax
        }
        for record in pricing_records
        for room_type, rate_field in [
            ("Single", "single_room_rate"),
            ("Double", "double_room_rate")
        ]
      ]
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_hotel_pricing(organizer: Organizer, vendor_id: int = None):
    filter_conditions = [HotelPricing.vendor_id == vendor_id] if vendor_id else []
    pricing = crud.select_records(HotelPricing, filter_conditions=filter_conditions).all()
    return {"hotel_pricing": [obj_to_dict.hotel_pricing_as_dict(record) for record in pricing]}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def fetch_hotel_pricing_by_id(organizer: Organizer, pricing_id: int):
    pricing = app_utils.get_model_record_by_id(HotelPricing, pricing_id)
    return {"hotel_pricing": obj_to_dict.hotel_pricing_as_dict(pricing)}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def create_hotel_pricing(organizer: Organizer, pricing: HotelPricingModal):
    pricing_record = get_hotel_pricing_by_details(pricing)
    records_to_insert = {
        "vendor_id": pricing.vendor_id,
        "room_category_id": pricing.room_category_id,
        "meal_plan_id": pricing.meal_plan_id,
        "single_room_rate": pricing.single_room_rate,
        "double_room_rate": pricing.double_room_rate,
        "inclusions": pricing.inclusions
    }
    pricing_record = crud.insert_record(HotelPricing, **records_to_insert)
    if not pricing_record:
        raise ex.DatabaseOperationFailed(action="insert")
    return {
        "message": "Successfully created new pricing plan for the vendor",
        "pricing_id": pricing_record.id,
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def update_hotel_pricing_by_id(organizer: Organizer, pricing_id: int, pricing: HotelPricingModal):
    pricing_info = app_utils.get_model_record_by_id(HotelPricing, pricing_id)
    pricing_record = get_hotel_pricing_by_details(pricing, pricing_id)
    records_to_update = {
        "vendor_id": pricing.vendor_id,
        "room_category_id": pricing.room_category_id,
        "meal_plan_id": pricing.meal_plan_id,
        "single_room_rate": pricing.single_room_rate,
        "double_room_rate": pricing.double_room_rate,
        "inclusions": pricing.inclusions,
    }
    filter_criteria = [HotelPricing.id == pricing_id]
    result = crud.update_records(HotelPricing, filter_criteria, records_to_update)
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")
    return {"plan_id": pricing_id, "message":"Successfully updated hotel pricing"}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def delete_hotel_pricing_by_id(organizer: Organizer, pricing_id: int):
    pricing_info = app_utils.get_model_record_by_id(HotelPricing, pricing_id)
    filter_criteria = [HotelPricing.id == pricing_info.id]
    result = crud.delete_record(HotelPricing, filter_criteria)
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="delete")
    return {"plan_id": pricing_id, "message": "Successfully deleted hotel pricing"}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def create_vendor_invoice(user: Union[Organizer, Vendor], booking_id: str, documents, description: str = "", delete_files: str = ""):
    event = InvoiceEvent.INVOICE_CREATED.value 
    metadata = { "description": description } 
    cur_utc_time = cutils.current_utc_time()

    booking_event_record = crud.select_records(
        HotelBookingEvent, 
        filter_conditions=[HotelBookingEvent.booking_id == booking_id, HotelBookingEvent.event == event]
    ).first()
    
    if not booking_event_record:
        insert_booking_event(
            booking_id=booking_id, 
            metadata=metadata,
            event=event,
            cur_utc_time=cur_utc_time
        )
    else:
        crud.update_records(
            HotelBookingEvent, 
            filter_criteria=[HotelBookingEvent.id == booking_event_record.id], 
            records_to_update={"meta_data": metadata, "mdate": cur_utc_time}
        )
    
    folder_name = const.DOCUMENTS_S3_BUCKET_FOLDER
    folder_path = f"{booking_id}/{folder_name}"
    cutils.delete_objects_in_folder(folder_path, delete_files)
    
    if documents:
        for document in documents:
            store_document(document=document, filename=f"{folder_path}/{document.filename}")

    return {"booking_id": booking_id, "message": "Vendor Invoice details added successfully"}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_vendor_invoice_by_booking_id(user: Union[Organizer, Vendor], booking_id: str):
    select_cols = [HotelBookingEvent.meta_data]
    filter_conditions=[HotelBookingEvent.booking_id == booking_id, HotelBookingEvent.event == InvoiceEvent.INVOICE_CREATED.value]

    vendor_invoice_info = crud.select_records(
        primary_table=HotelBookingEvent,
        select_cols=select_cols,
        filter_conditions=filter_conditions,
    ).scalar()
    
    if not vendor_invoice_info:
        return {}
    
    folder_path = f"{booking_id}/{const.DOCUMENTS_S3_BUCKET_FOLDER}/"
    documents_urls = cutils.fetch_s3_folder_contents(folder_path, bucket_name=os.getenv("BUCKET_NAME"))
    vendor_invoice_info['documents'] = documents_urls
    return vendor_invoice_info

def prepare_booking_info(booking_request, cur_utc_time):
    return {
        "trip_type": booking_request.trip_type,
        "no_of_rooms": booking_request.no_of_rooms,
        "room_type": booking_request.room_type,
        "city": booking_request.city,
        "cost_centre_id": booking_request.cost_centre.id,
        "no_of_adults": booking_request.no_of_adults,
        "no_of_children": booking_request.no_of_children,
        "no_of_rooms": booking_request.no_of_rooms,
        "check_in": booking_request.check_in,
        "check_out": booking_request.check_out,
        "description": booking_request.description,
        "related_booking_id": booking_request.related_booking_id,
        "billing_option": booking_request.billing_option,
        "confirmation_no": booking_request.confirmation_no,
        "cc_recipients": booking_request.cc_recipients,
        "pickup": booking_request.pickup,
        "drop": booking_request.drop,
        "mdate": cur_utc_time
    }

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.COORDINATOR.value])
def update_booking_data_by_booking_id(organizer: Organizer, booking_id: str, booking_request: HotelBookingCreate):
    """Update hotel booking information."""
    cur_utc_time = cutils.current_utc_time()
    booking_logger_obj = cutils.BookingLogger(organizer, booking_id, BookingType.HOTEL.value)
    filter_criteria = [HotelBooking.id == booking_id]
    records_to_update = prepare_booking_info(booking_request, cur_utc_time)
    booking_activity_logs = []

    record = crud.select_records(HotelBooking, filter_conditions=filter_criteria).first()
    existing_booking_info = obj_to_dict.hotel_booking_info_as_dict(record)

    fields_to_check = [
        "city",
        "trip_type",
        "no_of_adults",
        "no_of_children",
        "no_of_rooms",
        "description",
        "room_type",
        "confirmation_no",
        "cc_recipients",
        "billing_option",
        "related_booking_id",
        "pickup",
        "drop"
    ]

    for field in fields_to_check:
        prev_value = existing_booking_info[field]
        cur_value = records_to_update[field]
        
        if prev_value != cur_value:
            kwargs = { f"prev_{field}": prev_value, f"cur_{field}": cur_value}
            booking_logger_obj.log_change(event=f"{field}_change", **kwargs)

    if existing_booking_info["cost_centre"]["code"] != booking_request.cost_centre.code:
        booking_logger_obj.log_change(event="cost_centre_change", prev_cost_centre=existing_booking_info["cost_centre"]["code"], cur_cost_centre=booking_request.cost_centre.code)
    
    if existing_booking_info["check_in"] != booking_request.check_in:
        booking_logger_obj.log_change(event="check_in_change", prev_check_in=existing_booking_info["check_in"].isoformat(), cur_check_in=booking_request.check_in.isoformat())
    
    if existing_booking_info["check_out"] != booking_request.check_out:
        booking_logger_obj.log_change(event="check_out_change", prev_check_out=existing_booking_info["check_out"].isoformat(), cur_check_out=booking_request.check_out.isoformat())

    # Update guest info
    update_guests_data_by_booking_id(booking_id, booking_request.guests, booking_logger_obj)
    crud.update_records(HotelBooking, filter_criteria=filter_criteria, records_to_update=records_to_update)
    
    booking_activity_logs = booking_logger_obj.get_booking_activity_log()
    if booking_activity_logs:
        crud.insert_records(BookingActivityLog, booking_activity_logs)

    return {
        "booking_id": booking_id,
        "bid": booking_request.bid,
        "message": "Successfully updated booking info"
    }

@transactional
def update_guests_data_by_booking_id(booking_id: str, guests: List[GuestCreate], booking_logger_obj: cutils.BookingLogger):    
    """Update hotel guest information."""
    for guest in guests:
        filter_criteria = [HotelBookingGuest.id == guest.hotel_booking_guest_id]
        guest_name = guest.name
        
        if guest.hotel_booking_guest_id and guest.delete:
            crud.delete_record(HotelBookingGuest, filter_criteria)
            booking_logger_obj.log_change(event="guest_delete_change", guest_name=guest_name)
        else:
            hotel_booking_guest_info_as_dict = {
                "booking_id": booking_id,
                "is_primary": guest.is_primary,
                "email": guest.email,
                "name": guest.name,
                "mobile": guest.mobile,
                "rank": guest.rank,
                "vessel_name": guest.vessel_name,
                "internal_id": guest.internal_id
            }
            if guest.hotel_booking_guest_id:
                hotel_booking_guest_record = crud.select_records(HotelBookingGuest, filter_conditions=filter_criteria).first()
                
                for field in ["email", "mobile", "name", "is_primary", "rank", "vessel_name", "internal_id"]:
                    prev_value = getattr(hotel_booking_guest_record, field)
                    cur_value = hotel_booking_guest_info_as_dict[field]
                    
                    if prev_value != cur_value:
                        kwargs = { f"prev_{field}": prev_value, f"cur_{field}": cur_value}
                        booking_logger_obj.log_change(event="guest_edit_change", guest_name=guest_name, **kwargs)
                        
                crud.update_records(HotelBookingGuest, filter_criteria, hotel_booking_guest_info_as_dict)
            else:
                crud.insert_record(HotelBookingGuest, **hotel_booking_guest_info_as_dict, cdate=cutils.current_utc_time())
                booking_logger_obj.log_change(event="guest_add_change", guest_name=guest_name)

def build_sort_criteria_for_hotel_report(sort):
    sort_field_mapping = {
        "check_in": HotelBooking.check_in,
        "check_out": HotelBooking.check_out,
        "invoice_date": HotelInvoice.cdate,
        "booking_date": HotelBooking.cdate,
        "gross_taxable_amount": HotelInvoice.taxable_amount,
        "gross_non_taxable_amount": HotelInvoice.non_taxable_amount,
        "invoice_amount": HotelInvoice.total_amount,
    }
    return cutils.build_sort_criteria(sort_field_mapping, sort)

def build_job_reports_json(latest_booking_event):
    return func.jsonb_build_object(
        "S.No", func.row_number().over(order_by=HotelBooking.cdate.desc()),
        "Booking ID", HotelBooking.bid,
        "Booked By", Coordinator.name,
        "Booked Date", cutils.format_booking_datetime(HotelBooking.cdate, const.DATE_FORMAT),
        "Check In", func.to_char(HotelBooking.check_in, const.DATE_FORMAT),
        "Check Out", func.to_char(HotelBooking.check_out, const.DATE_FORMAT),
        "Trip Type", func.initcap(HotelBooking.trip_type),
        "Organizer Name", func.coalesce(Organizer.name, ''),
        "Hotel Name", func.coalesce(Vendor.name, ''),
        "City", func.initcap(HotelBooking.city),
        "Status", func.initcap(func.replace(latest_booking_event.c.event, '_', ' ')),
        "Cost Centre", CostCentre.code,
        "Guest Name", HotelBookingGuest.name,
        "Rank", HotelBookingGuest.rank,
        "Vessel Name", HotelBookingGuest.vessel_name,
        "Internal ID", HotelBookingGuest.internal_id,
        "Billing Option", func.coalesce(HotelBooking.billing_option, '')
    )

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_job_reports(user: Organizer, **filters):
    latest_booking_event = aliased(latest_booking_event_query())
    select_cols = [build_job_reports_json(latest_booking_event)]
    join_conditions = [
        (latest_booking_event, latest_booking_event.c.booking_id == HotelBooking.id),
        (HotelBookingGuest, HotelBookingGuest.booking_id == HotelBooking.id),
        (CostCentre, CostCentre.id == HotelBooking.cost_centre_id),
        (Coordinator, Coordinator.id == HotelBooking.coordinator_id),
        (Organizer, Organizer.id == HotelBooking.organizer_id, 'left'),
        (Vendor, Vendor.id == HotelBooking.vendor_id, 'left')
    ]
    filter_conditions = build_filter_conditions(filters, latest_booking_event)
    
    order_by = build_sort_criteria_for_hotel_report(filters.get("sort"))
    query = crud.select_records(
        primary_table=HotelBooking,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        order_by=order_by
    )

    #Return excel as response if the download is True, else return paginated data
    if filters.get("download"):   
        result = query.all()
        job_reports = list(chain.from_iterable(result))
        columns = const.HOTEL_JOB_REPORT_COLUMNS
        df = pd.DataFrame(job_reports, columns=columns)
        return generate_excel_stream_response(df)

    response = app_utils.get_paginated_data(query, filters, output_name="job_reports")
    response["headers"] = const.HOTEL_JOB_REPORT_COLUMNS 
    return response

def build_invoice_reports_json():
    return func.jsonb_build_object(
        "S.No", func.row_number().over(order_by=HotelInvoice.cdate.desc()),
        "Booking ID", HotelBooking.bid,
        "Invoice Date", cutils.format_booking_datetime(HotelInvoice.cdate, const.DATE_FORMAT),
        "Invoice No", HotelInvoice.invoice_no,
        "Gross Amount (Taxable Amount)", HotelInvoice.taxable_amount,
        "Gross Amount (Non-Taxable Amount)", HotelInvoice.non_taxable_amount,
        "CGST Amount", HotelInvoice.cgst_amount,
        "SGST Amount", HotelInvoice.sgst_amount,
        "Total Invoice Amount", HotelInvoice.total_amount,
        "PO Number", func.coalesce(HotelInvoice.po_number, ''),
        "Booked By", Coordinator.name,
        "Booked Date", cutils.format_booking_datetime(HotelBooking.cdate, const.DATE_FORMAT),
        "Cost Centre", CostCentre.code,
        "GST No", func.coalesce(CostCentre.gstin_no, ''),
        "Check In", func.to_char(HotelBooking.check_in, const.DATE_FORMAT),
        "Check Out", func.to_char(HotelBooking.check_out, const.DATE_FORMAT),
        "Trip Type", func.initcap(HotelBooking.trip_type),
        "Hotel Name", func.coalesce(Vendor.name, ''),
        "City", func.initcap(HotelBooking.city),
        "Billing Option", func.coalesce(HotelBooking.billing_option, '')
    )
@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_invoice_reports(user: Organizer, **filters):
    select_cols = [build_invoice_reports_json()]
    join_conditions = [
        (HotelBooking, HotelBooking.id == HotelInvoice.booking_id),
        (HotelBookingGuest, HotelBookingGuest.booking_id == HotelBooking.id),
        (CostCentre, CostCentre.id == HotelBooking.cost_centre_id),
        (Coordinator, Coordinator.id == HotelBooking.coordinator_id),
        (Organizer, Organizer.id == HotelBooking.organizer_id, 'left'),
        (Vendor, Vendor.id == HotelBooking.vendor_id, 'left')
    ]
    filter_conditions = build_filter_conditions(filters)
    
    order_by = build_sort_criteria_for_hotel_report(filters.get("sort"))
    query = crud.select_records(
        primary_table=HotelInvoice,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        order_by=order_by
    )

    #Return excel as response if the download is True, else return paginated data
    if filters.get("download"):   
        result = query.all()
        invoice_reports = list(chain.from_iterable(result))
        columns = const.HOTEL_INVOICE_REPORT_COLUMNS
        df = pd.DataFrame(invoice_reports, columns=columns)
        return generate_excel_stream_response(df)

    response = app_utils.get_paginated_data(query, filters, output_name="invoice_reports")
    response["headers"] = const.HOTEL_INVOICE_REPORT_COLUMNS 
    return response