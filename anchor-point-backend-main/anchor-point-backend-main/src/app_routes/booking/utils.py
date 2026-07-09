from datetime import datetime, timedelta
from itertools import chain
from operator import and_
import pytz
import pandas as pd
from app_routes.invoice.utils import build_sort_criteria_for_cab_report, generate_excel_stream_response
from app_routes.organizer.utils import build_organizer_json
from app_routes.plan.utils import build_plan_json
from app_routes.vendor.utils import build_vendor_json
import googlemaps
import os
import math
import uuid
from typing import List, Union
from app_routes.organizer.schema import UpdateBookingStatus
from app_routes.organizer.utils import assign_vendor_mail
from fastapi import BackgroundTasks
from fastapi.responses import HTMLResponse
from app_schemas.schema import Role
from common_utils.push_notifications import NotificationSenderFactory
from sqlalchemy import func, desc, asc, literal,  TIMESTAMP, case
from sqlalchemy.orm import aliased
from sqlalchemy.exc import SQLAlchemyError
from jinja2 import Environment, FileSystemLoader
import os.path as path
from app_models import crud
from app_models.models import (
    BookingOptimalRoute,
    Coordinator,
    CostCentre,
    HotelBookingGuest,
    Invoice,
    Organizer,
    Booking,
    BookingLogs,
    BookingEvent,
    Driver,
    Guest,
    Location,
    Package,
    Plan,
    Trip,
    TripEvent,
    Vehicle,
    VehicleModel,
    Vendor,
    VendorBookings,
    VendorCity,
    VendorInvoices,
    Waypoint,
    BookingActivityLog
)
from app_routes.booking.schema import (
    BookingModel,
    BookingType,
    EditCabBookingModal,
    LocationInfo,
    GuestInfo,
    BookingStatus,
    TravelMode,
)
from app_schemas.schema import GuestModel
from app_utils.utils import (
    build_coordinator_json,
    convert_date_str_to_utc,
    get_booking_by_booking_id,
    get_model_by_role,
    latest_booking_event_query,
)
from common_utils import utils as cutils
from common_utils import obj_to_dict
from app_utils import utils as app_utils
from app_utils.decorators import transactional, email_exists_or_raise, verify_jwt_role_and_email
from app_configs import constants as const
from app_utils import exception as ex
from logger import logger as logging
from app_routes.vendor.schema import VendorBookingStatus
from app_dependencies.schedulers.notify_vendor import create_vendor_assignment_job
base_directory = path.abspath(path.join(__file__, "../../.."))
templates_dir = os.path.join(base_directory, const.TEMPLATES_DIR)

env = Environment(loader=FileSystemLoader(templates_dir))

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_booking_status(user):
    response =  const.ALL_BOOKING_STATUS if isinstance(user, Organizer)  else const.VENDOR_BOOKING_STATUS
    return response

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value, Role.VENDOR.value])
def get_hotel_booking_status(user):
    response =  const.VENDOR_HOTEL_BOOKING_STATUS if isinstance(user, Vendor)  else const.ALL_HOTEL_BOOKING_STATUS
    return response

@transactional
def process_booking_flow(
    booking_request: BookingModel,
    background_tasks: BackgroundTasks,
    booking_status: str,
    coordinator: Coordinator,
    organizer: Organizer = None,

):
    booking_record = insert_booking_record(booking_request, coordinator.id)
    insert_booking_logs(booking_request.data.travel_mode, booking_request.data.guests, booking_record.id)
    insert_booking_event(
        booking_id=booking_record.id,
        event=booking_status,
        metadata=get_booking_event_metadata(
            booking_request.data.pick_up_date, 
            booking_request.data.pick_up_time,
            coordinator, 
            organizer
        )
    )
    create_vendor_assignment_job(booking_record.id,booking_record.booking_datetime)

    send_booking_notification(booking_record.id, booking_status)
    
    if cutils.current_utc_time() <= booking_record.booking_datetime:
        send_booking_creation_email(booking_record.bid, booking_request, background_tasks, booking_id=booking_record.id, to_email=coordinator.email)

    return booking_record

@transactional
@email_exists_or_raise(Coordinator)
def create_booking(
    coordinator: Coordinator,
    booking_request: BookingModel,
    background_tasks: BackgroundTasks,
):
    """
    Create a new booking and related records.
    Args:
        coordinator (Coordinator): The coordinator creating the booking.
        booking_request (BookingModel): The booking request data.
    Returns:
        dict: A dictionary containing the booking ID and a success message.
    """
    try:
        pick_up_dates = booking_request.data.pick_up_date
        booking_status = BookingStatus.PENDING.value
        
        if isinstance(pick_up_dates, list):
            booking_ids, bids = [], []
            
            for pick_up_date in pick_up_dates:
                booking_request.data.pick_up_date = pick_up_date
                booking_record = process_booking_flow(booking_request, background_tasks, booking_status, coordinator)
                bids.append(booking_record.bid)
                booking_ids.append(booking_record.id)
            
            return {
                "booking_id": booking_ids,
                "bid": bids,
                "message": "Successfully created booking records",
            }
        else:
            booking_record = process_booking_flow(booking_request, background_tasks, booking_status, coordinator)
            return {
                "booking_id": booking_record.id,
                "bid": booking_record.bid,
                "message": "Successfully created new booking record",
            }
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")


def get_booking_event_metadata(
    pick_up_date:str, pick_up_time: str,  coordinator: Coordinator, organizer: Organizer = None) -> dict:
    datetime_obj =  cutils.convert_to_datetime(pick_up_date, pick_up_time)
    response =  {
        "coordinator_id": coordinator.id,
        "coordinator_name": coordinator.name,
        "booking_datetime": datetime_obj.strftime(const.DATETIME_TZ),
    }
    if organizer:
        response.update({"orgaizer_id": organizer.id, "organizer_name": organizer.name})
    return response

def send_booking_notification(booking_id: int, status: str):
    NotificationSenderFactory.create_notification_sender(
        booking_id=booking_id, status=status
    ).send_notification()
    logging.info(f"Booking notification for booking {booking_id} has been sent.")


def send_booking_creation_email(bid: str, booking_request: BookingModel, background_tasks: BackgroundTasks, booking_id: int, to_email: str):
    
    try:
        cc_recipient_emails = [guest.email for guest in booking_request.data.guests]
        email_body = render_template(
            const.BOOKING_CREATED_HTML,
            booking_id=booking_id,
            booking_request=booking_request,
            bid=bid,
            contact_support=os.environ.get("CONTACT_SUPPORT")
        )
        background_tasks.add_task(
            cutils.send_mail,
            recipient_email=to_email,
            subject=const.BOOKING_CREATED_MAIL_SUBJECT,
            body=email_body,
            cc_recipient_emails=cc_recipient_emails,
            content_type="html",
        )
        logging.info(f"New Booking request email to coordinator for booking {booking_id} has been sent.")
    except Exception as e:
        logging.error(f"Error sending booking creation email for booking {booking_id}: {str(e)}")

@transactional
def get_plan_by_booking_id(email:str, role:str, booking_id:int):
    model = app_utils.get_model_by_role(role)

    if not model:
        raise ex.InvalidRole

    if not app_utils.is_valid_email_for_role(email, model):
        raise ex.EmailNotFound
    booking_info = get_booking_by_booking_id(booking_id)

    plan = booking_info.plan
    if plan:
        return {
            "plan": obj_to_dict.package_info_as_dict(plan.package),
            "vehicle": obj_to_dict.vehicle_info_as_dict(plan.vehicle),
            "vendor": obj_to_dict.vendor_info_as_dict(plan.vendor),
            "cost": plan.vendor_cost,
            "extra_distance_cost": plan.extra_distance_cost,
            "extra_hour_cost": plan.extra_hour_cost,
        }
    raise ex.PlanNotAssigned

