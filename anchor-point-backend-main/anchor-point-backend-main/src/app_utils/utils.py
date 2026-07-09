"""
This file contains all the business logics involved in our app.
"""
from functools import wraps
import math
import os
from typing import Union
import requests
import uuid
from app_routes.booking.schema import BookingEventType
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from itertools import chain
from datetime import datetime
import pytz
from app_models.models import (
    Booking,
    BookingEvent,
    BookingLogs,
    Coordinator,
    CostCentre,
    Driver,
    Guest,
    Location,
    Organizer,
    Package,
    Vehicle,
    Vendor,
    Plan,
    Trip,
    TripEvent,
    DriverCharge,
    Invoice,
    VendorCity,
    Waypoint,
    VendorInvoices,
)
from app_schemas.schema import Role
from app_utils.decorators import transactional, verify_jwt_role_and_email
from sqlalchemy.orm import aliased
from sqlalchemy import func, desc, or_, asc, case, Numeric, and_
from sqlalchemy.exc import SQLAlchemyError
from app_models import crud
from memory_profiler import profile
from logger import logger
from common_utils import obj_to_dict, utils as cutils
from app_configs import configs as cfg
from app_utils import exception as ex, utils as app_utils
from app_configs import constants as const


def memory_profile():
    """
    Custom decorator to conditionally apply @profile based on a condition.
    """

    def decorator(func):
        if cfg.env == "dev":
            logger.debug("Started memory profiling")
            return profile(func)
        return func

    return decorator


def validate_email_by_role(func):
    @wraps(func)
    def wrap_func(email, role, *args, **kwargs):
        model = get_model_by_role(role)
        if not is_valid_email_for_role(email, model):
            raise ex.EmailNotFound
        return func(email, model, *args, **kwargs)

    return wrap_func

def build_cost_centre_json():
    return func.json_build_object("id", CostCentre.id, "code", CostCentre.code, "address", CostCentre.address , "gstin_no", CostCentre.gstin_no)

def build_city_json(model):
    return func.json_build_object("id", model.id, "city", model.city)

@transactional
@cutils.verify_jwt_role_and_email([Role.COORDINATOR.value, Role.ORGANIZER.value, Role.VENDOR.value])
def log_out(user_record: Union[Coordinator, Organizer, Vendor]) -> dict:
    model = type(user_record)
    filter_criteria = [model.email == user_record.email, model.is_verified == True]
    records_to_update = {"is_verified": False}
    result = crud.update_records(model, filter_criteria, records_to_update)
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")
    return const.LOGOUT_SUCCESS_MSG


def records_with_pagination(query, page, limit):
    """
    Retrieve a paginated list of records from a query.

    This function takes a SQLAlchemy query and a page number as input,
    and returns a dictionary containing a paginated subset of records
    along with pagination information.

    Args:
        query (sqlalchemy.orm.query.Query): The SQLAlchemy query object representing the database query.
        page (int): The page number of records to retrieve.

    Returns:
        dict: A dictionary containing the paginated records, pagination information, and metadata.
    """
    total_records = query.count()
    offset = (int(page) - 1) * limit
    total_pages = (total_records + limit - 1) // limit
    records = query.offset(offset).limit(limit).all()
    return {
        "bookings": records,
        "records_per_page": limit,
        "total_pages": total_pages,
        "total_records": total_records,
        "page": page,
    }


@transactional
def fetch_fcm_token_by_id(model, id):
    select_cols = [model.fcm_token]
    filter_conditions = [model.id == id, model.fcm_token != None]
    return crud.select_records(
        model, select_cols=select_cols, filter_conditions=filter_conditions
    ).scalar()


@transactional
def fetch_fcm_token(model):
    select_cols = [model.fcm_token]
    filter_conditions = [model.fcm_token != None]
    result = crud.select_records(
        model, select_cols=select_cols, filter_conditions=filter_conditions
    ).all()
    return list(chain.from_iterable(result))


def convert_date_str_to_utc(date_str: str, local_timezone: str = "Asia/Kolkata"):
    date_object = datetime.strptime(date_str, "%d-%m-%Y %H:%M:%S")

    local_timezone = pytz.timezone(local_timezone)

    local_date_object = local_timezone.localize(date_object)

    utc_date_object = local_date_object.astimezone(pytz.utc)

    return utc_date_object

def convert_date_str_to_datetime(date_str, format="%Y-%m-%d"):
    """
    Converts a date string to a datetime object.
    
    :param date_str: The date string to be converted.
    :param format: The format of the date string (default is "%Y-%m-%d").
    :return: A datetime object.
    """
    return datetime.strptime(date_str, format)


