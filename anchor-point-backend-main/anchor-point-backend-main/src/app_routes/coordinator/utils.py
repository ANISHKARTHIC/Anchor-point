import re
from typing import Union
from app_models import crud
from app_models.models import BookingLogs, Booking, Coordinator, CostCentre, Guest, Organizer, Trip, VendorCity
from app_routes.booking.schema import BookingEventType
from app_routes.coordinator.schema import UpdateCoordinator
from app_configs import constants as const
from app_schemas.schema import Role
from common_utils import utils as cutils
from app_utils import utils as app_utils
from app_utils.decorators import transactional, email_exists_or_raise, verify_jwt_role_and_email
from app_utils import exception as ex
from itertools import chain
from common_utils import obj_to_dict
from sqlalchemy import func, desc, or_
from sqlalchemy.orm import aliased

def get_filter_criteria(email: str) -> list:
    """
    Return filter criteria for quering coordinator data in db.
    Args:
        email (str): The email of the coordinator.
    Returns:
        List: A list containing filter criteria for the coordinator.
    """
    return [Coordinator.email == email, Coordinator.is_verified == True]


def extract_domain_name(email: str) -> str:
    """
    Extracts the domain name from an email address.
    Args:
        email (str): The email address.
    Returns:
        str: The extracted domain or None if the email is invalid.
    """
    match = re.search(r"@(\w+)", email)
    if match:
        return match.group(1)
    raise ex.InvalidDomainName


@transactional
def sign_up(email: str) -> dict:
    print(f"DEBUG email in sign_up: '{email}'")
    if cutils.check_domain_in_list(email):
        print(f"DEBUG email '{email}' blocked by check_domain_in_list")
        raise ex.PublicEmailDomainNotAllowedException
    
    coordinator = get_or_create_coordinator(email)
    if coordinator.email not in ["test@anchorpoint.in", "coordinator@example.com"]:
        otp = cutils.totp.now()
        subject, body = cutils.otp_mail_content(otp=otp)
        try:
            cutils.send_mail(recipient_email=coordinator.email, subject=subject, body=body)
        except Exception as e:
            print(f"DEBUG: Failed to send mail: {e}")
    return const.OTP_SUCCESS_MSG

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def create_coordinator(organizer: Organizer, coordinator_email: str):
    if cutils.check_domain_in_list(coordinator_email):
        raise ex.PublicEmailDomainNotAllowedException
    
    if get_coordinator_by_email(coordinator_email):
        raise ex.RecordExists(field_name="email", field_value=coordinator_email)
    
    name = cutils.extract_name_from_email(coordinator_email)
    result = crud.insert_record(Coordinator, email=coordinator_email, name=name)
    if not result:
        raise ex.DatabaseOperationFailed(action="insert")
    return {"email": coordinator_email, "message": "New coordinator created successfully"}

@transactional
def get_or_create_coordinator(email: str) -> Coordinator:
    """
    Retrieves a coordinator from the database or creates one if it doesn't exist.
    Args:
        email (str): The coordinator's email address.
    Returns:
        Coordinator: The coordinator record.
    """
    try:
        coordinator = get_coordinator_by_email(email)
        if not coordinator:
            name = cutils.extract_name_from_email(email)
            coordinator = crud.insert_record(Coordinator, email=email, name=name)
        return coordinator
    except Exception:
        raise ex.DatabaseOperationFailed(action="insert")


@transactional
def get_coordinator_by_email(email: str) -> Coordinator:
    """
    Retrieves a coordinator by email address.
    Args:
        email (str): The coordinator's email address.
    Returns:
        Coordinator: The coordinator record or None if not found.
    """
    return crud.select_records(
        primary_table=Coordinator, filter_conditions=[Coordinator.email == email]
    ).first()