@transactional
def insert_booking_record(booking_request: BookingModel, coordinator_id: int):
    """
    Insert a new booking record into the database.
    Args:
        booking_request (BookingModel): The booking request data.
        coordinator (Coordinator): The coordinator creating the booking.
    Returns:
        Booking: The created booking record.
    """
    data = booking_request.data
    records_to_insert = {
        "type": booking_request.type,
        "cab_type": data.cab_type,
        "booking_datetime": cutils.convert_to_datetime(
            data.pick_up_date, data.pick_up_time
        ),
        "bid": func.generate_bid_id(),
        "po_number": data.po_number,
        "coordinator_id": coordinator_id,
        "cost_centre_id": data.cost_centre_id,
        "organizer_id": data.organizer_id,
        "city_id": data.city_id,
        "travel_mode": data.travel_mode,
        "cc_recipients": booking_request.cc_recipients,
        "description": booking_request.description
    }
    return crud.insert_record(Booking, **records_to_insert)


@transactional
def insert_booking_logs(booking_logs: List[dict]):
    """
    Insert multiple booking logs into the database.
    Args:
        booking_logs (List[dict]): List of booking logs to insert.
    Returns:
        List[BookingLogs]: List of inserted booking logs.
    """
    return crud.insert_records(BookingLogs, booking_logs)


@transactional
def insert_booking_event(booking_id: uuid, metadata: dict, event: str):
    """
    Insert a booking event record into the database.
    Args:
        booking_id (uuid): The ID of the booking for which the event is being created.
    Returns:
        BookingEvent: The created booking event record.
    """
    records_to_insert = {
        "booking_id": booking_id,
        "event": event,
        "meta_data": metadata,
    }
    return crud.insert_record(BookingEvent, **records_to_insert)


@transactional
def insert_booking_logs(travel_mode: str, guest_info: List[GuestInfo], booking_id: uuid):
    """
    Insert guest records and booking logs for a booking.
    Args:
        guest_info (list[GuestInfo]): List of guest information.
        booking_id (uuid): The ID of the booking.
    Returns:
        List[dict]: List of booking logs created.
    """
    for guest in guest_info:
        source_location_id = create_location_record("pickup", guest.source).id
        destination_location_id = create_location_record("drop", guest.destination).id if guest.destination and travel_mode == TravelMode.STANDARD.value else None
        date_of_duty = cutils.convert_to_datetime(guest.date_of_duty, guest.start_time) if guest.date_of_duty and guest.start_time else None
        booking_log_record = crud.insert_record(
            BookingLogs,
            booking_id=booking_id,
            source_id=source_location_id,
            destination_id=destination_location_id,
            email=guest.email,
            name=guest.name,
            mobile=guest.mobile,
            alternate_email= guest.alternate_email,
            alternate_mobile = guest.alternate_mobile,
            rank=guest.rank,
            internal_id=guest.internal_id,
            vessel_name=guest.vessel_name,
            flight_details=guest.flight_details,
            date_of_duty=date_of_duty,
        )
        store_waypoints_for_guest(booking_log_record.id, guest.waypoints)

@transactional
def store_waypoints_for_guest(booking_log_id: int, waypoints: List[dict]):
    try:
        if waypoints:       
            records_to_insert = [
                {
                    "booking_log_id": booking_log_id,
                    "location_id": create_location_record("stop", waypoint).id,
                }   
                for waypoint in waypoints
            ]
            return crud.insert_records(Waypoint, records_to_insert)
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")


@transactional
def create_location_record(address_type, location_info: LocationInfo):
    """
    Create a location record.
    Args:
        location_info (LocationInfo): Location information.
    Returns:
        Location: The location record.
    """
    
    if location_info.latitude == 0 or location_info.longitude == 0:
        raise ex.InvalidLatLong(address_type=address_type)
    
    location_record = crud.insert_record(
        Location, 
        address=location_info.address,
        landmark=location_info.landmark,
        name=location_info.name,
        latitude=location_info.latitude,
        longitude=location_info.longitude,
        title=location_info.title 
    )
    return location_record


@transactional
def get_booking_history_info(email: str, role: str, booking_id: str):
    """
        Retrieve booking history information for the provided booking_id based on role.
    Args:
        email (str): The email address of the user.
        role (str): The role of the user.
        booking_id (str) : The ID of the booking for which events are retrieved.
    Returns:
        result: dict A dictionary containing a list of booking events for the provided booking.
    """
    try:
        model = get_model_by_role(role)
        if is_valid_email_or_raise_exception(model, email):
            records = crud.select_records(BookingEvent, filter_conditions=[BookingEvent.booking_id == booking_id], order_by=[asc(BookingEvent.cdate)]).all()
            return {"booking_history": [obj_to_dict.booking_history_as_dict(booking_history) for booking_history in records]}
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="get")


def build_driver_json():
    return func.json_build_object(
        "id",
        Driver.id,
        "name",
        Driver.name,
        "vehicle_no",
        Driver.vehicle_no,
        "primary_mobile",
        Driver.primary_mobile,
        "secondary_mobile",
        Driver.secondary_mobile,
        "otp",
        Driver.otp,
    ).label("driver_json")


def build_booking_events_json_obj():
    return func.jsonb_build_object(
        "id",
        BookingEvent.id,
        "booking_id",
        BookingEvent.booking_id,
        "event",
        BookingEvent.event,
        "created_at",
        BookingEvent.cdate,
        "metadata",
        BookingEvent.meta_data,
    ).label("booking_events_json")


@transactional
def is_valid_email_or_raise_exception(model, email):
    result = crud.select_records(
        primary_table=model, filter_conditions=[model.email] == email
    ).first()
    if result:
        return True
    raise ex.EmailNotFound


@transactional
def update_booking_status(email: str, role: str, update_booking_request: UpdateBookingStatus):
    try:
        model = get_model_by_role(role)
        booking_id = update_booking_request.booking_id
        if is_valid_email_or_raise_exception(model, email):
            if get_booking_by_booking_id(booking_id):
                if update_booking_info(update_booking_request):
                    insert_new_booking_event(update_booking_request)
                    NotificationSenderFactory.create_notification_sender(
                        booking_request=update_booking_request,
                        booking_id=booking_id,
                        status=update_booking_request.status,
                    ).send_notification()
                    if update_booking_request.status == BookingStatus.VENDOR_REQUESTED.value:   
                        assign_vendor_mail(request=update_booking_request)
                    return {
                        "booking_id": booking_id,
                        "message": "Successfully updated booking status",
                    }
                raise ex.DatabaseOperationFailed(action="update")
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")


@transactional
def insert_new_booking_event(update_booking_request):
    if update_booking_request.status == BookingStatus.VENDOR_REQUESTED.value:
        plan_id = get_plan_id(update_booking_request.metadata)
        vendor_id = update_booking_request.metadata["vendor_id"]
        update_booking_request.metadata.update({"plan_id": plan_id})
        insert_vendor_booking_record(vendor_id, update_booking_request.booking_id, update_booking_request.metadata)
    records_to_insert = {
        "booking_id": update_booking_request.booking_id,
        "event": update_booking_request.status,
        "meta_data": update_booking_request.metadata,
    }
    return crud.insert_record(BookingEvent, **records_to_insert)


@transactional
def get_plan_id(metadata):
    package_id = metadata.get("package_id")
    vendor_id = metadata.get("vendor_id")
    vehicle_id = metadata.get("vehicle_id")

    return crud.select_records(
        primary_table=Plan,
        select_cols=[Plan.id],
        filter_conditions=[
            Plan.package_id == package_id,
            Plan.vendor_id == vendor_id,
            Plan.vehicle_id == vehicle_id,
        ],
    ).scalar()

def get_organizer_id_from_booking_id(booking_id):
    return crud.select_records(
        Booking,
        select_cols=[Booking.organizer_id],
        filter_conditions=[Booking.id == booking_id],
    ).scalar()

@transactional
def delete_vendor_booking_record(vendor_id: int, booking_id: str):
    filter_criteria = [VendorBookings.vendor_id == vendor_id, VendorBookings.booking_id == booking_id]
    return crud.delete_record(VendorBookings, filter_criteria=filter_criteria)

@transactional
def insert_vendor_booking_record(vendor_id: int, booking_id: str, metadata: dict):
    filter_conditions=[VendorBookings.vendor_id == vendor_id, VendorBookings.booking_id == booking_id]
    status = VendorBookingStatus.REQUESTED.value
    record = crud.select_records(VendorBookings, filter_conditions=filter_conditions).first()
    if not record:
        vendor_booking_data = {
            "vendor_id": vendor_id,
            "booking_id": booking_id,
            "status": status,
            "meta_data": metadata
        }
        return crud.insert_record(VendorBookings, **vendor_booking_data)
    return crud.update_records(VendorBookings, filter_conditions, {"status": status, "meta_data": metadata})