@transactional
def is_valid_email_for_role(email: str, model):
    return bool(
        crud.select_records(
            primary_table=model, filter_conditions=[model.email == email]
        ).first()
    )


def is_valid_email_for_multiple_roles(email: str, model1, model2):
    return bool(
        crud.select_records(
            primary_table=model1,
            select_cols=[model1.email],
            filter_conditions=[model1.email == email],
        )
        .union(
            crud.select_records(
                primary_table=model2,
                select_cols=[model2.email],
                filter_conditions=[model2.email == email],
            )
        )
        .first()
    )

@transactional
def get_model_record_id_by_email(model, email):
    record = crud.select_records(
        primary_table=model,
        filter_conditions=[model.email == email],
    ).first()
    if not record:
        raise ex.RecordNotFound(model=f"{model.__name__} with '{email}'")
    return record.id

@transactional
def get_model_record_by_id(model, id):
    record = crud.select_records(
        primary_table=model,
        filter_conditions=[model.id == id],
    ).first()
    if not record:
        raise ex.RecordNotFound(model=f"{model.__name__} with id '{id}'")
    return record

def get_model_by_role(role):
    return {
        "coordinator": Coordinator,
        "organizer": Organizer,
        "vendor": Vendor,
        "driver": Driver,
    }.get(role)


@transactional
def get_bookings_summary(
    email: str, role: str, trip_from_timestamp: str, trip_to_timestamp: str
):
    model = get_model_by_role(role)

    if not model:
        raise ex.InvalidRole

    # Check if the email exists in the specified role
    if not is_valid_email_for_role(email, model):
        raise ex.EmailNotFound

    booking_summary_subquery = build_booking_summary_subquery(
        email, trip_from_timestamp, role
    )

    booking_summary = fetch_booking_summary(booking_summary_subquery, role)
    events = list(chain.from_iterable(booking_summary))

    return {
        "events": events,
        "total_bookings_assigned": sum(
            event["event_bookings_count"] for event in events
        ),
        "trips_scheduled_today": get_trips_scheduled_today(
            booking_summary_subquery, trip_from_timestamp, trip_to_timestamp
        ),
    }


def build_booking_summary_subquery(email: str, current_timestamp: str, role: str):
    latest_booking_event = aliased(latest_booking_event_query())
    select_cols_bookings_subquery = [
        Booking.organizer_id,
        Booking.id,
        Booking.booking_datetime,
        latest_booking_event.c.event,
        latest_booking_event.c.booking_id,
    ]

    join_conditions = [
        (latest_booking_event, Booking.id == latest_booking_event.c.booking_id),
    ]

    filter_conditions = [
        Booking.booking_datetime >= convert_date_str_to_utc(current_timestamp),
    ]

    if role == Role.ORGANIZER.value:
        join_conditions.append((Organizer, Organizer.id == Booking.organizer_id))
        filter_conditions.append(Organizer.email == email)

    if role == Role.VENDOR.value:
        join_conditions.append((Vendor, Vendor.id == Booking.vendor_id))
        filter_conditions.append(Vendor.email == email)

    return crud.select_records(
        select_cols=select_cols_bookings_subquery,
        primary_table=Booking,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
    ).subquery()


def fetch_booking_summary(booking_summary_subquery, role):
    select_cols_booking_summary = [
        func.json_build_object(
            "event",
            booking_summary_subquery.c.event,
            "event_bookings_count",
            func.count(booking_summary_subquery.c.event),
        )
    ]

    group_by_booking_summary = [booking_summary_subquery.c.event]
    filter_conditions = []

    if role == Role.VENDOR.value:
        filter_conditions.append(
            or_(
                booking_summary_subquery.c.event.like("vendor%"),
                booking_summary_subquery.c.event.like("driver%"),
            )
        )

    return crud.select_records(
        primary_table=booking_summary_subquery,
        select_cols=select_cols_booking_summary,
        group_by=group_by_booking_summary,
        filter_conditions=filter_conditions,
    ).all()


def get_trips_scheduled_today(
    booking_summary_subquery, trip_from_timestamp, trip_to_timestamp
):
    select_cols_trips_today = [func.count()]

    filter_conditions_trips_today = [
        booking_summary_subquery.c.booking_datetime.between(
            convert_date_str_to_utc(trip_from_timestamp),
            convert_date_str_to_utc(trip_to_timestamp),
        )
    ]

    return crud.select_records(
        primary_table=booking_summary_subquery,
        select_cols=select_cols_trips_today,
        filter_conditions=filter_conditions_trips_today,
    ).scalar()

