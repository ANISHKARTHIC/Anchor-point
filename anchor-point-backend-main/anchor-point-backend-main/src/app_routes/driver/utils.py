from fastapi import BackgroundTasks
import string
import random
import os
import pytz
from app_models import crud
from app_models.models import (
    BookingEvent,
    BookingLogs,
    Guest,
    Location,
    Organizer,
    Driver,
    DriverCharge,
    Booking,
    Vendor,
    VendorCity
)
from app_routes.booking.schema import BookingStatus, TravelMode
from app_routes.booking import utils as booking_utils
from app_routes.driver import utils as driver_utils
from app_routes.driver.schema import DriverBase, DriverChargesBase, UpdateDriverCharges
from app_routes.invoice.schema import InvoiceEvent
from app_routes.organizer.schema import UpdateBookingStatus
from app_routes.vendor.schema import DriverInfo
from app_routes.vendor.utils import get_vendor_by_id
from app_routes.vehicle.utils import get_vehicle_model_by_id
from app_schemas.schema import Role
from app_utils.decorators import transactional, email_exists_or_raise
from app_configs import constants as const
from app_utils import utils as app_utils
from common_utils import utils as cutils
from app_utils import exception as ex
from itertools import chain
from sqlalchemy import func, exc, or_
from sqlalchemy.orm import aliased
from logger import logger as logging
from twilio.base.exceptions import TwilioRestException
from common_utils import obj_to_dict

@transactional
def get_driver_otp_by_booking_id(booking_id: str):
    if app_utils.get_booking_by_booking_id(booking_id):
        select_cols = [Driver.otp]
        join_conditions = [(Driver, Booking.driver_id == Driver.id)]
        filter_condition = [Booking.id == booking_id]
        return crud.select_records(
            primary_table=Booking,
            select_cols=select_cols,
            filter_conditions=filter_condition,
            join_conditions=join_conditions,
        ).scalar()

@transactional
def verify_invoice_for_booking(booking_id: str):
    filter_conditions = [BookingEvent.booking_id == booking_id, 
                            or_(
                            BookingEvent.event == InvoiceEvent.INVOICE_CREATED.value,
                            BookingEvent.event == InvoiceEvent.INVOICE_APPROVED.value,
                            BookingEvent.event == InvoiceEvent.INVOICE_REJECTED.value,
                                )]
    result = crud.select_records(BookingEvent, filter_conditions=filter_conditions).first()
    if result:
        raise ex.LoginDeniedError
    
@transactional
def login(booking_id: str, otp: str):
    verify_invoice_for_booking(booking_id)   
    driver_otp = get_driver_otp_by_booking_id(booking_id)
    if driver_otp == otp:
        return cutils.create_access_token(payload={"role": Role.DRIVER.value})
    raise ex.InvalidOrExpiredOTP


@transactional
def fetch_guests_info(booking_id: str):
    booking = app_utils.get_booking_by_booking_id(booking_id)
    return {
        "id": booking.id,
        "driver_name": booking.driver.name,
        "bid": booking.bid,
        "pickup_date": cutils.get_pickup_date(booking.booking_datetime),
        "pickup_time": cutils.get_pickup_time(booking.booking_datetime),
        "guests": app_utils.get_guests_info(booking_id)
    }


def generate_coordinate(coord_dict: dict) -> str:
    return f"{coord_dict['latitude']},{coord_dict['longitude']}"


def generate_guest_mapping(guest_name: str, coord: str, loc_type: str) -> dict:
    return {"type": loc_type, "name": guest_name, "coordinate": coord}


def build_guest_info(guest: dict, coordinate: str, address: str, type: str) -> dict:
    return {
        "type": type,
        "name": guest["name"],
        "email": guest["email"],
        "mobile": guest["mobile"],
        "address": address,
        "coordinate": coordinate,
    }


def generate_pickup_dropoff_data(guests: list[dict], driver_location: str) -> dict:
    data = {
        "pickup_dropoff_list": [],
        "guest_mapping": {
            driver_location: {"type": "driver", "coordinate": driver_location}
        },
    }

    for guest in guests:
        source_location = guest["source"]
        destination_location = guest["destination"]
        origin_coord = generate_coordinate(guest["source"])
        destination_coord = generate_coordinate(guest["destination"])

        pickup_info = build_guest_info(
            guest, origin_coord, source_location["address"], "pickup"
        )
        dropoff_info = build_guest_info(
            guest, destination_coord, destination_location["address"], "drop"
        )

        data["pickup_dropoff_list"].append(
            {"origin": origin_coord, "destination": destination_coord}
        )
        data["guest_mapping"][origin_coord] = pickup_info
        data["guest_mapping"][destination_coord] = dropoff_info

    return data