@transactional
def update_vendor_booking_status(vendor_id: int, booking_id: str, action: str):
    if action == "reassign":
        filter_conditions = [VendorBookings.status == VendorBookingStatus.REQUESTED.value, VendorBookings.booking_id == booking_id]
        status = VendorBookingStatus.REASSIGNED.value
    elif action == "revoke":
        filter_conditions = [VendorBookings.vendor_id == vendor_id, VendorBookings.booking_id == booking_id]
        return crud.delete_record(VendorBookings,filter_criteria=filter_conditions)
    else:
        filter_conditions = [VendorBookings.vendor_id == vendor_id, VendorBookings.booking_id == booking_id]
        status = VendorBookingStatus.OWNED.value

    return crud.update_records(VendorBookings, filter_conditions, {"status": status})

@transactional
def update_booking_info(update_booking_request):
    booking_id = update_booking_request.booking_id
    status = update_booking_request.status
    metadata = update_booking_request.metadata

    records_to_update = {}
    booking_info = get_booking_by_booking_id(booking_id)

    if status == BookingStatus.ORGANIZER_ASSIGNED.value:
        if booking_info.organizers:
            raise ex.BookingAlreadyTaken
        records_to_update.update({"organizer_id": metadata.get("organizer_id")})
    elif status == BookingStatus.VENDOR_ACCEPTED.value:
        if booking_info.vendor:
            raise ex.VendorRessignedException
        vendor_id = metadata.get("vendor_id")
        records_to_update.update({"plan_id": metadata["plan_id"], "vendor_id": vendor_id})
        update_vendor_booking_status(vendor_id, booking_id, "owned")
        update_vendor_booking_status(vendor_id, booking_id, "reassign")
    elif status == BookingStatus.VENDOR_DECLINED.value:
        delete_vendor_booking_record(metadata.get("vendor_id"), booking_id)
        records_to_update.update({"plan_id": None, "vendor_id": None})
    elif status == BookingStatus.VENDOR_ASSIGN_REVOKED.value:
        vendor_id = metadata.get("vendor_id")
        update_vendor_booking_status(vendor_id, booking_id, "revoke")
        records_to_update.update({"plan_id": None, "vendor_id": None, "driver_id": None})
    elif status == BookingStatus.DRIVER_ASSIGNED.value:
        records_to_update.update({"driver_id": metadata.get("driver_id")})
    elif status == BookingStatus.DRIVER_REASSIGNED.value:
        records_to_update.update({"driver_id": metadata.get("driver_id")})

    update_booking = crud.update_records(
        Booking,
        filter_criteria=[Booking.id == booking_id],
        records_to_update=records_to_update,
    )
    return update_booking.rowcount

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_trip_info(user: Union[Organizer, Vendor], booking_id: str):
    trip_record = app_utils.get_trip_record_by_booking_id(booking_id)
    return obj_to_dict.trip_info_as_dict(trip_record)

def create_cooridinate(location):
    return f"{location['latitude']},{location['longitude']}"

def generate_coordinate(coord_dict: dict) -> str:
    coordinate =  create_cooridinate(coord_dict)
    return floor_coordinates_to_5_decimal_places(coordinate)


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


def generate_pickup_dropoff_data(guests: list[dict], location: str, role: str) -> dict:
    location = floor_coordinates_to_5_decimal_places(location)
    data = {
        "pickup_dropoff_list": [],
        "guest_mapping": {
            location: {
                "type": Role.DRIVER.value
                if role == Role.DRIVER.value
                else Role.VENDOR.value,
                "coordinate": location,
            }
        },
        "depot": location
    }

    for guest in guests:
        source_location = guest["source"]
        destination_location = guest["destination"]
        origin_coord = generate_coordinate(source_location)
        if origin_coord == location:
            origin_coord = increment_longitude(origin_coord)
        
        destination_coord = generate_coordinate(destination_location)
        if destination_coord == location:
            destination_coord = increment_longitude(destination_coord)
        
        waypoint_coords = []
        for waypoint in guest.get("waypoints", []):
            waypoint_coord = generate_coordinate(waypoint)
            waypoint_coords.append(waypoint_coord)
            
            if waypoint_coord == location:
                waypoint_coord = increment_longitude(waypoint_coord)

        data["guest_mapping"][origin_coord] = build_guest_info(
            guest, origin_coord, source_location["address"], "pickup"
        )

        for waypoint_coord in waypoint_coords:
            data["guest_mapping"][waypoint_coord] = build_guest_info(
                guest, waypoint_coord, source_location["address"], "stop"
            )

        data["guest_mapping"][destination_coord] = build_guest_info(
            guest, destination_coord, destination_location["address"], "drop"
        )

        data["pickup_dropoff_list"].append(
            {
                "origin": origin_coord,
                "waypoints": waypoint_coords,
                "destination": destination_coord,
            }
        )
    return data

def store_optimal_route(booking_id, optimal_route):
    records_to_insert = {
        "booking_id": booking_id,
        "depot": optimal_route["optimal_route"][0].get("coordinate"),
        "optimal_route": optimal_route
    }
    result = crud.insert_record(BookingOptimalRoute, **records_to_insert)
    if not result:
        raise ex.DatabaseOperationFailed(action="insert")

def get_optimal_route_for_booking(booking_id: str, location: str):
    location = floor_coordinates_to_5_decimal_places(location)
    filter_conditions = [BookingOptimalRoute.booking_id == booking_id, BookingOptimalRoute.depot == location]
    order_by = [desc(BookingOptimalRoute.cdate)]
    return crud.select_records(BookingOptimalRoute, filter_conditions=filter_conditions, order_by=order_by).first()

def increment_longitude(coordinates):
    """
    Increments the longitude in the given coordinates by a small value and returns the updated coordinates.
    Args:
        coordinates (str): A string containing latitude and longitude separated by a comma.
    Returns:
        str: Updated coordinates with the incremented longitude.
    """
    def increment_longitude(value):
        return round(value + 0.00001, 5)

    latitude, longitude = map(float, coordinates.split(','))
    new_longitude = increment_longitude(longitude)
    return f"{latitude},{new_longitude}"

def floor_coordinates_to_5_decimal_places(coordinates):
    """
    Floors the latitude and longitude in the given coordinates to 5 decimal places and returns the updated coordinates.
    Args:
        coordinates (str): A string containing latitude and longitude separated by a comma.
    Returns:
        str: Updated coordinates with latitude and longitude floored to 5 decimal places.
    """
    def floor_to_5_places(value):
        return math.floor(value * 100000) / 100000

    latitude, longitude = map(float, coordinates.split(','))
    floored_latitude = floor_to_5_places(latitude)
    floored_longitude = floor_to_5_places(longitude)
    return f"{floored_latitude},{floored_longitude}"

def arrange_all_routes(guests, source, destination, waypoints=None):
    if waypoints is None:
        waypoints = []

    def arrange(guest, location, stop_type):
        return {
            **guest,
            "type": stop_type,
            "coordinate": f"{location['latitude']},{location['longitude']}",
            "address": location["address"]
        }

    res = []

    for guest in guests:
        res.append(arrange(guest, source, "pickup"))

    for waypoint in waypoints:
        for guest in guests:
            res.append(arrange(guest, waypoint, "stop"))

    for guest in guests:
        res.append(arrange(guest, destination, "drop"))

    return res


def are_all_routes_equal(bookings):
    if not bookings:
        return True

    def extract_latlon_info(booking):
        return {
            "source": create_cooridinate(booking["source"]),
            "destination": create_cooridinate(booking["destination"]),
            "waypoints": [
                create_cooridinate(wp) for wp in booking.get("waypoints", [])
            ]
        }

    reference = extract_latlon_info(bookings[0])

    for booking in bookings[1:]:
        if extract_latlon_info(booking) != reference:
            return False

    return True