@transactional
def get_lastest_trip_event():
    select_cols = [TripEvent.trip_id, Trip.booking_id, TripEvent.event]
    join_conditions = [(TripEvent, TripEvent.trip_id == Trip.id)]
    order_by = [TripEvent.trip_id, desc(TripEvent.cdate)]
    return (
        crud.select_records(Trip, select_cols=select_cols, join_conditions=join_conditions, order_by=order_by)
        .distinct(TripEvent.trip_id)
        .subquery()
    )

@transactional
def get_booking_info(role: str, **filters):
    latest_booking_event = aliased(latest_booking_event_query())
    booking_cols = get_booking_cols(latest_booking_event)

    join_conditions = [
        (CostCentre, CostCentre.id == Booking.cost_centre_id),
        (latest_booking_event, latest_booking_event.c.booking_id == Booking.id),
        (VendorCity, VendorCity.id == Booking.city_id, 'left'),
    ]

    group_by = [Booking.id, latest_booking_event.c.event, CostCentre.id, CostCentre.code, CostCentre.gstin_no, VendorCity.id]
    order_by = [desc(Booking.cdate)]

    if role == Role.ORGANIZER.value:
        add_organizer_conditions(booking_cols, join_conditions, group_by)

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

    booking_id = filters.get("booking_id")

    if booking_id and get_booking_by_booking_id(booking_id):
        booking_record = query.scalar()
        return {"booking": booking_record}

    else:
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


def get_invoice_cols(latest_booking_event):
    return [
        "booking",
        func.jsonb_build_object(
        *get_booking_cols(latest_booking_event),
        "coordinator",
        func.jsonb_build_object("id", Coordinator.id, "name", Coordinator.name)),
        "event",
        VendorInvoices.event,
        "vendor",
        func.jsonb_build_object("id", Vendor.id, "name", Vendor.name),
    ]


@transactional
def get_invoice_event_info(email: str, **filters):
    if not is_valid_email_for_role(email, Organizer):
        raise ex.EmailNotFound

    latest_booking_event = aliased(latest_booking_event_query())
    booking_cols = get_invoice_cols(latest_booking_event)

    join_conditions = [
        (latest_booking_event, latest_booking_event.c.booking_id == BookingLogs.booking_id),
        (Booking, Booking.id == BookingLogs.booking_id),
        (Vendor, Vendor.id == Booking.vendor_id),
        (Coordinator, Coordinator.id == Booking.coordinator_id),
        (VendorInvoices, VendorInvoices.booking_id == Booking.id),
        (CostCentre, CostCentre.id == Booking.cost_centre_id, 'left'),
        (VendorCity, VendorCity.id == Booking.city_id, 'left')
    ]

    group_by = [
        VendorInvoices.booking_id,
        VendorInvoices.event,
        Booking.id,
        latest_booking_event.c.event,
        Vendor.id,  
        Vendor.name,
        VendorCity.id,
        Coordinator.id, Coordinator.name, 
        CostCentre.id, CostCentre.code, CostCentre.gstin_no
    ]
    order_by = [Booking.booking_datetime]

    select_cols = [func.jsonb_build_object(*booking_cols)]

    limit = filters.get("limit", 10)
    page = filters.get("page", 1)
    offset = (page - 1) * limit

    filter_conditions = [
        Booking.organizer_id == filters["organizer_id"],
        VendorInvoices.event == filters["invoice_status"],
    ]

    query = crud.select_records(
        primary_table=BookingLogs,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
        group_by=group_by,
        order_by=order_by,
    )

    booking_id = filters.get("booking_id")

    if booking_id and get_booking_by_booking_id(booking_id):
        booking_record = query.scalar()
        return {"booking": booking_record}

    else:
        result = query.limit(limit).offset(offset).all()
        total_bookings = query.count()
        booking_records = list(chain.from_iterable(result))
        return {
            "page": page,
            "total_records": total_bookings,
            "records_per_page": limit,
            "total_pages": (total_bookings + limit - 1) // limit,
            "invoices": booking_records,
        }


def add_coordinator_json(booking_cols):
    booking_cols.extend(["coordinator", build_coordinator_json()])


def add_organizer_conditions(booking_cols, join_conditions, group_by):
    add_coordinator_json(booking_cols)
    join_conditions.append((Coordinator, Coordinator.id == Booking.coordinator_id))
    group_by.append(Coordinator.id)


def add_vendor_conditions(booking_cols, join_conditions, group_by, plan_subquery):
    add_coordinator_json(booking_cols)
    join_conditions.extend(
        [
            (Plan, Plan.id == Booking.plan_id),
            (
                plan_subquery,
                plan_subquery.c.plan_id == Booking.plan_id,
            ),
            (Coordinator, Coordinator.id == Booking.coordinator_id),
        ]
    )
    group_by.extend(
        [
            Coordinator.id,
            plan_subquery.c.plan_id,
            plan_subquery.c.plan_vehicle_info,
        ]
    )