@transactional
def retrieve_booking_info_by_id(booking_id: str, role: str, location: str = None):
    response = {}
    guests_info = fetch_guests_info(booking_id)
    response.update(guests_info)

    if location:
        route_info = booking_utils.fetch_optimal_route(booking_id, location, role)
        response.update(route_info)

    return response


@transactional
def create_driver(driver_info: DriverBase):
    try:
        records_to_insert = driver_info.model_dump(exclude_unset=True)
        result = crud.insert_record(Driver, **records_to_insert)
        if result:
            return {
                "data": cutils.object_as_dict(result),
                "message": "Successfully created new driver record",
            }
    except Exception:
        raise ex.DatabaseOperationFailed(action="insert")


@transactional
@email_exists_or_raise(Organizer)
def update_driver(
    organizer: Organizer, driver_id: int, update_driver_request: DriverBase
):
    if get_driver_by_id(driver_id):
        filter_criteria = [Driver.id == driver_id]
        records_to_update = update_driver_request.model_dump(exclude_unset=True)
        result = crud.update_records(
            Driver, filter_criteria=filter_criteria, records_to_update=records_to_update
        )
        if result.rowcount:
            return {
                "message": f"Successfully updated driver details for id {driver_id}"
            }
        raise ex.DatabaseOperationFailed(action="update")


@transactional
def get_drivers():
    select_cols = [booking_utils.build_driver_json()]
    records = crud.select_records(primary_table=Driver, select_cols=select_cols).all()
    return {"data": list(chain.from_iterable(records))}


@transactional
def get_driver_by_id(driver_id):
    result = crud.select_records(
        primary_table=Driver, filter_conditions=[Driver.id == driver_id]
    ).first()
    if not result:
        raise ex.DriverNotFound
    return result


@transactional
@email_exists_or_raise(Organizer)
def delete_driver(organizer: Organizer, driver_id: int):
    if get_driver_by_id(driver_id):
        filter_criteria = [Driver.id == driver_id]
        result = crud.delete_record(Driver, filter_criteria=filter_criteria)
        if result.rowcount:
            return {"message": f"Successfully deleted driver record for id {driver_id}"}
        raise ex.DatabaseOperationFailed(action="delete")


def build_driver_charge_json():
    return func.json_build_object(
        "id",
        DriverCharge.id,
        "vendor_id",
        DriverCharge.vendor_id,
        "vehicle_model_id",
        DriverCharge.vehicle_model_id,
        "charge",
        DriverCharge.charge,
    ).label("driver_charge_json")

@transactional
@email_exists_or_raise(Organizer)
def create_driver_charge(
    organizer: Organizer, driver_charge_request: DriverChargesBase
):
    if app_utils.get_driver_charge_by_details(driver_charge_request.vendor_id, driver_charge_request.vehicle_model_id):
        raise ex.RecordExists(msg="The driver charge for this vehicle model already exists for the vendor.")

    records_to_insert = driver_charge_request.model_dump(exclude_unset=True)
    result = crud.insert_record(DriverCharge, **records_to_insert)
    
    if not result:
        raise ex.DatabaseOperationFailed(action="insert")
    return {
        "driver_charge_id": result.id,
        "message": "Successfully created new driver charge record",
    }

@transactional
@email_exists_or_raise(Organizer)
def get_driver_charges(organizer: Organizer, vendor_id):
    select_cols = [build_driver_charge_json()]
    filter_conditions = []
    if vendor_id:
        filter_conditions.append(DriverCharge.vendor_id == vendor_id)
    records = crud.select_records(
        primary_table=DriverCharge, select_cols=select_cols, filter_conditions=filter_conditions
    ).all()
    return {"driver_charges": list(chain.from_iterable(records))}