@transactional
def fetch_optimal_route(booking_id: str, location: str, role: str):
    if role not in [Role.ORGANIZER.value, Role.VENDOR.value, Role.DRIVER.value]:
        raise ex.InvalidRole
    response = get_optimal_route_for_booking(booking_id, location)
    
    if response:
        return response.optimal_route
    
    gmaps_client = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))
    guests_info = app_utils.get_guests_info(booking_id)

    if are_all_routes_equal(guests_info):
        guests = [
            {
                "email": guest["email"],
                "mobile": guest["mobile"],
                "name": guest["name"]
            }
            for guest in guests_info
        ]

        source = guests_info[0]["source"]
        waypoints = guests_info[0]["waypoints"]
        destination = guests_info[0]["destination"]
        
        depot_info = {
            "type": Role.DRIVER.value
            if role == Role.DRIVER.value
            else Role.VENDOR.value,
            "coordinate": location,
        }

        optimal_route = arrange_all_routes(guests, source, destination, waypoints)
        optimal_route = [depot_info] + optimal_route + [depot_info]
        
        coords = []
        coords.append(create_cooridinate(source))
        
        for waypoint in waypoints:
            coords.append(create_cooridinate(waypoint))
        
        coords.append(create_cooridinate(destination))

        route_summary = app_utils.get_route_summary(gmaps_client, origin=location ,destination=location, waypoints=coords)
        response =  {**route_summary, "optimal_route": optimal_route}
        
    else:
        pickup_dropoff_data = generate_pickup_dropoff_data(guests_info, location, role)
        optimal_route_response = get_optimal_route(
            gmaps_client, pickup_dropoff_data["depot"], pickup_dropoff_data["pickup_dropoff_list"]
        )
        optimal_route_coords = optimal_route_response.get("optimal_route")

        direction_info = app_utils.get_directions_info(gmaps_client, optimal_route_coords)

        optimal_route_info = [
            pickup_dropoff_data["guest_mapping"][coord] for coord in optimal_route_coords
        ]
        response =  {**direction_info, "optimal_route": optimal_route_info}
    
    store_optimal_route(booking_id, response)
    return response

def get_optimal_route(gmaps_client, location, pickups_dropoffs):
    locations = {location: 0}
    origin_destination_mapping = []

    create_origin_destination_mapping(
        pickups_dropoffs, origin_destination_mapping, locations
    )
    addresses = list(locations.keys())
    data = {
        "addresses": list(locations.keys()),
        "location": location,
        "coordinates_with_index": locations,
        "origin_destination_mapping": origin_destination_mapping,
        "num_vehicles": 1,
        "depot": 0,
    }
    distance_matrix = gmaps_client.distance_matrix(origins=addresses, destinations=addresses)
    data["distance_matrix"] = app_utils.build_distance_matrix(distance_matrix)
    return app_utils.get_optimal_route(data)


def add_coordinate(coordinates, locations):
    if coordinates not in locations:
        locations[coordinates] = len(locations)


def add_unique_coords_pair(origin, destination, origin_destination_mapping):
    if [origin, destination] not in origin_destination_mapping:
        origin_destination_mapping.append([origin, destination])


def add_origin_destination_mapping(
    pickup_dropoff, origin_destination_mapping, locations
):
    origin = locations[pickup_dropoff["origin"]]
    destination = locations[pickup_dropoff["destination"]]
    waypoints = [
        locations[waypoint] for waypoint in pickup_dropoff.get("waypoints", [])
    ]

    if waypoints:
        add_unique_coords_pair(origin, waypoints[0], origin_destination_mapping)
        for i in range(len(waypoints) - 1):
            add_unique_coords_pair(
                waypoints[i], waypoints[i + 1], origin_destination_mapping
            )
        add_unique_coords_pair(waypoints[-1], destination, origin_destination_mapping)
    else:
        add_unique_coords_pair(origin, destination, origin_destination_mapping)


def create_origin_destination_mapping(
    pickups_dropoffs, origin_destination_mapping, locations
):
    for pickup_dropoff in pickups_dropoffs:
        add_coordinate(pickup_dropoff["origin"], locations)
        for waypoint in pickup_dropoff["waypoints"]:
            add_coordinate(waypoint, locations)
        add_coordinate(pickup_dropoff["destination"], locations)
        add_origin_destination_mapping(
            pickup_dropoff, origin_destination_mapping, locations
        )


def render_template(template_name, **context):
    template = env.get_template(template_name)
    return template.render(context)


def render_html_response(template_name, status_code=200):
    template = env.get_template(template_name)
    rendered_content = template.render()
    return HTMLResponse(content=rendered_content, status_code=status_code)

def get_local_timestamp(timezone):
    """Get the local timestamp for timezone."""
    utc_now = datetime.now(pytz.UTC)
    local_tz = pytz.timezone(timezone)
    return utc_now.replace(tzinfo=pytz.UTC).astimezone(local_tz)

def parse_date(date_str: str, date_format: str = "%d-%m-%Y"):
    """Parse a date string into a date object."""
    datetime_obj = datetime.strptime(date_str, date_format)
    return datetime_obj.date()

def convert_booking_datetime(date_column):
    """Converts a date column from SOURCE_TZ to TARGET_TZ."""
    utc_datetime = func.timezone(const.SOURCE_TZ, func.cast(date_column, TIMESTAMP))
    return func.timezone(const.TARGET_TZ, utc_datetime)

def filter_by_today(curr_date):
    """Filters bookings for the current current date."""
    local_datetime = convert_booking_datetime(Booking.booking_datetime)
    return func.date_trunc('day', local_datetime) == curr_date

def filter_by_this_week(curr_date):
    """Filters bookings for the current week."""
    current_weekday = curr_date.weekday()  # 0 = Monday, 6 = Sunday
    days_to_saturday = 5 - current_weekday
    saturday_date = curr_date + timedelta(days=days_to_saturday)
    local_datetime = convert_booking_datetime(Booking.booking_datetime)
    return func.date_trunc('day', local_datetime).between(curr_date, saturday_date)

def filter_by_date(column, date):
    """Filters bookings by date."""
    local_datetime = convert_booking_datetime(column)
    return func.date_trunc('day', local_datetime) == date

def filter_by_start_date(column, start_date):
    """Filters by start date."""
    local_datetime = convert_booking_datetime(column)
    return func.date_trunc('day', local_datetime) >= start_date

def filter_by_end_date(column, end_date):
    """Filters by end date."""
    local_datetime = convert_booking_datetime(column)
    return func.date_trunc('day', local_datetime) <= end_date

def build_filter_conditions(filters, latest_booking_event=None):
    curr_date = get_local_timestamp(timezone=const.TARGET_TZ).date()
    filter_conditions = []

    for key, value in filters.items():
        if value is None or value == "":
            continue  # Skip empty or None values
        if key == "booking_type":
            filter_conditions.append(Booking.type.in_(value))
        elif key == "cab_type":
            filter_conditions.append(Booking.cab_type.in_(value))
        elif key == "status" or key == "trip_status":
            filter_conditions.append(latest_booking_event.c.event.in_(value))
        elif key == "vendor_city":
            filter_conditions.append(VendorCity.city.in_(value))
        elif key == "coordinator":
            filter_conditions.append(Coordinator.name.in_(value))
        elif key == "organizer":
            filter_conditions.append(Organizer.name.in_(value))
        elif key == "vendor":
            filter_conditions.append(Vendor.name.in_(value))
        elif key == "vendor_id":
            filter_conditions.append(VendorBookings.vendor_id == value)
        elif key == "organizer_id":
            filter_conditions.append(Booking.organizer_id == value)
        elif key == "booking_id":
            filter_conditions.append(Booking.id == value)
        elif key == "driver":
            filter_conditions.append(Driver.name.in_(value))
        elif key == "cost_centre":
            filter_conditions.append(CostCentre.code.in_(value))
        elif key == "travel_mode":
            filter_conditions.append(Booking.travel_mode.in_(value))
        elif key == "bid":
            filter_conditions.append(Booking.bid == value)
        elif key == "guest":
            booking_ids = app_utils.get_bookings_ids_by_name(BookingLogs, value)
            filter_conditions.append(Booking.id.in_(booking_ids or []))
        elif key == "pickup_date":
            date_obj = parse_date(value)
            filter_conditions.append(filter_by_date(Booking.booking_datetime, date_obj))
        elif key == "pickup_start_date":
            date_obj = parse_date(value)
            filter_conditions.append(filter_by_start_date(Booking.booking_datetime, date_obj))
        elif key == "pickup_start_datetime":
            filter_conditions.append(Booking.booking_datetime >= convert_date_str_to_utc(value))
        elif key == "pickup_end_date":
            date_obj = parse_date(value)
            filter_conditions.append(filter_by_end_date(Booking.booking_datetime, date_obj))
        elif key == "pickup_end_datetime":
            filter_conditions.append(Booking.booking_datetime <= convert_date_str_to_utc(value))
        elif key == "invoice_date":
            date_obj = parse_date(value)
            filter_conditions.append(filter_by_date(Invoice.cdate, date_obj))
        elif key == "invoice_start_date":
            date_obj = parse_date(value)
            filter_conditions.append(filter_by_start_date(Invoice.cdate, date_obj))
        elif key == "invoice_end_date":
            date_obj = parse_date(value)
            filter_conditions.append(filter_by_end_date(Invoice.cdate, date_obj))
        elif key == "today":
            filter_conditions.append(filter_by_today(curr_date))
        elif key == "this_week":
            filter_conditions.append(filter_by_this_week(curr_date))

    return filter_conditions

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_all_bookings(organizer_record: Organizer, **filters):
    return fetch_all_bookings(**filters)