def build_filter_conditions(filters, latest_booking_event=None):
    filter_conditions = []

    for key, value in filters.items():
        if key == "booking_type" and value:
            filter_conditions.append(Booking.type == value)
        if key == "cab_type" and value:
            filter_conditions.append(Booking.cab_type == value)
        if key == "status" and value:
            filter_conditions.append(latest_booking_event.c.event.in_(value))
        if key == "pickup_start_date" and value:
            filter_conditions.append(
                Booking.booking_datetime >= convert_date_str_to_utc(value)
            )
        if key == "pickup_end_date" and value:
            filter_conditions.append(
                Booking.booking_datetime <= convert_date_str_to_utc(value)
            )
        elif key == "pickup_start_datetime" and value:
            filter_conditions.append(Booking.booking_datetime >= convert_date_str_to_utc(value))
        elif key == "pickup_end_datetime" and value:
            filter_conditions.append(Booking.booking_datetime <= convert_date_str_to_utc(value))
        if key == "coordinator_id" and value:
            filter_conditions.append(Booking.coordinator_id == value)
        if key == "organizer_id" and value:
            filter_conditions.append(Booking.organizer_id == value)
        if key == "vendor_id" and value:
            filter_conditions.append(Plan.vendor_id == value)
        if key == "booking_id" and value:
            filter_conditions.append(Booking.id == value)
        if key == "cost_centre" and value:
            filter_conditions.append(CostCentre.code == value)
            
    return filter_conditions


@transactional
def get_booking_by_booking_id(booking_id: str):
    booking_record = crud.select_records(
        Booking, filter_conditions=[Booking.id == str(validate_booking_id(str(booking_id)))]
    ).first()
    if booking_record:
        return booking_record
    raise ex.RecordNotFound(model="Booking")


def validate_booking_id(booking_id: str):
    try:
        return uuid.UUID(str(booking_id))
    except ValueError:
        raise ex.InvalidBookingId


def get_guests_info(booking_id):
    response = []

    booking_logs = (
        crud.select_records(
            BookingLogs, filter_conditions=[BookingLogs.booking_id == booking_id]
        ).all()
        or []
    )
    
    for booking_log in booking_logs:
        guest_waypoints = (
            crud.select_records(
                Waypoint,
                filter_conditions=[
                    Waypoint.booking_log_id == booking_log.id,
                ],
                order_by=[Waypoint.id]
            ).all()
            or []
        )

        source_info = obj_to_dict.location_info_as_dict(booking_log.source)
        destination_info = obj_to_dict.location_info_as_dict(booking_log.destination) if booking_log.destination else {}
        waypoint_infos = [
            { "waypoint_id": guest_waypoint.id, **obj_to_dict.location_info_as_dict(guest_waypoint.waypoint) }
            for guest_waypoint in guest_waypoints
        ]
        booking_log_info = obj_to_dict.booking_log_info_as_dict(booking_log, source_info, waypoint_infos, destination_info)

        response.append(booking_log_info)

    return response


@transactional
def get_guests_by_booking_id(email, role, booking_id):
    model = get_model_by_role(role)

    if not is_valid_email_for_role(email, model):
        raise ex.EmailNotFound

    response = get_guests_info(booking_id)
    return {"guests": response}


def fetch_guest_info(booking_id: str):
    source_location = aliased(Location, name="source_location")
    destination_location = aliased(Location, name="destination_location")

    select_cols = [
        func.jsonb_build_object(
            "guests", build_guest_json(source_location, destination_location)
        )
    ]
    filter_conditions = [BookingLogs.booking_id == booking_id]
    join_conditions = [
        (Guest, Guest.id == BookingLogs.guest_id),
        (source_location, source_location.id == BookingLogs.source_id),
        (
            destination_location,
            destination_location.id == BookingLogs.destination_id,
        ),
    ]

    return crud.select_records(
        primary_table=BookingLogs,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions,
    ).scalar()


def latest_booking_event_query():
    select_cols = [BookingEvent.booking_id, BookingEvent.event, BookingEvent.meta_data]
    order_by = [BookingEvent.booking_id, desc(BookingEvent.cdate)]
    return (
        crud.select_records(BookingEvent, select_cols=select_cols, order_by=order_by)
        .distinct(BookingEvent.booking_id)
        .subquery()
    )