@transactional
@email_exists_or_raise(Organizer)
def get_driver_charge_by_id(organizer: Organizer, driver_charge_id: int):
    select_cols = [build_driver_charge_json()]
    filter_conditions = [DriverCharge.id == driver_charge_id]
    record = crud.select_records(
        primary_table=DriverCharge,
        select_cols=select_cols,
        filter_conditions=filter_conditions,
    ).first()
    if record:
        return {"driver_charge": record.driver_charge_json}
    raise ex.RecordNotFound(model="Driver Charge")


@transactional
@email_exists_or_raise(Organizer)
def update_driver_charges(
    organizer: Organizer,
    update_requests: UpdateDriverCharges,
):
    result_messages = []
    response = None
    for driver_charge in update_requests.driver_charges:
        try:
            driver_charge_info = app_utils.get_model_record_by_id(DriverCharge, driver_charge.id)
            filter_criteria = [DriverCharge.id == driver_charge_info.id]
            records_to_update = driver_charge.model_dump(exclude_unset=True)
            result = result = crud.update_records(
                DriverCharge, filter_criteria=filter_criteria, records_to_update=records_to_update
            )

            if not result.rowcount:
                 raise ex.DatabaseOperationFailed(action="update")

            response = {
                "status": "success",
                "reason": f"Successfully updated driver charge for id {driver_charge_info.id}",
            }
        except ex.RecordNotFound:
            response = {"status": "failed", "detail": f"Driver charge with id {driver_charge.id} not exists"}
        except ex.DatabaseOperationFailed:
            response = {"status": "failed", "detail": f"Failed to update driver charge id {driver_charge.id}"}
        finally:
            result_messages.append(response)

    return {"message": result_messages}


@transactional
@email_exists_or_raise(Organizer)
def delete_driver_charge(organizer: Organizer, driver_charge_id: int):
    driver_charge_info = get_driver_charge_by_id(organizer, driver_charge_id).get(
        "driver_charge"
    )
    filter_criteria = [DriverCharge.id == driver_charge_id]
    records_to_update = {"is_active": False}
    result = crud.update_records(DriverCharge, filter_criteria=filter_criteria, records_to_update=records_to_update)
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="delete")

    return {
        "driver_charge_id": driver_charge_id,
        "message": f"Successfully deleted driver charge",
    }

@transactional
def fetch_booking_details(booking_id: str):
    select_cols = [
        func.json_build_object(
            "booking_id",
            Booking.id,
            "driver_name",
            Driver.name,
            "driver_mobile",
            Driver.primary_mobile,
            "vendor_name",
            Vendor.name,
            "vendor_mobile",
            Vendor.primary_mobile,
            "pickup_date",
            cutils.format_booking_datetime(Booking.booking_datetime, const.DATE_FORMAT),
            "pickup_time",
            cutils.format_booking_datetime(Booking.booking_datetime, const.TIME_FORMAT),
            "otp",
            Driver.otp,
        )
    ]
    filter_conditions = [Booking.id == booking_id]
    join_conditions = [
        (Vendor, Booking.vendor_id == Vendor.id),
        (Driver, Booking.driver_id == Driver.id),
    ]
    return crud.select_records(
        Booking,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
    ).scalar()


def get_driver_whatsapp_body(payload, otp, url):
    return const.DRIVER_WHATSAPP_BODY.format(
                pickup_date=payload["booking"]["pickup_date"],
                pickup_time=payload["booking"]["pickup_time"],
                vendor_name=payload["vendor"]["name"],
                vendor_contact=payload["vendor"]["primary_mobile"],
                guest_name=payload["guests"][0]["name"],
                guest_contact=payload["guests"][0]["mobile"],
                url=url,
                otp=otp,
                contact_support=os.environ.get("CONTACT_SUPPORT")
            )

def get_driver_whatsapp_body_content_variables(guest, booking, vendor, otp, url):
    return {
        "1": booking["pickup_date"],
        "2": booking["pickup_time"],
        "3": vendor["name"],
        "4": vendor["primary_mobile"],
        "5": guest["name"],
        "6": guest["mobile"],
        "7": otp,
        "8": url,
        "9": os.environ.get("CONTACT_SUPPORT")
    }

def get_driver_sms_body(payload, url):
    return const.DRIVER_SMS_BODY.format(
        pickup_date=payload["booking"]["pickup_date"],
        pickup_time=payload["booking"]["pickup_time"],
        url=url
    )