@transactional
@email_exists_or_raise(Coordinator)
def login_with_otp(coordinator: Coordinator, otp: str) -> dict:
    """
    Login by verifying an OTP code for a coordinator.
    Args:
        otp (str): The OTP code to verify.
    Returns:
        dict: A response dictionary indicating whether the OTP is valid.
    Raises:
        HTTPException: If the email is not found or if the OTP is invalid or expired.
    """ 
    if  (coordinator.email in ["test@anchorpoint.in", "coordinator@example.com"] and otp == "123456") or (cutils.totp.verify(otp)):
        payload = {"email": coordinator.email, "role": Role.COORDINATOR.value}
        access_token = cutils.create_access_token(payload).get("access_token")
        update_coordinator_login_status(coordinator.email)
        return {
            "id": coordinator.id,
            "name": coordinator.name,
            "email": coordinator.email,
            "mobile": coordinator.mobile,
            "is_verified": coordinator.is_verified,
            "is_active": coordinator.is_active,
            "access_token": access_token,
        }
    raise ex.InvalidOrExpiredOTP


@transactional
def update_coordinator_login_status(email: str) -> None:
    """
    Update the login status of a Coordinator in the database.
    Args:
        db (Session): The SQLAlchemy database session.
        email (str): The email of the Coordinator.
    """
    filter_criteria = [Coordinator.email == email]
    records_to_update = {
        "is_verified": True,
        "last_logged_in": cutils.current_utc_time(),
    }
    result = crud.update_records(Coordinator, filter_criteria, records_to_update)
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")


@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_coordinators(organizer: Organizer):
    coordinators = crud.select_records(Coordinator, order_by=[Coordinator.id]).all()
    if not coordinators:
        raise ex.RecordNotFound(model="Coordinators")
    return {"coordinators": [obj_to_dict.coordinator_info_as_dict(coordinator) for coordinator in coordinators]}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def search_coordinator_by_name(organizer: Organizer, name: str = None):
    coordinators = app_utils.search_record_by_name(Coordinator, name)
    return {"coordinators": [obj_to_dict.coordinator_info_as_dict(coordinator) for coordinator in coordinators]}

@transactional
def get_coordinator_by_id(coordinator_id: int):
    coordinator = crud.select_records(Coordinator, filter_conditions=[Coordinator.id == coordinator_id]).first()
    if not coordinator:
        raise ex.RecordNotFound(model="Coordinator")
    return obj_to_dict.coordinator_info_as_dict(coordinator)

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_coordinator(user: Union[Coordinator,Organizer], coordinator_id: int):
    return get_coordinator_by_id(coordinator_id)

@transactional
@email_exists_or_raise(Coordinator)
def get_cost_centres(coordinator: Coordinator) -> dict:
    """
    Get cost centres details.
    Args:
        email (str): The email of the Coordinator.
    Returns:
        dict: A dictionary with the coordinator's details.
    """
    result = crud.select_records(
        CostCentre,
        select_cols=[CostCentre.code]
    ).all()
    flattened_data = list(chain.from_iterable(result))
    return {"cost_centres": flattened_data}

@transactional
def update_coordinator_info(decoded_token, update_coordinator_model, coordinator_id=None):
    if coordinator_id:
        required_role = Role.ORGANIZER.value
        email_role = Organizer
        coordinator_getter = get_coordinator_by_id
        param = coordinator_id
    else:
        required_role = Role.COORDINATOR.value
        email_role = Coordinator
        coordinator_getter = get_coordinator_by_email
        param = decoded_token.email

    if decoded_token.role.value != required_role:
        raise ex.InvalidRole

    if not app_utils.is_valid_email_for_role(decoded_token.email, email_role):
        raise ex.EmailNotFound
    
    coordinator = coordinator_getter(param)
    coordinator_id = coordinator.id if isinstance(coordinator, Coordinator) else coordinator.get("id")
    return update_coordinator(coordinator_id, update_coordinator_model)


@transactional
def update_coordinator(coordinator_id: int, update_coordinator: UpdateCoordinator) -> dict:
    filter_criteria = [Coordinator.id == coordinator_id]
    records_to_update = update_coordinator.model_dump(exclude_unset=True)
    result = crud.update_records(Coordinator, filter_criteria, records_to_update)
    if result.rowcount:
        return {"id": coordinator_id, "message": const.UPDATE_SUCCESS_MSG.format(model="Coordinator")}
    raise ex.DatabaseOperationFailed(action="update")