def latest_trip_event_query():
    select_cols = [TripEvent.trip_id, TripEvent.event]
    order_by = [TripEvent.trip_id, desc(TripEvent.cdate)]
    return (
        crud.select_records(TripEvent, select_cols=select_cols, order_by=order_by)
        .distinct(TripEvent.trip_id)
        .subquery()
    )

def get_booking_cols(latest_booking_event):
    return [
        "id",
        Booking.id,
        "type",
        Booking.type,
        "bid",
        Booking.bid,
        "cab_type",
        Booking.cab_type,
        "pickup_date",
        cutils.format_booking_datetime(Booking.booking_datetime, const.DATE_FORMAT),
        "pickup_time",
        cutils.format_booking_datetime(Booking.booking_datetime, const.TIME_FORMAT),
        "status",
        latest_booking_event.c.event,
        "vendor_id",
        Booking.vendor_id,
        "cost_centre",
        build_cost_centre_json(),
        "travel_mode",
        Booking.travel_mode,
        "po_number",
        Booking.po_number,
        "booking_city",
        case((Booking.city_id != None, app_utils.build_city_json(VendorCity)), else_=None),
        "cc_recipients",
        Booking.cc_recipients,
        "description",
        Booking.description
    ]


def build_coordinator_json():
    return func.jsonb_build_object(
        "id", Coordinator.id, "name", Coordinator.name, "email", Coordinator.email
    )


def build_guest_json(source, destination):
    return func.json_agg(
        func.jsonb_build_object(
            "id",
            Guest.id,
            "name",
            Guest.name,
            "email",
            Guest.email,
            "mobile",
            Guest.mobile,
            "source",
            build_location_json(source),
            "destination",
            build_location_json(destination)
        )
    )


def build_invoice_json(source, destination):
    return func.json_agg(
        func.jsonb_build_object(
            "id",
            Guest.id,
            "guest_name",
            Guest.name,
            "email",
            Guest.email,
            "mobile",
            Guest.mobile,
            "source",
            build_location_json(source),
            "destination",
            case((BookingLogs.destination_id != None, build_location_json(destination)), else_=None),
            "rank",
            BookingLogs.rank,
            "internal_id",
            BookingLogs.internal_id,
            "vessel_name",
            BookingLogs.vessel_name,
            "date_of_duty",
            case((BookingLogs.date_of_duty != None, cutils.format_booking_datetime(BookingLogs.date_of_duty, const.DATE_FORMAT)), else_=""),
            "start_time",
            case((BookingLogs.date_of_duty != None, cutils.format_booking_datetime(BookingLogs.date_of_duty, const.TIME_FORMAT)), else_=""),
            "flight_details",
            BookingLogs.flight_details,
            "distance_kms",
            Package.distance_kms,
            "interval_hrs",
            Package.interval_hrs,
            'package_detail',
            Package.name,
            "extra_distance_cost",
            Plan.extra_distance_cost,
            "extra_hour_cost",
            Plan.extra_hour_cost,
            "trip_id",
            Trip.id,
            "starting_odo",
            Trip.starting_odo_proof,
            "vendor_cost",
            Plan.vendor_cost,
            "starting_odo",
            Trip.starting_odo,
            "ending_odo",
            Trip.ending_odo,
            "starting_time",
            case((Trip.starting_time != None, cutils.format_booking_datetime(Trip.starting_time, const.DATE_TIME_FORMAT)), else_="NA"),
            "ending_time",
            case((Trip.ending_time != None, cutils.format_booking_datetime(Trip.ending_time, const.DATE_TIME_FORMAT)), else_="NA"),
            "distance",
            Trip.distance,
            "duration",
            Trip.duration,
            "trip_cdate",
            TripEvent.cdate,
            "trip_event",
            TripEvent.event,
            "driver_charge",
            DriverCharge.charge,
            "vendor_tax",
            Vendor.tax,
            "booking_id",
            Booking.id,
            "organizer_id",
            Booking.organizer_id,
            "coordinator_id",
            Booking.coordinator_id,
            "vendor_id",
            Booking.vendor_id,
            "waypoint",
            Location.address,
            "booking_type",
            Booking.type,
            "cab_type",
            Booking.cab_type,
            "bid",
            Booking.bid,
            "booking_datetime",
            cutils.format_booking_datetime(Booking.booking_datetime, const.DATE_FORMAT),
            "coordinator_name",
            Coordinator.name,
            "gstin_no",
            CostCentre.gstin_no,
            "cost_centre",
            CostCentre.code,
            "address",
            CostCentre.address,
            "calculated_extra_kms",
            case((Trip.distance > Package.distance_kms, Trip.distance - Package.distance_kms), else_=0),
            "calculated_extra_hrs",
            case((Trip.duration > Package.interval_hrs, Trip.duration - Package.interval_hrs), else_=0),
            "cancellation_fare",
            VendorInvoices.cancellation_amount,
            "vendor_tax_amount",
            func.round(
                func.cast((VendorInvoices.base_fare + VendorInvoices.cancellation_amount) * (Vendor.tax / 100), Numeric), 2
            )
        )
    )