@transactional
def fetch_all_bookings(**filters):
    latest_booking_event = aliased(latest_booking_event_query())
    BookingCity = aliased(VendorCity)
    
    booking_cols = [
        "id",
        Booking.id,
        "bid",
        Booking.bid,
        "type",
        Booking.type,
        "cab_type",
        Booking.cab_type,
        "pickup_date",
        cutils.format_booking_datetime(Booking.booking_datetime, const.DATE_FORMAT),
        "pickup_time",
        cutils.format_booking_datetime(Booking.booking_datetime, const.TIME_FORMAT),
        "status",
        latest_booking_event.c.event,
        "description",
        Booking.description,
        "coordinator",
        case((Booking.coordinator_id != None, build_coordinator_json()), else_=None),
        "organizer",
        case((Booking.organizer_id != None, build_organizer_json()), else_=None),
        "vendor", 
        case((Booking.vendor_id != None, build_vendor_json()), else_=None),
        "driver",
        case((Booking.driver_id != None, build_driver_json()), else_=None),
        "plan",
        case((Booking.plan_id != None, build_plan_json()), else_=None),
        "cost_centre",
        app_utils.build_cost_centre_json(),
        "travel_mode",
        Booking.travel_mode,
        "cc_recipients",
        Booking.cc_recipients,
        "po_number",
        Booking.po_number,
        "booking_city",
        case((Booking.city_id != None, app_utils.build_city_json(BookingCity)), else_=None),
        "garage_location",
        VendorBookings.meta_data["garage_location"].astext
    ]

    join_conditions = [
        (Coordinator, Coordinator.id == Booking.coordinator_id, 'left'),
        (Organizer, Organizer.id == Booking.organizer_id, 'left'),
        (Vendor, Vendor.id == Booking.vendor_id, 'left'),
        (Driver, Driver.id == Booking.driver_id, 'left'),
        (Plan, Plan.id == Booking.plan_id, 'left'),
        (Package, Package.id == Plan.package_id, 'left'),
        (latest_booking_event, latest_booking_event.c.booking_id == Booking.id, 'left'),
        (BookingCity, BookingCity.id == Booking.city_id, 'left'),
        (VendorCity, VendorCity.id == Vendor.city_id, 'left'),
        (Vehicle, Vehicle.id == Plan.vehicle_id, 'left'),
        (VehicleModel, VehicleModel.id == Vehicle.vehicle_model_id, 'left'),
        (VendorBookings, and_(VendorBookings.booking_id == Booking.id, VendorBookings.status == VendorBookingStatus.OWNED.value), 'left'),
        (CostCentre, CostCentre.id == Booking.cost_centre_id, 'left'),
    ]

    group_by = [
            Booking.id, latest_booking_event.c.event, BookingCity.id,
            Coordinator.id, Organizer.id, Vendor.id, VendorCity.city, 
            Driver.id,Plan.id, Package.id, Vehicle.id, VehicleModel.vehicle_model,
            CostCentre.id, CostCentre.code, CostCentre.gstin_no, VendorBookings.meta_data
        ]
    order_by = [desc(Booking.cdate)]

    select_cols = [func.jsonb_build_object(*booking_cols)]

    limit = filters.get("limit", 10)
    page = filters.get("page", 1)
    offset = (page - 1) * limit

    filter_conditions = build_filter_conditions(filters, latest_booking_event)

    query = crud.select_records(
        primary_table=Booking,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        group_by=group_by,
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

def bid_ilike_condition(value):
    return Booking.bid.ilike(value + "%")

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_bid_from_bookings(user: Union[Organizer, Vendor], bid_filter: str = None):
    """
    Retrieve booking IDs from the database based on the provided organizer and optionally a partial or complete booking ID.
    Args:
        organizer (Organizer): The organizer for which bookings are being retrieved.
        bid_filter (str, optional): A partial or complete booking ID to filter bookings. Defaults to None.
    Returns:
        dict: A dictionary containing the retrieved booking IDs under the key "bid".
    """
    filter_conditions = []
    if bid_filter:
        condition = bid_ilike_condition(bid_filter) 
        filter_conditions.append(condition)
    subquery = crud.select_records(Booking, select_cols=[Booking.bid], filter_conditions=filter_conditions).subquery()
    result = crud.select_records(subquery, select_cols=[func.array(subquery)]).scalar()
    return {"bid": result}

def build_job_reports_json(source_location, destination_location, waypoint_location, vendor_alt, status):
    return func.jsonb_build_object(
        "S.No",
        func.row_number().over(),
        "Booking ID",
        Booking.bid,
        "Booked Date",
        cutils.format_booking_datetime(Booking.booking_datetime, const.DATE_FORMAT),
        "Booked By",
        Coordinator.name,
        "Cost Centre",
        CostCentre.code,
        "PO Number",
        Booking.po_number,
        "Organizer Name",
        Organizer.name,
        "Guest Name",
        BookingLogs.name,
        "Rank",
        BookingLogs.rank,
        "Vessel Name",
        BookingLogs.vessel_name,
        "Internal ID",
        BookingLogs.internal_id,
        "Pickup Location",
        source_location,
        "Drop Location",
        destination_location,
        "Stops",
        waypoint_location,
        "Vendor Name", 
        func.coalesce(
            Vendor.name, 
                func.string_agg(
                    func.distinct(
                        case(
                            (VendorBookings.status == 'requested', vendor_alt.name),
                            else_=None
                        )
                    ),
                ", "
            )
        ),
        "Driver Name", 
        Driver.name,
        "Status",
        func.replace(status, '_', ' '),
        "Distance",
        Trip.distance,
        "Duration",
        Trip.duration,
        "Tariff Applied",
        Package.name,
        "booking_id",
        Booking.id,
        "Vendor Invoice Status",
        func.initcap(func.replace(VendorInvoices.event, '_', ' ')),
        "Vendor Base Fare",
        VendorInvoices.base_fare,
        "Miscellaneous",
        VendorInvoices.miscellaneous,
        "Vendor Invoice Amount",
        VendorInvoices.invoice_amount,
        "Travel Mode",
        Booking.travel_mode
    )

def fetch_cancelled_and_completed_booking_ids():
    cancelled_booking_ids = crud.select_records(
        BookingEvent,
        select_cols=[BookingEvent.booking_id.label('booking_id'), literal('cancelled').label('trip_status')], 
        filter_conditions=[BookingEvent.event == BookingStatus.CANCELLED.value]
    )

    completed_booking_ids = crud.select_records(
        Trip,
        select_cols=[Trip.booking_id.label('booking_id'), literal('completed').label('trip_status')], 
        join_conditions=[(TripEvent, Trip.id == TripEvent.trip_id)],
        filter_conditions=[TripEvent.event == 'completed']
    )

    union_subquery = cancelled_booking_ids.union_all(completed_booking_ids).subquery()

    # Select distinct booking_ids
    return  crud.select_records(
        union_subquery,
        select_cols=[union_subquery.c.booking_id, union_subquery.c.trip_status]
    ).distinct(union_subquery.c.booking_id).subquery()


def fetch_waypoints_with_addresses():
    return crud.select_records(
        Waypoint,
        select_cols=[
            Waypoint.booking_log_id.label('booking_log_id'), 
            func.string_agg(Location.address, ', ').label('address')
        ],
        join_conditions=[(Location, Location.id == Waypoint.location_id)],
        group_by=[Waypoint.booking_log_id]
    ).subquery()

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_job_reports(organizer: Organizer, **filters):
    # booking_info_subquery = fetch_cancelled_and_completed_booking_ids()
    latest_booking_event = aliased(latest_booking_event_query())
    source_location = aliased(Location, name="source_location")
    destination_location = aliased(Location, name="destination_location")
    vendor_alt = aliased(Vendor, name="vendor_alt")
    
    waypoint_location_subquery = fetch_waypoints_with_addresses()
    
    select_cols = [build_job_reports_json(
            source_location.address, destination_location.address, 
            waypoint_location_subquery.c.address, vendor_alt, latest_booking_event.c.event
        )
    ]

    join_conditions = [
        (latest_booking_event, latest_booking_event.c.booking_id == Booking.id),
        (BookingLogs, BookingLogs.booking_id == Booking.id),
        (Coordinator, Coordinator.id == Booking.coordinator_id),
        (CostCentre, CostCentre.id == Booking.cost_centre_id),
        (source_location, source_location.id == BookingLogs.source_id),
        (destination_location, destination_location.id == BookingLogs.destination_id, 'left'),
        (Organizer, Organizer.id == Booking.organizer_id, 'left'),
        (Vendor, Vendor.id == Booking.vendor_id, 'left'),
        (waypoint_location_subquery, waypoint_location_subquery.c.booking_log_id == BookingLogs.id, 'left'),
        (Plan, Plan.id == Booking.plan_id, 'left'),
        (Package, Package.id == Plan.package_id, 'left'),
        (Trip, Trip.booking_id == Booking.id, 'left'),
        (Driver, Driver.id == Booking.driver_id, 'left'),
        (VendorInvoices, VendorInvoices.booking_id == Booking.id, 'left'),
        (VendorBookings, VendorBookings.booking_id == Booking.id, 'left'),
        (vendor_alt, vendor_alt.id == VendorBookings.vendor_id, 'left')
    ]
    filter_conditions = build_filter_conditions(filters, latest_booking_event)
    
    # if filters.get("trip_status"):
    #     filter_conditions.append(booking_info_subquery.c.trip_status.in_(filters.get("trip_status")))
    
    order_by = build_sort_criteria_for_cab_report(filters.get("sort"))
    group_by = [
        Booking.id, Booking.travel_mode, Booking.bid, Booking.booking_datetime, Coordinator.name, CostCentre.code, Booking.po_number, Organizer.name, BookingLogs.name, BookingLogs.rank, BookingLogs.vessel_name, BookingLogs.internal_id, 
        source_location.address, destination_location.address, waypoint_location_subquery.c.address, Vendor.name, Driver.name, latest_booking_event.c.event, 
        Trip.distance, Trip.duration, Package.name, VendorInvoices.event, VendorInvoices.base_fare, VendorInvoices.miscellaneous, VendorInvoices.invoice_amount,  
    ]
    query = crud.select_records(
        primary_table=Booking,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        group_by=group_by,
        order_by=order_by
    )

    # Return excel as response if the download is True, else return paginated data
    if filters.get("download"):   
        result = query.all()
        job_reports = list(chain.from_iterable(result))
        columns = const.JOB_REPORT_COLUMNS
        df = pd.DataFrame(job_reports, columns=columns)
        return generate_excel_stream_response(df)

    response = app_utils.get_paginated_data(query, filters, output_name="job_reports")
    response["headers"] = const.JOB_REPORT_COLUMNS 
    return response

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def update_booking_info_by_booking_id(user: Union[Coordinator, Organizer], booking_id: str, update_request: EditCabBookingModal):
    records_to_update = {}
    booking_record = get_booking_by_booking_id(booking_id=booking_id)   
    booking_logger_obj = cutils.BookingLogger(user=user, booking_id=booking_id, booking_type=BookingType.CAB.value)

    if booking_record.cost_centre.id != update_request.cost_centre.id:
        records_to_update["cost_centre_id"] = update_request.cost_centre.id
        booking_logger_obj.log_change(
            event="cost_centre_change",
            prev_cost_centre=booking_record.cost_centre.code,
            cur_cost_centre=update_request.cost_centre.code
        )

    old_city_id = getattr(booking_record.city, "id", None)
    new_city_id = getattr(update_request.city, "id", None)

    if old_city_id != new_city_id:
        records_to_update["city_id"] = new_city_id
        booking_logger_obj.log_change(
            event="city_change",
            prev_city=getattr(booking_record.city, "city", None),
            cur_city=getattr(update_request.city, "city", None)
        )

    if booking_record.cab_type != update_request.cab_type:
        records_to_update["cab_type"] = update_request.cab_type
        booking_logger_obj.log_change(
            event="cab_type_change",
            prev_cab_type=booking_record.cab_type,
            cur_cab_type=update_request.cab_type
        )

    if booking_record.po_number != update_request.po_number:
        records_to_update["po_number"] = update_request.po_number
        booking_logger_obj.log_change(
            event="po_number_change",
            prev_po_number=booking_record.po_number,
            cur_po_number=update_request.po_number
        )
    if booking_record.description != update_request.description:
        records_to_update["description"] = update_request.description
        booking_logger_obj.log_change(
            event="description_change",
            prev_description=booking_record.description,
            cur_description=update_request.description
        )

    if booking_record.cc_recipients != update_request.cc_recipients:
        records_to_update["cc_recipients"] = update_request.cc_recipients
        booking_logger_obj.log_change(
            event="cc_recipients_change",
            prev_cc_recipients=booking_record.cc_recipients,
            cur_cc_recipients=update_request.cc_recipients
        )
    

    local_tz = pytz.timezone(const.TARGET_TZ)
    existing_timestamp_utc = booking_record.booking_datetime
    existing_timestamp_local = existing_timestamp_utc.astimezone(local_tz)
    # Initialize new timestamp variable
    new_timestamp_utc = None   

    if existing_timestamp_local.strftime("%Y-%m-%d") != update_request.pick_up_date:
        pickup_date = datetime.strptime(update_request.pick_up_date, "%Y-%m-%d").date()
        # Create a new local timestamp with the existing time
        new_local_timestamp = datetime.combine(pickup_date, existing_timestamp_local.time())
        # Convert to UTC
        new_timestamp_utc = local_tz.localize(new_local_timestamp).astimezone(pytz.UTC)
        records_to_update["booking_datetime"] = new_timestamp_utc
        # Log activity
        booking_logger_obj.log_change(
            event="pickup_date_change", 
            prev_pickup_date=existing_timestamp_local.date().isoformat(), 
            cur_pickup_date=pickup_date.isoformat()
        )

    # Update pickup time if provided
    if existing_timestamp_local.strftime("%H:%M") != update_request.pick_up_time:
        # Use the updated date if set; otherwise, use the existing UTC date
        local_timestamp = (new_timestamp_utc or existing_timestamp_utc).astimezone(local_tz)
        # Parse new pickup time
        pickup_time = datetime.strptime(update_request.pick_up_time, "%H:%M").time()
        # Create a new local timestamp with the updated time
        new_local_timestamp = datetime.combine(local_timestamp.date(), pickup_time)
        # Convert to UTC
        new_timestamp_utc = local_tz.localize(new_local_timestamp).astimezone(pytz.UTC)
        records_to_update["booking_datetime"] = new_timestamp_utc
        # Log activity
        booking_logger_obj.log_change(
            event="pickup_time_change", 
            prev_pickup_time=existing_timestamp_local.time().isoformat(), 
            cur_pickup_time=pickup_time.isoformat()
        )

    filter_criteria = [Booking.id == booking_id]
    update_result = crud.update_records(Booking, filter_criteria=filter_criteria, records_to_update=records_to_update)
    
    if not update_result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")

    update_guests_by_booking_id(booking_id, update_request.guests, booking_logger_obj)
    update_booking_activity_log(booking_logger_obj)
    if booking_logger_obj.route_recalculation_flag:
        delete_optimal_route_response(booking_id)
    
    return {
        "booking_id": booking_id,
        "bid": booking_record.bid,
        "message": "Successfully updated booking details",
    }

@transactional
def delete_optimal_route_response(booking_id):
    filter_criteria=[BookingOptimalRoute.booking_id == booking_id]
    crud.delete_record(BookingOptimalRoute, filter_criteria)

@transactional
def update_booking_activity_log(booking_logger_obj: cutils.BookingLogger):
    records_to_insert = booking_logger_obj.get_booking_activity_log()
    if records_to_insert:
        crud.insert_records(BookingActivityLog, records_to_insert)

@transactional
def get_cost_centre_info_by_booking_id(booking_id):
    select_cols = [func.json_build_object("id", CostCentre.id, "code", CostCentre.code)]
    filter_conditions = [Booking.id == booking_id]
    join_conditions = [(CostCentre, CostCentre.id == Booking.cost_centre_id)]
    result = crud.select_records(Booking, select_cols=select_cols, join_conditions=join_conditions, filter_conditions=filter_conditions).scalar()
    return result

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_booking_activity_log_info(organizer: Organizer, booking_id: str, booking_type: str):
    try:
        records = crud.select_records(BookingActivityLog, filter_conditions=[BookingActivityLog.booking_id == booking_id, BookingActivityLog.booking_type.ilike(booking_type)], order_by=[asc(BookingActivityLog.cdate)]).all()
        return {"booking_activity_log": [obj_to_dict.booking_activity_log_info_as_dict(booking_activity_log) for booking_activity_log in records]}
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="get")