def get_guest_whatsapp_body(payload, guest):
    return const.GUEST_WHATSAPP_BODY.format(
                guest_name=guest["name"],
                pickup_date=payload["booking"]["pickup_date"],
                pickup_time=payload["booking"]["pickup_time"],
                driver_name=payload["driver"]["name"],
                driver_contact=payload["driver"]["primary_mobile"],
                vehicle_no=payload["driver"]["vehicle_no"],
                contact_support=os.environ.get("CONTACT_SUPPORT")
            )

def get_guest_whatsapp_body_content_variables(guest, booking, driver):
    return {
        "1": guest["name"],
        "2": booking["pickup_date"],
        "3": booking["pickup_time"],
        "4": driver["vehicle_no"],
        "5": driver["name"],
        "6": driver["primary_mobile"],
        "7": os.environ.get("CONTACT_SUPPORT")
    }

def get_guest_sms_body(payload, guest):
    return const.SMS_BODY.format(
                pickup_date=payload["booking"]["pickup_date"],
                guest_name=guest["name"],
                driver_mobile=payload["driver"]["primary_mobile"],
                vehicle_no=payload["driver"]["vehicle_no"],
            )

@transactional
def send_driver_sms(payload, messaging_type = "whatsapp"):
    try:
        otp, url = "NA" , "NA"
        if payload["booking"]["travel_mode"] == TravelMode.STANDARD.value:
            otp=payload["driver"]["otp"]
            url = const.DRIVER_LOGIN_URL.format(
                api_url=os.getenv("API_URL"),
                booking_id=payload["booking"]["id"],
                otp=otp
            )
        content_sid = const.DRIVER_MESSAGE_CONTENT_SID
        content_variables = get_driver_whatsapp_body_content_variables(payload["guests"][0], payload["booking"], payload["vendor"], otp, url)
        to = payload["driver"]["primary_mobile"]
        callback_url = const.WHATSAPP_DRIVER_CALLBACK_URL.format(api_url=os.getenv("API_URL"))
        
        if messaging_type == "whatsapp":
            body = get_driver_whatsapp_body(payload, otp, url)
        else:
            body = get_driver_sms_body(payload, url)

        message_sid = cutils.send_message(messaging_type=messaging_type, to=to, body=body, content_sid=content_sid, content_variables=content_variables, callback_url=callback_url)
        records_to_update = {"message_sid": message_sid}
        crud.update_records(Driver, filter_criteria=[Driver.id == payload["driver"]["id"]], records_to_update=records_to_update)
    except TwilioRestException as e:
        err_msg = str(e)
        logging.error(err_msg)
        raise ex.SMSException(err_msg)


def update_driver_booking_status(
    booking_id: str, vendor: Vendor, driver: Driver, driver_info_request: DriverInfo
):
    metadata = {
        "vendor_id": vendor.id,
        "vendor_name": vendor.name,
    }
    status = None
    if driver_info_request.action == "assign":
        metadata.update({"driver_id": driver.id, "driver_name": driver.name})
        status = BookingStatus.DRIVER_ASSIGNED.value
    else:
        previous_driver_record = get_driver_by_id(
            driver_info_request.previous_driver_id
        )
        metadata.update(
            {
                "previous_driver_id": previous_driver_record.id,
                "previous_driver_name": previous_driver_record.name,
                "driver_id": driver.id,
                "driver_name": driver.name,
            }
        )
        status = BookingStatus.DRIVER_REASSIGNED.value

    update_booking_request = UpdateBookingStatus(
        booking_id=booking_id, status=status, metadata=metadata
    )
    return booking_utils.update_booking_status(
        vendor.email, Role.VENDOR.value, update_booking_request
    )


@transactional
def send_guests_sms(payload, messaging_type = "whatsapp"):
    try:
        for guest in payload.get("guests"):
            content_sid = const.GUEST_MESSAGE_CONTENT_SID
            content_variables = get_guest_whatsapp_body_content_variables(guest, payload["booking"], payload["driver"])
            to = guest["mobile"]
            callback_url = const.WHATSAPP_GUEST_CALLBACK_URL.format(api_url=os.getenv("API_URL"))
            
            if messaging_type == "whatsapp":
                body = get_guest_whatsapp_body(payload, guest)
            else:
                body = get_guest_sms_body(payload, guest)
            message_sid = cutils.send_message(messaging_type=messaging_type, to=to, body=body, content_sid=content_sid, content_variables=content_variables, callback_url=callback_url)
            filter_criteria=[BookingLogs.id == guest["booking_log_id"]]
            records_to_update = {"guest_message_sid": message_sid}
            crud.update_records(BookingLogs, filter_criteria=filter_criteria, records_to_update=records_to_update)
        return {"message": "SMS sent successfully"}
    except TwilioRestException as e:
        err_msg = str(e)
        logging.error(err_msg)
        raise ex.SMSException(err_msg)


