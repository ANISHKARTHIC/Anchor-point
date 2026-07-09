from itertools import chain
from fastapi import BackgroundTasks
from app_routes.booking.schema import BookingModel, BookingStatus, CabRequestModel
from app_routes.coordinator.utils import (
    get_or_create_coordinator,
)
from app_routes.organizer.schema import (
    OrganizerModel,
    UpdateBookingModel,
    UpdateOrganizer,
    OrganizerRole,
    OptimalRoute,
    UpdateBookingStatus,
)
from app_models.models import BookingLogs, Coordinator, CostCentre, Guest, Location, Organizer, Booking, BookingEvent, Vendor, VendorCity
from app_models import crud
from app_utils.decorators import authentic_user, transactional, email_exists_or_raise, verify_jwt_role_and_email
from app_utils.utils import get_booking_by_booking_id, get_booking_cols, latest_booking_event_query
from app_schemas.schema import Role
from common_utils import utils as cutils
from common_utils import obj_to_dict
from app_utils import exception as ex
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, desc, case
from sqlalchemy.orm import aliased
from typing import List, Union
import uuid
import os
from app_utils import utils as app_utils
from app_routes.booking import utils as booking_utils
from app_configs import constants as const
from datetime import datetime
import logging

def super_organizer_only(func):
    def wrapper(email, *args, **kwargs):
        """
        A decorator that checks if the user with the specified email is a super organizer.
        Args:
            email: The email of the user to check.
            args: Additional positional arguments to pass to the decorated function.
            kwargs: Additional keyword arguments to pass to the decorated function.
            The result of the decorated function.
        Raises:
            PermissionDenied: If the user is not a super organizer.
        """
        result = crud.select_records(
            primary_table=Organizer,
            filter_conditions=[
                Organizer.email == email,
                Organizer.role == OrganizerRole.SUPER.value,
            ],
        ).first()
        if result:
            return func(result, *args, **kwargs)
        raise ex.PermissionDenied

    return wrapper


@transactional
def get_organizer_by_email(email: str) -> Organizer:
    """
    Retrieves a organizer by email address.
    Args:
        email (str): The organizer's email address.
    Returns:
        Organizer: The organizer record or None if not found.
    """
    return crud.select_records(
        primary_table=Organizer, filter_conditions=[Organizer.email == email]
    ).first()


def build_organizer_json():
    return func.jsonb_build_object(
        "id",
        Organizer.id,
        "name",
        Organizer.name,
        "email",
        Organizer.email,
        "role",
        Organizer.role,
        "is_verified",
        Organizer.is_verified,
        "is_active",
        Organizer.is_active,
    ).label("organizer_json")


@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value, Role.VENDOR.value])
def get_organizers(user: Union[Organizer, Vendor]):
    select_cols = [build_organizer_json()]
    records = crud.select_records(
        primary_table=Organizer, select_cols=select_cols, order_by=[Organizer.name]
    ).all()
    return {"organizers": list(chain.from_iterable(records))}


@transactional
@super_organizer_only
def get_organizer_by_id(organizer: Organizer, organizer_id: int):
    select_cols = [build_organizer_json()]
    organizer_record = crud.select_records(
        primary_table=Organizer,
        select_cols=select_cols,
        filter_conditions=[Organizer.id == organizer_id],
    ).scalar()
    if not organizer_record:
        raise ex.RecordNotFound(model="Organizer")
    return {"organizer": organizer_record}


@transactional
@super_organizer_only
def create_organizer(super_organizer: Organizer, organizer: OrganizerModel) -> dict:
    """
    Create organizer accounts and send confirmation emails.
    Args:
        super_organizer (Organizer): The super organizer initiating the creation.
        organizers (List[OrganizerModel]): List of organizers to be created.
    Returns:
        dict: A dictionary containing a success message upon successful creation.
    """
    try:
        existing_record = crud.select_records(
            Organizer, filter_conditions=[Organizer.email == organizer.email]
        ).first()

        if existing_record:
            raise ex.RecordExists(field_name="email", field_value=organizer.email)
        
        password = cutils.generate_password()
        hash_password = cutils.get_hashed_password(password)
        records_to_insert = {
            **organizer.model_dump(exclude_unset=True),
            "password": hash_password,
        }
        new_record = crud.insert_record(Organizer, **records_to_insert)
        subject, body = cutils.admin_acc_creation_mail_content(
            admin_name=organizer.name,
            admin_email=organizer.email,
            admin_password=password,
        )
        cutils.send_mail(
            recipient_email=organizer.email, subject=subject, body=body
        )
        return {"email": new_record.email, "message": "Successfully created new organizer account"}

    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")