def build_location_json(location):
    return func.jsonb_build_object(
        "name",
        location.name,
        "address",
        location.address,
        "landmark",
        location.landmark,
        "latitude",
        location.latitude,
        "longitude",
        location.longitude,
    )


def build_vehicle_json():
    return func.jsonb_build_object("id", Vehicle.id, "name", Vehicle.name)


def build_plan_vehicle_info_json():
    return func.jsonb_build_object(
        "id",
        Package.id,
        "name",
        Package.name,
        "distance_kms",
        Package.distance_kms,
        "interval_hrs",
        Package.interval_hrs,
        "description",
        Package.description,
        "cost",
        Plan.vendor_cost,
        "extra_distance_cost",
        Plan.extra_distance_cost,
        "extra_hour_cost",
        Plan.extra_hour_cost,
        "vehicle",
        build_vehicle_json(),
    ).label("plan_vehicle_info")


def get_plan_subquery():
    select_cols = [
        Plan.id.label("plan_id"),
        build_plan_vehicle_info_json(),
    ]

    join_conditions = [
        (Package, Package.id == Plan.package_id),
        (Vehicle, Vehicle.id == Plan.vehicle_id),
    ]
    return crud.select_records(
        primary_table=Plan,
        select_cols=select_cols,
        join_conditions=join_conditions,
    ).subquery()


def create_distance_matrix(data):
    addresses = data["addresses"]
    api_key = data["api_key"]
    # Distance Matrix API only accepts 100 elements per request, so get rows in multiple requests.
    max_elements = 100
    num_addresses = len(addresses)  # 16 in this example.
    # Maximum number of rows that can be computed per request (6 in this example).
    max_rows = max_elements // num_addresses
    # num_addresses = q * max_rows + r (q = 2 and r = 4 in this example).
    q, r = divmod(num_addresses, max_rows)
    dest_addresses = addresses
    distance_matrix = []
    # Send q requests, returning max_rows rows per request.
    for i in range(q):
        origin_addresses = addresses[i * max_rows : (i + 1) * max_rows]
        response = send_request(origin_addresses, dest_addresses, api_key)
        distance_matrix += build_distance_matrix(response)

    # Get the remaining remaining r rows, if necessary.
    if r > 0:
        origin_addresses = addresses[q * max_rows : q * max_rows + r]
        response = send_request(origin_addresses, dest_addresses, api_key)
        distance_matrix += build_distance_matrix(response)

    data["distance_matrix"] = distance_matrix


def build_address_str(addresses):
    # Build a pipe-separated string of addresses
    address_str = ""
    for i in range(len(addresses) - 1):
        address_str += addresses[i] + "|"
    address_str += addresses[-1]
    return address_str


def send_request(origin_addresses, dest_addresses, api_key):
    request = const.DISTANCE_MATRIX_URL
    params = {
        "origins": build_address_str(origin_addresses),
        "destinations": build_address_str(dest_addresses),
        "key": api_key,
    }
    return cutils.make_google_api_request(request, params=params)

def build_distance_matrix(response):
    distance_matrix = []
    for row in response["rows"]:
        row_list = [
            row["elements"][j]["distance"]["value"] for j in range(len(row["elements"]))
        ]
        distance_matrix.append(row_list)
    return distance_matrix


def get_optimal_route(data):
    # Create the routing index manager.
    manager = pywrapcp.RoutingIndexManager(
        len(data["distance_matrix"]), data["num_vehicles"], data["depot"]
    )

    # Create Routing Model.
    routing = pywrapcp.RoutingModel(manager)

    # Define cost of each arc.
    def distance_callback(from_index, to_index):
        """Returns the manhattan distance between the two nodes."""
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data["distance_matrix"][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Define Pickups & Dropoffs Requests.
    for request in data["origin_destination_mapping"]:
        pickup_index = manager.NodeToIndex(request[0])
        delivery_index = manager.NodeToIndex(request[1])
        routing.AddPickupAndDelivery(pickup_index, delivery_index)

    # Setting first solution heuristic.
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    )
    search_parameters.solution_limit = 1
    search_parameters.time_limit.seconds = 5

    # Solve the problem.
    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        optimal_route = []
        index = routing.Start(0)

        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            optimal_route.append(node)
            index = solution.Value(routing.NextVar(index))

        return {"optimal_route": get_coordinates_for_optimal_route(data, optimal_route)}