@transactional
def get_booking_log_by_id(booking_log_id: int):
    filter_conditions = [BookingLogs.id == booking_log_id]
    return crud.select_records(BookingLogs, filter_conditions=filter_conditions).first()

def prepare_guest_data(guest):
    """
    Prepares the data for a guest record.
    Param:
        guest: An object containing guest details.
    Returns:
        dict: A dictionary containing structured location data.
    """
    return {
        "mobile": guest.mobile,
        "name": guest.name,
        "email": guest.email
    }

def prepare_location_data(location):
    """
    Prepares the data for a location record.
    Param:
        location: An object containing location details.
    Returns:
        dict: A dictionary containing structured location data.
    """
    return {
        "name": location.name,
        "address": location.address,
        "landmark": location.landmark,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "title": location.title,
    }

def prepare_booking_log_data(booking_id: str, guest: GuestInfo, source_id: int, destination_id: int = None):
    """
    Prepares the data for a booking log record.
    Params:
        booking_id : The unique identifier of the booking.
        source_id : The unique identifier of the source location.
        destination_id : The unique identifier of the destination location.
        guest: An object containing guest details.
    Returns:
        dict: A dictionary containing structured booking log data.
    """
    return {
        "booking_id": booking_id,
        "source_id": source_id,
        "destination_id": destination_id,
        "mobile": guest.mobile,
        "email": guest.email,
        "alternate_email": guest.alternate_email,
        "alternate_mobile": guest.alternate_mobile,
        "name": guest.name,
        "rank": guest.rank,
        "vessel_name": guest.vessel_name,
        "internal_id": guest.internal_id,
        "flight_details": guest.flight_details,
        "date_of_duty": (
            cutils.convert_to_datetime(guest.date_of_duty, guest.start_time) 
            if guest.date_of_duty and guest.start_time 
            else None
        )
    }