@transactional
def delete_organizer_by_id(email: str, organizer_id: int):
    """
    Delete organizer (Soft) from database.
    Args:
        id (str): The ID of the Organizer.
    Returns:
        dict: A dictionary with a success message upon successfully deleting the organizer record.
    Raises:
        HTTPException:
            -422 Unprocessable entity : If there is an issue in deleting record.
            -404 Not found: If the given email not present in db.
    """
    organizer_record = get_organizer_by_id(email, organizer_id)
    filter_criteria = [Organizer.id == organizer_id]
    records_to_update = {"is_active": False}
    update_result = crud.update_records(Organizer, filter_criteria, records_to_update)
    if update_result.rowcount:
        return {"message": "Organizer deleted successfully"}
    raise ex.DatabaseOperationFailed(action="delete")


@transactional
def prepare_organizer_records(organizers: List[OrganizerModel]) -> List[dict]:
    """
    Prepare organizer records with necessary data.
    Args:
        organizers (List[CreateOrganizers]): List of organizers to be created.
    Returns:
        List[dict]: List of prepared organizer records.
    """
    return [
        {
            **organizer.model_dump(exclude_unset=True),
            "password": cutils.generate_password(),
            "role": OrganizerRole.NORMAL.value,
        }
        for organizer in organizers
    ]


def insert_organizer_records(records: List[dict]) -> List[dict]:
    """
    Insert organizer records into the database after hashing passwords.
    Args:
        records (List[dict]): List of organizer records with plain passwords.
    Returns:
        List[dict]: List of inserted organizer records with hashed passwords.
    """
    try:
        records = [
            {**record, "password": cutils.get_hashed_password(record["password"])}
            for record in records
        ]
        return crud.insert_records(Organizer, records=records)
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")


def send_acc_creation_emails(super_organizer: Organizer, organizers: List[dict]):
    """
    Send account creation confirmation emails to organizers.
    Args:
        super_organizer (Organizer): The super organizer initiating the creation.
        organizers (List[dict]): List of organizers to whom the emails should be sent.
    """
    for organizer in organizers:
        subject, body = cutils.admin_acc_creation_mail_content(
            admin_name=organizer["name"],
            admin_email=organizer["email"],
            admin_password=organizer["password"],
        )
        cutils.send_mail(recipient_email=organizer["email"], subject=subject, body=body)

@transactional
@authentic_user(Organizer)
def login(organizer: Organizer):
    payload = {"email": organizer.email, "role": Role.ORGANIZER.value}
    access_token = cutils.create_access_token(payload).get("access_token")
    cutils.update_login_status(Organizer, organizer.email)
    return {
        "id": organizer.id,
        "name": organizer.name,
        "email": organizer.email,
        "role": organizer.role,
        "is_active": organizer.is_active,
        "is_verified": organizer.is_verified,
        "access_token": access_token,
        "message": "Logged in successfully",
    }

@transactional
def update_organizer_by_id(
    email: str, organizer_id: int, update_request: UpdateOrganizer
) -> dict:
    """
    Update organizer record in the database.
    Args:
        organizer (CoordinatorIn): An instance of Coordinator containing the updated details.
        email (str): The email of the Organizer.
    Returns:
        dict: A dictionary with a success message upon successfully updating the organizer's details.
    Raises:
        HTTPException:
            -422 Unprocessable entity : If there is an issue in updating record.
            -404 Not found: If the given email not present in db.
    """
    organizer_record = get_organizer_by_id(email, organizer_id)
    records_to_update = update_request.model_dump(exclude_unset=True)
    update_result = crud.update_records(
        Organizer, [Organizer.id == organizer_id], records_to_update
    )
    if update_result.rowcount:
        return {"message": "Organizer details updated successfully"}
    raise ex.DatabaseOperationFailed(action="update")


@transactional
def task_summary(email: str):
    """
    Generates a summary of booking-related information for a given email.
    Args:
        email (str): The email address for which the summary is generated.
    Returns:
        Dict: A dictionary containing booking summary information, including booking types and status.
    """
    return {
        "task_summary": {
            "booking_type": get_booking_request_count(),
            "booking_status": get_booking_status_count(),
        }
    }