def convert_seconds_to_hm(seconds):
    if seconds < 3600:
        minutes = math.ceil(seconds / 60)
        return f"{minutes} min"

    hours, remainder = divmod(seconds, 3600)
    minutes = math.ceil(remainder / 60)
    return f"{int(hours)} hr {minutes} min"


def convert_meters_to_kilometers(meters):
    kilometers = meters / 1000
    return f"{round(kilometers, 1)} km"


def calculate_total_distance_duration(routes):
    total_distance = 0
    total_duration = 0
    for route in routes:
        for leg in route["legs"]:
            total_distance += leg["distance"]["value"]
            total_duration += leg["duration"]["value"]
    return total_distance, total_duration


def construct_maps_url(coordinates):
    base_url = const.GOOGLE_MAPS_URL
    coordinates_str = "/".join(coordinates)
    maps_url = base_url + coordinates_str + "/"
    return maps_url


def get_route_summary(gmap_client, origin, destination, waypoints=None) :
    """
    Fetches route information and returns total distance, duration, and a navigation URL.

    Args:
        gmap_client (googlemaps.Client): Authenticated Google Maps client.
        origin (str): Starting point.
        destination (str): End point.
        waypoints (List[str]): List of waypoints between origin and destination.

    Returns:
        Dict[str, str]: Contains total distance in km, total duration in h:m format, and a navigation URL.
    """
    directions = gmap_client.directions(
        origin=origin,
        destination=destination,
        waypoints=waypoints
    )

    total_distance, total_duration = calculate_total_distance_duration(directions)

    return {
        "total_distance": convert_meters_to_kilometers(total_distance),
        "total_duration": convert_seconds_to_hm(total_duration),
        "navigation_url": construct_maps_url([origin] + waypoints + [destination]),
    }

def get_directions_info(gmap, locations):
    origin = locations[0]
    waypoints = locations[1:]
    destination = origin
    locations.append(origin)

    data = gmap.directions(origin=origin, destination=destination, waypoints=waypoints)
    total_distance, total_duration = calculate_total_distance_duration(data)
    
    return {
        "total_distance": convert_meters_to_kilometers(total_distance),
        "total_duration": convert_seconds_to_hm(total_duration),
        "navigation_url": construct_maps_url(locations),
    }

def get_coordinates_for_optimal_route(data, optimal_route):
    coordinates_with_index = data.get("coordinates_with_index", {})
    return [
        get_key_from_value(coordinates_with_index, index) for index in optimal_route
    ]


def get_key_from_value(dictionary, target_value):
    for key, value in dictionary.items():
        if value == target_value:
            return key


@transactional
def get_booking_history_by_id(booking_id: str, select_cols):
    try:
        filter_conditions = [BookingEvent.booking_id == booking_id]

        order_by = [asc(BookingEvent.cdate)]
        records = crud.select_records(
            primary_table=BookingEvent,
            filter_conditions=filter_conditions,
            order_by=order_by,
            select_cols=select_cols,
        ).all()

        return list(chain.from_iterable(records))
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="get")


@transactional
@validate_email_by_role
def update_fcm_token(email, model, fcm_token):
    result = crud.update_records(
        model,
        filter_criteria=[model.email == email],
        records_to_update={"fcm_token": fcm_token},
    )
    if result.rowcount:
        return {"message": "Successfully updated fcm token"}
    raise ex.DatabaseOperationFailed(action="update")

def get_paginated_data(query, filters, output_name):
   limit = filters.get("limit", 10)
   page = filters.get("page", 1)
   offset = (page - 1) * limit

   result = query.limit(limit).offset(offset).all()
   total_records = query.count()
   data = list(chain.from_iterable(result))

   return {
      "page": page,
      "total_records": total_records,
      "records_per_page": limit,
      "total_pages": (total_records + limit - 1) // limit,
      output_name : data,
   }
@transactional
def search_record_by_name(model, name = None):
    filter_conditions = []
    if name:
        filter_value = f"%{name}%"
        filter_conditions.append(model.name.ilike(filter_value))
    order_by = [model.name]
    return crud.select_records(model, filter_conditions=filter_conditions, order_by=order_by).all()

@transactional
def get_bookings_ids_by_name(model, name):
    select_cols = [func.array_agg(model.booking_id)]
    filter_conditions = [model.name == name]
    return crud.select_records(model, select_cols=select_cols, filter_conditions=filter_conditions).scalar()