@transactional
def upsert_guest_info(guest, booking_logger_obj):
    """Upsert guest record and associated location data."""
    guest_fields = prepare_guest_data(guest)
    if not guest.id:
        guest_record = crud.insert_record(Guest, **guest_fields)
        return guest_record.id
    else:
        existing_guest_record = app_utils.get_model_record_by_id(Guest, guest.id)
        
        for field in ["name", "email"]:
            prev_value = getattr(existing_guest_record, field)
            cur_value = getattr(guest, field)

            if prev_value != cur_value:
                kwargs = { f"prev_{field}": prev_value, f"cur_{field}": cur_value }
                booking_logger_obj.log_change(event="guest_edit_change", **kwargs) 

        crud.update_records(Guest, filter_criteria=[Guest.id == guest.id], records_to_update=guest_fields)
        return guest.id


def validate_booking_log_ownership(booking_log_id: int, booking_id: str, guest_name: str):
    """
    Validates whether the booking_log_id belongs to the current booking.
    Args:
        booking_log_id (int): The booking log ID to validate.
        booking_id (str): The current booking ID being processed.
        guest_name (str): Optional, for better error messages.
    Raises:
        Exception: If the booking_log_id does not belong to the current booking.
    """
    booking_log_record = app_utils.get_model_record_by_id(BookingLogs, booking_log_id)
    if str(booking_log_record.booking_id) != booking_id:
        raise ex.CrossUpdateError(guest_name)
    
    return booking_log_record

@transactional
def upsert_location_info(location, location_type, guest_name, booking_logger_obj, booking_id, booking_log_id):
    """Upsert or insert a location record."""
    prev_location, cur_location = f"prev_{location_type}", f"cur_{location_type}"
    event = f"guest_{location_type}_change"
    
    location_fields = prepare_location_data(location)
    location_id = location.location_id

    if not location_id:
        def location_info_as_dict(location):
            return {
                "doorno": location.name,
                "address": location.address,
                "landmark": location.landmark,
                "title": location.title
            }
        
        if booking_log_id:
            booking_log_record = validate_booking_log_ownership(booking_log_id, booking_id, guest_name)
            existing_location_record = getattr(booking_log_record, "source" if location_type == "pickup" else "destination")
            kwargs = { prev_location: location_info_as_dict(existing_location_record), cur_location: location_info_as_dict(location) }
            booking_logger_obj.log_change(event=event, guest_name=guest_name, **kwargs)
        # Insert new location record
        location_record = crud.insert_record(Location, **location_fields)
        booking_logger_obj.trigger_route_recalculation()
        return location_record.id
    
    existing_location_record = app_utils.get_model_record_by_id(Location, location_id)
    
    if booking_log_id and existing_location_record.name != location.name:
        kwargs = { prev_location: {"doorno": existing_location_record.name}, cur_location: {"doorno": location.name} }
        booking_logger_obj.log_change(event=event, guest_name=guest_name, **kwargs)

    if booking_log_id and existing_location_record.landmark != location.landmark:
        kwargs = { prev_location: {"landmark": existing_location_record.landmark}, cur_location: {"landmark": location.landmark} }
        booking_logger_obj.log_change(event=event, guest_name=guest_name, **kwargs)

    if booking_log_id and existing_location_record.title != location.title:
        kwargs = { prev_location: {"title": existing_location_record.title}, cur_location: {"title": location.title} }
        booking_logger_obj.log_change(event=event, guest_name=guest_name, **kwargs)

    crud.update_records(Location, filter_criteria=[Location.id == location_id], records_to_update=location_fields)
    return location_id

@transactional
def handle_waypoints(guest, guest_name, booking_logger_obj, booking_log_id):
    """Handle waypoint locations: insert or delete based on conditions."""
    for waypoint in guest.waypoints:
        waypoint_id = waypoint.waypoint_id
        if not waypoint_id:
            location_record = create_location_record("stop", waypoint)
            crud.insert_record(Waypoint, booking_log_id=booking_log_id, location_id=location_record.id)
            if booking_log_id:
                booking_logger_obj.log_change(event="guest_stop_added_change", address=waypoint.address, guest_name=guest_name)
                booking_logger_obj.trigger_route_recalculation()

        elif waypoint_id and waypoint.delete:
            crud.delete_record(Waypoint, filter_criteria=[Waypoint.id == waypoint_id])
            if booking_log_id:
                booking_logger_obj.log_change(event="guest_stop_removed_change", address=waypoint.address, guest_name=guest_name)
                booking_logger_obj.trigger_route_recalculation()

@transactional
def fetch_waypoints_by_booking_log_id(booking_log_id):
    filter_conditions = [Waypoint.booking_log_id == booking_log_id]
    waypoints = crud.select_records(Waypoint, filter_conditions=filter_conditions).all()
    return waypoints