@transactional
def get_booking_request_count() -> List[dict]:
    """
    Retrieves the count of booking requests based on their types.
    Returns:
        List[dict]]: A list of dictionaries, each containing the booking type and the corresponding count.
    """
    select_cols = [Booking.type, func.count(Booking.id)]
    group_by = [Booking.type]
    booking_requests = crud.select_records(
        Booking, select_cols=select_cols, group_by=group_by
    ).all()
    return [
        {"type": booking_type, "count": count}
        for booking_type, count in booking_requests
    ]


@transactional
def get_booking_status_count() -> List[dict]:
    """
    Retrieves the count of booking statuses based on their types.
    Returns:
        List[dict]]: A list of dictionaries, each containing the booking status and the corresponding count.
    """
    select_cols = [BookingEvent.event, func.count(BookingEvent.booking_id)]
    join_conditions = [(BookingEvent, BookingEvent.booking_id == Booking.id)]
    group_by = [BookingEvent.event]
    booking_status = crud.select_records(
        Booking,
        select_cols=select_cols,
        join_conditions=join_conditions,
        group_by=group_by,
    ).all()
    return [{"event": status, "count": count} for status, count in booking_status]


@transactional
@email_exists_or_raise(Organizer)
def update_booking_status(
    organizer: Organizer, booking_id: uuid, status: str, metadata: dict
):
    try:
        if get_booking_by_booking_id(booking_id):
            update_booking = crud.update_records(
                Booking,
                filter_criteria=[Booking.id == booking_id],
                records_to_update={"organizer_id": organizer.id},
            )
            records_to_insert = {
                "booking_id": booking_id,
                "event": status,
                "meta_data": metadata,
            }
            if update_booking.rowcount:
                crud.insert_record(BookingEvent, **records_to_insert)
                return {
                    "booking_id": booking_id,
                    "message": "Successfully updated booking status",
                }
            raise ex.DatabaseOperationFailed(action="update")
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")


def add_coordinate(coordinates, locations):
    if coordinates not in locations:
        locations[coordinates] = len(locations)


def add_origin_destination_mapping(
    origin_index, destination_index, origin_destination_mapping
):
    if [origin_index, destination_index] not in origin_destination_mapping:
        origin_destination_mapping.append([origin_index, destination_index])


def create_origin_destination_mapping(
    pickups_dropoffs, origin_destination_mapping, locations
):
    for pickup_dropoff in pickups_dropoffs:
        add_coordinate(pickup_dropoff["origin"], locations)
        add_coordinate(pickup_dropoff["destination"], locations)
        add_origin_destination_mapping(
            locations[pickup_dropoff["origin"]],
            locations[pickup_dropoff["destination"]],
            origin_destination_mapping,
        )


@transactional
def get_optimal_route(map_request: OptimalRoute):
    locations = {}
    origin_destination_mapping = []

    if map_request.vendor_location:
        locations[map_request.vendor_location] = 0
    if map_request.driver_location:
        locations[map_request.driver_location] = 0

    create_origin_destination_mapping(
        map_request.pickups_dropoffs, origin_destination_mapping, locations
    )
    data = {
        "api_key": os.getenv("GOOGLE_MAPS_API_KEY"),
        "addresses": list(locations.keys()),
        "vendor_location": map_request.vendor_location,
        "coordinates_with_index": locations,
        "origin_destination_mapping": origin_destination_mapping,
        "num_vehicles": 1,
        "depot": 0,
    }
    app_utils.create_distance_matrix(data)
    return app_utils.get_optimal_route(data)