@transactional
def get_vendor_invoice_by_booking_id(booking_id):
    filter_conditions=[VendorInvoices.booking_id == booking_id]
    join_conditions = [(Plan, Plan.id == VendorInvoices.plan_id)]
    return crud.select_records(VendorInvoices, filter_conditions=filter_conditions, join_conditions=join_conditions).first()

def get_trip_record_by_booking_id(booking_id: str):
    filter_conditions = [Trip.booking_id == booking_id]
    trip_record = crud.select_records(
        primary_table=Trip,
        filter_conditions=filter_conditions,
    ).first()
    
    if not trip_record:
        raise ex.TripNotFound(booking_id=booking_id)
    
    return trip_record

def get_trip_history_records_by_trip_id(trip_id: str):
    filter_conditions = [TripEvent.trip_id == trip_id]
    order_by = [TripEvent.cdate] 
    trip_history = crud.select_records(
        primary_table=TripEvent,
        filter_conditions=filter_conditions,
        order_by=order_by,
    ).all()
    return trip_history

def get_driver_charge_by_details(vendor_id: int, vehicle_model_id:int, driver_charge_id: int = None):
    filter_conditions=[
        DriverCharge.vendor_id == vendor_id, 
        DriverCharge.vehicle_model_id == vehicle_model_id,
        DriverCharge.is_active == True
    ]
    if driver_charge_id:
        filter_conditions.append(DriverCharge.id != driver_charge_id)

    return crud.select_records(
        primary_table=DriverCharge,
        filter_conditions=filter_conditions,
    ).first()

def get_latest_booking_events_summary():
    B = aliased(Booking)
    le = aliased(latest_booking_event_query())
    
    select_cols = [
        func.json_build_object(
        "pending", func.count(case((le.c.event == "pending", 1))),
        "vendor_requested", func.count(case((le.c.event == "vendor_requested", 1))),
        "vendor_accepted", func.count(case((le.c.event == "vendor_accepted", 1))),
        "vendor_declined", func.count(case((le.c.event == "vendor_declined", 1))),
        "vendor_assign_revoked", func.count(case((le.c.event == "vendor_assign_revoked", 1))),
        "driver_assigned", func.count(case((le.c.event == "driver_assigned", 1))),
        "driver_reassigned", func.count(case((le.c.event == "driver_reassigned", 1))),
        "invoice_created", func.count(case((le.c.event == "invoice_created", 1))),
        "invoice_approved", func.count(case((le.c.event == "invoice_approved", 1))),
        # "total_bookings", func.count(B.id),
        # func.count(case((le.c.event == "cancelled", 1))).label("cancelled"),
        # func.count(case((le.c.event == "organizer_assigned", 1))).label("organizer_assigned"),
        # func.count(case((le.c.event == "vendor_requested", 1))).label("vendor_requested"),
        # func.count(case((le.c.event == "vendor_declined", 1))).label("vendor_declined"),
        # func.count(case((le.c.event == "vendor_reassigned", 1))).label("vendor_reassigned"),
        # func.count(case((le.c.event == "vendor_assign_revoked", 1))).label("vendor_assign_revoked"),
        # func.count(case((le.c.event == "driver_reassigned", 1))).label("driver_reassigned"),
        # func.count(case((le.c.event == "invoice_rejected", 1))).label("invoice_rejected"),
        # func.count(case((le.c.event == "invoice_created_by_organizer", 1))).label("invoice_created_by_organizer"),
        # func.count(case((le.c.event == "invoice_created_by_super_organizer", 1))).label("invoice_created_by_super_organizer"),  
        )
    ]
    join_conditions = [(le, le.c.booking_id == B.id, 'left')]
    return crud.select_records(B, select_cols=select_cols, join_conditions=join_conditions).scalar()

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def fetch_booking_insights(organizer: Organizer,trip_from_timestamp, trip_to_timestamp):
    latest_booking_events_summary = get_latest_booking_events_summary()
    
    return {
        "events":[
            {
                "event": "pending",
                "event_bookings_count": latest_booking_events_summary["pending"] + latest_booking_events_summary["vendor_declined"] + latest_booking_events_summary["vendor_assign_revoked"],
            },
            {
                "event": "vendor_requested",
                "event_bookings_count": latest_booking_events_summary["vendor_requested"],
            },
            {
                "event": "vendor_accepted",
                "event_bookings_count": latest_booking_events_summary["vendor_accepted"],
            },
            {
                "event": "invoice_created",
                "event_bookings_count": latest_booking_events_summary["invoice_created"],
            },
            {
                "event": "invoice_approved",
                "event_bookings_count": latest_booking_events_summary["invoice_approved"],
            },
            ]
        }