@transactional
@email_exists_or_raise(Vendor)
def create_driver_info(
    vendor: Vendor, booking_id: str, driver_info_request: DriverInfo, background_tasks: BackgroundTasks
):
    try:
        booking = app_utils.get_booking_by_booking_id(booking_id)
        records_to_insert = {
            "name": driver_info_request.name,
            "vehicle_no": driver_info_request.vehicle_no,
            "primary_mobile": driver_info_request.primary_mobile,
            "secondary_mobile": driver_info_request.secondary_mobile,
            "otp": "".join(random.choices(string.digits, k=5)),
        }
        driver_record = crud.insert_record(Driver, **records_to_insert)
        update_driver_booking_status(
            booking_id, vendor, driver_record, driver_info_request
        )
        booking_logs =  crud.select_records(
            BookingLogs, filter_conditions=[BookingLogs.booking_id == booking_id])
        vendor = get_vendor_info(booking_id)
        coordinator_info = obj_to_dict.coordinator_info_as_dict(booking.coordinators)
        guests_info = [{"booking_log_id": booking_log.id, "email": booking_log.email, "name": booking_log.name, "mobile": booking_log.mobile} for booking_log in booking_logs]
        payload = {
            "booking": obj_to_dict.booking_info_as_dict(booking),
            "driver": obj_to_dict.driver_info_as_dict(driver_record),
            "vendor": obj_to_dict.vendor_info_as_dict(vendor.vendor),
            "guests": guests_info
        }
        if cutils.current_utc_time() <= booking.booking_datetime:
            send_driver_sms(payload)
            send_guests_sms(payload)
            background_tasks.add_task(send_coordinator_mail, driver_info_request.action, coordinator_info, payload["booking"], payload["driver"], guests_info)
        
        return {"message": "Successfully updated driver details"}
    except exc.SQLAlchemyError as err:
        logging.error(err)
        raise ex.DatabaseOperationFailed(action="insert")
    
def send_coordinator_mail(action, coordinator, booking, driver, guests_info):
    if action == "assign":
        subject = const.DRIVER_ASSIGN_MAIL_SUBJECT
        body = const.DRIVER_ASSIGN_MAIL_BODY
    else:
        subject = const.DRIVER_REASSIGN_MAIL_SUBJECT 
        body = const.DRIVER_REASSIGN_MAIL_BODY

    cc_recipient_emails = [guest["email"] for guest in guests_info]
    guest_details = [
        (
            f"Name: {guest['name']}\n"
            f"Email: {guest['email']}"
            f"{' | Alternate Email: ' + guest['alternate_email'] if guest.get('alternate_email') else ''}\n"
            f"Contact: {guest['mobile']}"
            f"{' | Alternate Contact: ' + guest['alternate_contact'] if guest.get('alternate_contact') else ''}\n"
        )
        for guest in guests_info
    ]    
    body = body.format(
        coordinator_name=coordinator["name"], contact_support=os.environ.get("CONTACT_SUPPORT"),
        bid=booking["bid"], pickup_date=booking["pickup_date"], pickup_time=booking["pickup_time"],
        driver_name=driver["name"], driver_contact=driver["primary_mobile"], vehicle_no=driver["vehicle_no"], guest_details="".join(guest_details)
    )
    cutils.send_mail(recipient_email=coordinator["email"], subject=subject, body=body, cc_recipient_emails=cc_recipient_emails)

def get_vendor_info(booking_id):

    join_conditions = [(Vendor, Vendor.id == Booking.vendor_id), (VendorCity, VendorCity.id == Vendor.city_id )]
    filter_condition = [Booking.id == booking_id]
    
    return crud.select_records(
        primary_table=Booking,
        filter_conditions=filter_condition,
        join_conditions=join_conditions,
    ).limit(1).scalar()