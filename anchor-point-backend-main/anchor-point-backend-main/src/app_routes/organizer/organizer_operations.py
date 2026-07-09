from datetime import date
from typing import Annotated, Optional
from app_models.models import Organizer
from app_routes.booking.schema import BookingModel
from app_routes.driver.schema import DriverChargesBase
from fastapi import APIRouter, Query, Depends, status, BackgroundTasks
from app_routes.organizer.schema import (
    OrganizerModel,
    LoginOrganizer,
    UpdateBookingModel,
    UpdateOrganizer,
    UpdateBookingStatus,
    OptimalRoute,
)
from app_routes.organizer import utils
from app_routes.vendor import utils as vendor_utils
from app_routes.booking import utils as booking_utils
from app_routes.driver import utils as driver_utils
from app_schemas.schema import AccessToken, Role
from app_utils import utils as app_utils
from common_utils.utils import JWTBearer
from app_utils import exception as ex
from app_routes.booking import utils as booking_utils
from app_routes.hotel_bookings import utils as hotel_booking_utils

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_organizer(
    request: OrganizerModel, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_organizer(decoded_access_token.email, request)


@router.get("/", status_code=status.HTTP_200_OK, response_model=dict)
def get_organizers(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_organizers(decoded_access_token.email, decoded_access_token.role.value)

@router.post("/login", status_code=status.HTTP_200_OK, response_model=dict)
def login(organizer: LoginOrganizer):
    return utils.login(organizer.email, organizer.password)

@router.post("/logout", status_code=status.HTTP_200_OK, response_model=dict)
def logout(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return app_utils.log_out(decoded_access_token.email ,decoded_access_token.role.value)

@router.post("/bookings", status_code=status.HTTP_200_OK, response_model=dict)
def create_booking(
    background_tasks: BackgroundTasks, request: BookingModel, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_booking(decoded_access_token.email, request, background_tasks)

@router.put("/bookings/status", status_code=status.HTTP_200_OK, response_model=dict)
def update_booking_status(
    request: UpdateBookingStatus,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return booking_utils.update_booking_status(
        decoded_access_token.email, decoded_access_token.role.value, request
    )

@router.get("/task-summary", status_code=status.HTTP_200_OK, response_model=dict)
def task_summary(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.task_summary(decoded_access_token.email)


@router.post("/maps/optimal-route", status_code=status.HTTP_200_OK, response_model=dict)
def get_optimal_route(
    request: OptimalRoute, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_optimal_route(request)


@router.get("/bookings", status_code=status.HTTP_200_OK, response_model=dict)
def get_organizer_booking_info(
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page"),
    booking_type: str = Query(
        None, title="Booking Type", description="Type of booking ie. hotel or cab"
    ),
    cab_type: str = Query(
        None, title="Cab Type", description="Type of cab ie. SUV, Sedan etc"
    ),
    status: Annotated[list[str] | None, Query(title="Status", description="Status of booking")] = None,
    pickup_date: str = Query(
        None, title="Exact Date", description="Filter by exact date"
    ),
    pickup_start_date: str = Query(
        None, title="Start Date", description="Filter by start date"
    ),
    pickup_end_date: str = Query(
        None, title="End Date", description="Filter by end date"
    ),
    pickup_start_datetime: str = Query(None, title="Start DateTime", description="Filter by start datetime"),
    pickup_end_datetime: str = Query(None, title="End DateTime", description="Filter by end datetime"),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return app_utils.get_booking_info(
        email=decoded_access_token.email,
        role=decoded_access_token.role.value,
        page=page,
        limit=limit,
        booking_type=booking_type,
        cab_type=cab_type,
        pickup_date=pickup_date,
        pickup_start_date=pickup_start_date,
        pickup_end_date=pickup_end_date,
        pickup_start_datetime=pickup_start_datetime,
        pickup_end_datetime=pickup_end_datetime,
        status=status
    )


@router.get(
    "/bookings/{booking_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def get_organizer_booking_info_by_booking_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    if not app_utils.is_valid_email_for_role(decoded_access_token.email, Organizer):
        raise ex.EmailNotFound
    return app_utils.get_booking_info(
        decoded_access_token.role.value,
        booking_id=booking_id,
    )


@router.get(
    "/{organizer_id}/bookings", status_code=status.HTTP_200_OK, response_model=dict
)
def get_organizer_booking_info_by_organizer_id(
    organizer_id: int,
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page"),
    booking_type: Annotated[list[str] | None, Query(title="Booking Type", description="Type of booking ie. hotel or cab")] = None,
    cab_type: Annotated[list[str] | None, Query(title="Cab Type", description="Type of cab ie. SUV, Sedan etc")] = None,
    status: Annotated[list[str] | None, Query(title="Status", description="Status of booking")] = None,
    pickup_date: str = Query(None, title="Exact Date", description="Filter by exact date"),
    pickup_start_date: str = Query(None, title="Start Date", description="Filter by start date"),
    pickup_end_date: str = Query(None, title="End Date", description="Filter by end date"),
    pickup_start_datetime: str = Query(None, title="Start DateTime", description="Filter by start datetime"),
    pickup_end_datetime: str = Query(None, title="End DateTime", description="Filter by end datetime"),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.get_booking_info(
        email=decoded_access_token.email,
        role=decoded_access_token.role.value,
        page=page,
        limit=limit,
        booking_type=booking_type,
        cab_type=cab_type,
        pickup_date=pickup_date,
        pickup_start_date=pickup_start_date,
        pickup_end_date=pickup_end_date,
        pickup_start_datetime=pickup_start_datetime,
        pickup_end_datetime=pickup_end_datetime,
        status=status,
        organizer_id=organizer_id
    )


@router.get("/hotel_bookings", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_bookings(
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page"),
    bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
    room_type: Annotated[list[str] | None, Query(title="Room Type", description="Type of room")] = None,
    trip_type: Annotated[list[str] | None, Query(title="Trip Type", description="Type of trip ie. Official or Family")] = None,
    city: Annotated[list[str] | None, Query(title="Trip Type", description="Name of the city")] = None,
    check_in_date_gte: str = Query(None, title="Check In Start Date", description="Filter by check_in start date"),
    check_in_date_lte: str = Query(None, title="Check In End Date", description="Filter by check_in end date"),
    check_in_date: str = Query(None, title="Check In Date", description="Filter by check_in date"),
    check_out_date_gte: str = Query(None, title="Check Out Start Date", description="Filter by check_out start date"),
    check_out_date_lte: str = Query(None, title="Check Out End Date", description="Filter by check_out end date"),
    check_out_date: str = Query(None, title="Check Out Date", description="Filter by check_out date"),
    status: Annotated[list[str] | None, Query(title="Status", description="Status of booking")] = None,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    if decoded_access_token.role.value  != Role.ORGANIZER.value:
        raise ex.InvalidRole
    
    organizer_id = app_utils.get_model_record_id_by_email(Organizer, decoded_access_token.email)
    if not organizer_id:    
        raise ex.EmailNotFound

    return hotel_booking_utils.get_hotel_bookings(
        page=page,
        limit=limit,
        organizer_id=organizer_id,
        city=city,
        bid=bid,
        room_type=room_type,
        trip_type=trip_type,
        check_in_date_gte=check_in_date_gte,
        check_in_date_lte=check_in_date_lte,
        check_in_date=check_in_date,
        check_out_date_gte=check_out_date_gte,
        check_out_date_lte=check_out_date_lte,
        check_out_date=check_out_date,
        status=status
    )
@router.get(
    "/bookings/{booking_id}/guests", status_code=status.HTTP_200_OK, response_model=dict
)
def get_guests_by_booking_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return app_utils.get_guests_by_booking_id(
        decoded_access_token.email, decoded_access_token.role.value, booking_id
    )

@router.post(
    "/drivers/charges", status_code=status.HTTP_201_CREATED, response_model=dict
)
def create_driver_charge(
    request: DriverChargesBase, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return driver_utils.create_driver_charge(decoded_access_token.email, request)


@router.get("/drivers/charges", status_code=status.HTTP_200_OK, response_model=dict)
def get_driver_charges(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return driver_utils.get_driver_charges()


@router.get(
    "/drivers/charges/{driver_charge_id}",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def get_driver_charge_by_id(
    driver_charge_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return driver_utils.get_driver_charge_by_id(driver_charge_id)


@router.put(
    "/drivers/charges/{driver_charge_id}",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def update_driver_charge(
    driver_charge_id: int,
    request: DriverChargesBase,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return driver_utils.update_driver_charge(
        decoded_access_token.email, driver_charge_id, request
    )


@router.delete(
    "/drivers/charges/{driver_charge_id}",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def delete_driver_charge(
    driver_charge_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return driver_utils.delete_driver_charge(
        decoded_access_token.email, driver_charge_id
    )


@router.get("/plan-data", status_code=status.HTTP_200_OK, response_model=dict)
def get_plan_data(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_plan_data(decoded_access_token.email, booking_id)


@router.get("/{organizer_id}/invoice/{invoice_status}", status_code=status.HTTP_200_OK)
def get_invoices(
    organizer_id: int,
    invoice_status: str,
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page"),
    booking_type: str = Query(
        None, title="Booking Type", description="Type of booking ie. hotel or cab"
    ),
    cab_type: str = Query(
        None, title="Cab Type", description="Type of cab ie. SUV, Sedan etc"
    ),
    status: str = Query(None, title="Status", description="Status of booking"),
    pickup_date: str = Query(
        None, title="Exact Date", description="Filter by exact date"
    ),
    pickup_start_date: str = Query(
        None, title="Start Date", description="Filter by start date"
    ),
    pickup_end_date: str = Query(
        None, title="End Date", description="Filter by end date"
    ),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return app_utils.get_invoice_event_info(
        email=decoded_access_token.email,
        role=decoded_access_token.role.value,
        page=page,
        limit=limit,
        booking_type=booking_type,
        cab_type=cab_type,
        pickup_date=pickup_date,
        pickup_start_date=pickup_start_date,
        pickup_end_date=pickup_end_date,
        status=status,
        organizer_id=organizer_id,
        invoice_status=invoice_status,
    )

@router.put("/{organizer_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_organizer_by_id(
    organizer_id,
    update_request: UpdateOrganizer,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.update_organizer_by_id(
        decoded_access_token.email, organizer_id, update_request
    )

@router.delete("/{organizer_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_organizer_by_id(organizer_id, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.delete_organizer_by_id(decoded_access_token.email, organizer_id)


@router.get("/{organizer_id}", status_code=status.HTTP_200_OK, response_model=dict)
def get_organizer_by_id(organizer_id:int , decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_organizer_by_id(decoded_access_token.email, organizer_id)