@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def delete_coordinator(organizer: Organizer, coordinator_id: int) -> dict:
    """
    Delete coordinator record in the database.
    Args:
        email (str): The email of the Coordinator.
    """
    coordinator = get_coordinator_by_id(coordinator_id)
    filter_criteria = [Coordinator.id == coordinator_id]
    result = crud.delete_record(Coordinator, filter_criteria)
    if result.rowcount:
        return {
            "id": coordinator_id,
            "message": const.DELETE_SUCCESS_MSG.format(
                model="Coordinator", email=coordinator["email"]
            )
        }
    raise ex.DatabaseOperationFailed(action="delete")


@transactional
@email_exists_or_raise(Coordinator)
def log_out(coordinator: Coordinator) -> dict:
    """
    Log out a coordinator by updating the 'is_verified' status in the database.
    Args:
        email (str): The email of the Coordinator.
    Returns:
        dict: A dictionary with a message indicating the result of the logout operation.
    """
    filter_criteria = get_filter_criteria(coordinator.email)
    records_to_update = {"is_verified": False}
    result = crud.update_records(Coordinator, filter_criteria, records_to_update)
    if result.rowcount:
        return const.LOGOUT_SUCCESS_MSG
    raise ex.DatabaseOperationFailed(action="update")


def get_distinct_guest_subquery(coordinator_id):
    return (
        crud.select_records(
            BookingLogs,
            select_cols=[BookingLogs.guest_id],
            filter_conditions=[BookingLogs.coordinator_id == coordinator_id],
            order_by=[BookingLogs.guest_id],
        )
        .distinct(BookingLogs.guest_id)
        .subquery()
    )


@transactional
@email_exists_or_raise(Coordinator)
def get_coordinator_guests(coordinator: Coordinator, coordinator_id: int) -> dict:
    distinct_guest_subquery = get_distinct_guest_subquery(coordinator_id)
    select_cols = [
        func.json_agg(
            func.jsonb_build_object(
                "id",
                Guest.id,
                "name",
                Guest.name,
                "email",
                Guest.email,
                "mobile",
                Guest.mobile,
            )
        )
    ]
    join_conditions = [
        (distinct_guest_subquery, Guest.id == distinct_guest_subquery.c.guest_id)
    ]
    result = crud.select_records(
        Guest, select_cols=select_cols, join_conditions=join_conditions
    ).scalar()
    return {"guests": result}

@transactional 
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value])
def get_coordinator_bookings(coordinator: Coordinator, **filters):
    latest_booking_event = aliased(app_utils.latest_booking_event_query())
    booking_cols = app_utils.get_booking_cols(latest_booking_event)

    join_conditions = [
        (CostCentre, CostCentre.id == Booking.cost_centre_id),
        (latest_booking_event, latest_booking_event.c.booking_id == Booking.id),
        (VendorCity, VendorCity.id == Booking.city_id, 'left')
    ]
    order_by = [desc(Booking.cdate)]
    
    select_cols = [func.jsonb_build_object(*booking_cols)]

    limit = filters.get("limit", 10)
    page = filters.get("page", 1)
    offset = (page - 1) * limit

    filter_conditions = app_utils.build_filter_conditions(filters, latest_booking_event)
    booking_event_type = filters.get("booking_event_type")

    if booking_event_type:
        cur_utc_time = cutils.current_utc_time()
        if booking_event_type == BookingEventType.UPCOMING.value:
            filter_conditions.append(Booking.booking_datetime >= cur_utc_time)

        elif booking_event_type == BookingEventType.ONGOING.value or booking_event_type == BookingEventType.COMPLETED.value:
            latest_trip_event = aliased(app_utils.get_lastest_trip_event())
            join_conditions.append((latest_trip_event, latest_trip_event.c.booking_id == Booking.id, 'left'))
            filter_conditions.append(Booking.booking_datetime < cur_utc_time)
            
            if booking_event_type == BookingEventType.ONGOING.value:
                filter_conditions.append(or_(latest_trip_event.c.event != "completed", latest_trip_event.c.event == None))
            elif booking_event_type == BookingEventType.COMPLETED.value:
                filter_conditions.append(latest_trip_event.c.event == "completed")
    
    filter_conditions.append(Booking.coordinator_id == coordinator.id)
    query = crud.select_records(
        primary_table=Booking,
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