@transactional
def delete_guest_booking_log(guest, booking_logger_obj, booking_id, booking_log_id):
    """Delete the booking log if the guest is marked for deletion."""
    booking_log_record = validate_booking_log_ownership(booking_log_id, booking_id, guest.name)
    
    waypoints = fetch_waypoints_by_booking_log_id(booking_log_id)
    if waypoints:
        for waypoint in waypoints:
            crud.delete_record(Waypoint, [Waypoint.id == waypoint.id])
    
    crud.delete_record(BookingLogs, [BookingLogs.id == booking_log_id])
    booking_logger_obj.log_change(event="guest_delete_change", guest_name=guest.name)
    booking_logger_obj.trigger_route_recalculation()

@transactional
def update_guest_booking_log(guest, filter_criteria, booking_log_record, booking_log_info_as_dict, booking_logger_obj):
    """Upsert the booking log."""
    event="guest_edit_change"

    for field in ["email", "name", "rank", "vessel_name", "internal_id", "flight_details", "alternate_email", "alternate_mobile"]:
        prev_value = getattr(booking_log_record, field)
        cur_value = booking_log_info_as_dict[field]
        
        if prev_value != cur_value:
            kwargs = {
                f"prev_{field}": prev_value,
                f"cur_{field}": cur_value
            }
            booking_logger_obj.log_change(event=event, guest_name=guest.name, **kwargs)

    
    if booking_log_record.date_of_duty:
        local_tz = pytz.timezone(const.TARGET_TZ)
        existing_timestamp_utc = booking_log_record.date_of_duty
        existing_timestamp_local = existing_timestamp_utc.astimezone(local_tz)
        new_timestamp_utc = None
        
        if existing_timestamp_local.strftime("%Y-%m-%d") != guest.date_of_duty:
            date_of_duty = datetime.strptime(guest.date_of_duty, "%Y-%m-%d").date()
            new_local_timestamp = datetime.combine(date_of_duty, existing_timestamp_local.time())
            new_timestamp_utc = local_tz.localize(new_local_timestamp).astimezone(pytz.UTC)
            booking_logger_obj.log_change(
                event=event, 
                prev_date_of_duty=existing_timestamp_local.date().isoformat(), 
                cur_date_of_duty=date_of_duty.isoformat(),
                guest_name=guest.name
            )

        if existing_timestamp_local.strftime("%H:%M") != guest.start_time:
            local_timestamp = (new_timestamp_utc or existing_timestamp_utc).astimezone(local_tz)
            start_time = datetime.strptime(guest.start_time, "%H:%M").time()
            new_local_timestamp = datetime.combine(local_timestamp.date(), start_time)
            new_timestamp_utc = local_tz.localize(new_local_timestamp).astimezone(pytz.UTC)
            booking_logger_obj.log_change(
                event=event,
                prev_start_time=existing_timestamp_local.time().isoformat(), 
                cur_start_time=start_time.isoformat(),
                guest_name=guest.name
            )

    else:
        if guest.date_of_duty:
            booking_logger_obj.log_change(
                event=event,
                prev_date_of_duty=None,
                cur_date_of_duty=guest.date_of_duty,
                guest_name=guest.name
            )        
        if guest.start_time:
            booking_logger_obj.log_change(
                event=event,
                prev_start_time=None,
                cur_start_time=guest.start_time,
                guest_name=guest.name
            )

    # Update booking log
    crud.update_records(BookingLogs, filter_criteria, booking_log_info_as_dict)

@transactional
def add_guest_booking_log(guest_name, booking_log_info_as_dict, booking_logger_obj):
    crud.insert_record(BookingLogs, **booking_log_info_as_dict, cdate=cutils.current_utc_time())
    booking_logger_obj.log_change(event="guest_add_change", guest_name=guest_name)
    booking_logger_obj.trigger_route_recalculation()

@transactional
def update_guests_by_booking_id(booking_id: str, guests: List[GuestInfo], booking_logger_obj: cutils.BookingLogger):    
    """Main logic to update guest information."""
    for guest in guests:
        filter_criteria = [BookingLogs.id == guest.booking_log_id]

        if guest.booking_log_id and guest.delete:
            delete_guest_booking_log(guest, booking_logger_obj, booking_id, guest.booking_log_id)
        else:
            source = guest.source
            destination = guest.destination
            
            # Upsert source location
            source_id = upsert_location_info(source, "pickup", guest.name, booking_logger_obj, booking_id, guest.booking_log_id)
            
            # Handle waypoints
            handle_waypoints(guest, guest.name, booking_logger_obj, guest.booking_log_id)
            
            # Upsert destination location
            destination_id = upsert_location_info(destination, "drop", guest.name, booking_logger_obj, booking_id, guest.booking_log_id) if destination else None

            booking_log_info_as_dict = prepare_booking_log_data(booking_id, guest, source_id, destination_id)
            
            if guest.booking_log_id:
                booking_log_record = validate_booking_log_ownership(guest.booking_log_id, booking_id, guest.name)
                update_guest_booking_log(guest, filter_criteria, booking_log_record, booking_log_info_as_dict, booking_logger_obj)
            else:
                add_guest_booking_log(guest.name, booking_log_info_as_dict, booking_logger_obj)

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_guest_info(user: Union[Coordinator, Organizer], guest_request: GuestModel):
    if not cutils.validate_mobile_number_format(guest_request.mobile):
        raise ex.InvalidMobileNumber    

    model = BookingLogs if guest_request.booking_type == BookingType.CAB.value else HotelBookingGuest
    filter_conditions = [model.mobile == guest_request.mobile]
    order_by = [desc(model.cdate)]
    
    result = crud.select_records(model, filter_conditions=filter_conditions, order_by= order_by).limit(1).one_or_none()
    
    if not result:
        return {"guest": {}}
   
    return {
        "guest": {
            "mobile": result.mobile,
            "name": result.name,
            "email": result.email,
            "vessel_name": result.vessel_name,
            "rank": result.rank,
            "internal_id": result.internal_id,
            "alternate_email": result.alternate_email,
            "alternate_mobile": result.alternate_mobile
        }
   }

@transactional
def create_or_update_guest_info(mobile, email, name):
    if not cutils.validate_mobile_number_format(mobile):
        raise ex.InvalidMobileNumber    
    
    filter_conditions = [Guest.mobile == mobile]
    order_by = [desc(Guest.cdate)]
    guest_info = crud.select_records(Guest, filter_conditions=filter_conditions, order_by=order_by).first()

    if guest_info:
        records_to_update = {"name": name, "email": email}
        result = crud.update_records(Guest, filter_criteria=filter_conditions, records_to_update=records_to_update)
        if not result.rowcount:
            raise ex.DatabaseOperationFailed(action="update")
    else:
        guest_info = crud.insert_record(Guest, name=name, email=email, mobile=mobile)
        if not guest_info:
            raise ex.DatabaseOperationFailed(action="insert")
        
    return obj_to_dict.guest_info_as_dict(guest_info)

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def search_guest_by_name(organizer: Organizer, name: str = None):
    select_cols = [BookingLogs.name]
    filter_conditions = [BookingLogs.name.ilike(f"%{name}%")]
    order_by = [BookingLogs.name]

    records = crud.select_records(BookingLogs, 
        select_cols=select_cols, 
        filter_conditions=filter_conditions,
        order_by=order_by
    ).distinct().all()

    return {"guests": [{ "id": index, "name": record[0]} for index, record in enumerate(records, start=1)] }

def build_vendor_booking_json():
    return func.json_build_object(
        "id",
        VendorBookings.id,
        "vendor",
        func.json_build_object(
            "id", Vendor.id,
            "name", Vendor.name
        ),
        "status",
        VendorBookings.status
    ).label("vendor_booking_json")

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_vendor_by_booking_id(organizer, booking_id):
    select_cols=[build_vendor_booking_json()]
    join_conditions = [(Vendor, Vendor.id == VendorBookings.vendor_id)]
    filter_conditions = [VendorBookings.booking_id == booking_id,VendorBookings.status != "reassigned"]
    order_by = [desc(VendorBookings.cdate)]

    result = crud.select_records(
        VendorBookings,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        order_by=order_by
    ).all()
    
    return {
        "vendor_bookings" : list(chain.from_iterable(result))
    }