@transactional
@email_exists_or_raise(Organizer)
def get_plan_data(organizer, booking_id):
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
@email_exists_or_raise(Organizer)
def create_booking(organizer: Organizer, booking_request: BookingModel, background_tasks: BackgroundTasks):
    try:
        if cutils.check_domain_in_list(booking_request.coordinator_email):
            raise ex.PublicEmailDomainNotAllowedException

        coordinator = get_or_create_coordinator(booking_request.coordinator_email)
        
        pick_up_dates = booking_request.data.pick_up_date
        booking_status = BookingStatus.ORGANIZER_ASSIGNED.value
        booking_request.data.organizer_id = organizer.id
        
        if isinstance(pick_up_dates, list):        
            booking_ids, bids = [], []
            
            for pick_up_date in pick_up_dates:
                booking_request.data.pick_up_date = pick_up_date
                booking_record = booking_utils.process_booking_flow(booking_request, background_tasks, booking_status, coordinator, organizer)
                bids.append(booking_record.bid)
                booking_ids.append(booking_record.id)
            
            return {
                "booking_id": booking_ids,
                "bid": bids,
                "message": "Successfully created recurrent booking records",
            }
        else:
            booking_record = booking_utils.process_booking_flow(booking_request, background_tasks, booking_status, coordinator, organizer)
            return {
                "booking_id": booking_record.id,
                "bid": booking_record.bid,
                "message": "Successfully created new booking record",
            }
    except SQLAlchemyError:
        raise ex.DatabaseOperationFailed(action="insert")

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_booking_info(organizer_record: Organizer, **filters):
    latest_booking_event = aliased(latest_booking_event_query())
    booking_cols = [
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
        "coordinator",
        app_utils.build_coordinator_json(),
        "cost_centre",
        app_utils.build_cost_centre_json(),
        "travel_mode",
        Booking.travel_mode,
        "po_number",
        Booking.po_number,
        "booking_city",
        case((Booking.city_id != None, app_utils.build_city_json(VendorCity)), else_=None),
    ]

    join_conditions = [
        (Coordinator, Coordinator.id == Booking.coordinator_id),
        (latest_booking_event, latest_booking_event.c.booking_id == Booking.id),
        (CostCentre, CostCentre.id == Booking.cost_centre_id),
        (VendorCity, VendorCity.id == Booking.city_id, 'left'),
    ]

    group_by = [Booking.id, latest_booking_event.c.event, Coordinator.id, CostCentre.id, CostCentre.code, CostCentre.gstin_no, VendorCity.id]
    order_by = [desc(Booking.cdate)]

    select_cols = [func.jsonb_build_object(*booking_cols)]

    limit = filters.get("limit", 10)
    page = filters.get("page", 1)
    offset = (page - 1) * limit

    filter_conditions = booking_utils.build_filter_conditions(filters, latest_booking_event)

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
    
@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def update_booking_info_by_booking_id(organizer: Organizer, booking_id: str, booking_update_request: UpdateBookingModel):
    existing_booking_info = app_utils.get_booking_by_booking_id(booking_id)
    update_data = booking_update_request.dict(exclude_unset=True) 
    booking_datetime = cutils.convert_datetime(existing_booking_info.booking_datetime, to_utc=False)
    records_to_update = {}

    if "cab_type" in update_data:
        records_to_update["cab_type"] = update_data["cab_type"]

    if "description" in update_data:
        records_to_update["description"] = update_data["description"]

    if "cost_centre" in update_data:
        records_to_update["cost_centre_id"] = update_data["cost_centre"]["id"]

    if "pick_up_date" in update_data:
        date_str = update_data["pick_up_date"]
        new_date = datetime.strptime(date_str, "%Y-%m-%d")
        booking_datetime = booking_datetime.replace(year=new_date.year, month=new_date.month, day=new_date.day)

    if "pick_up_time" in update_data:
        time_str = update_data["pick_up_time"]
        new_time = datetime.strptime(time_str, "%H:%M")
        booking_datetime = booking_datetime.replace(hour=new_time.hour, minute=new_time.minute, second=new_time.second)

    records_to_update["booking_datetime"] = cutils.convert_datetime(booking_datetime, to_utc=True)
    
    result = crud.update_records(Booking, filter_criteria=[Booking.id == booking_id], records_to_update=records_to_update)
    if result.rowcount < 0:
        raise ex.DatabaseOperationFailed(action="update")
    
    return {"booking_id": booking_id, "message": "Successfully updated the booking info"}
    
def assign_vendor_mail(request:UpdateBookingStatus):
    loggor = logging.getLogger(__name__)
    metaData= request.metadata
    vendor_details=app_utils.get_model_record_by_id(Vendor, metaData.get("vendor_id"))
    bid=app_utils.get_model_record_by_id(Booking, request.booking_id).bid
    subject=const.VENDOR_ASSIGN_MAIL_SUBJECT
    body=const.VENDOR_ASSIGN_MAIL_BODY.format(vendor_name=vendor_details.name,bid=bid,contact_support=os.environ.get("CONTACT_SUPPORT"))
    cutils.send_mail(
            recipient_email=vendor_details.email, subject=subject, body=body,
        )
    loggor.info("email send successfully")