from datetime import date
from typing import Annotated, Optional
from app_models.models import Coordinator
from fastapi import APIRouter, Depends, Query, status
from app_routes.coordinator.schema import (
    UpdateCoordinator,
    SignUpCoordinator,
    LoginCoordinator,
)
from app_routes.coordinator import utils
from app_schemas.schema import AccessToken, Role
from app_utils import utils as app_utils
from common_utils.utils import JWTBearer
from app_utils import exception as ex
from app_routes.hotel_bookings import utils as hotel_booking_utils

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_200_OK, response_model=dict)
def sign_in(request: SignUpCoordinator):
    return utils.sign_up(request.email)

@router.post("/login", status_code=status.HTTP_200_OK, response_model=dict)
def login(request: LoginCoordinator):
    return utils.login_with_otp(request.email, request.otp)

@router.post("/logout", status_code=status.HTTP_200_OK, response_model=dict)
def log_out(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return app_utils.log_out(decoded_access_token.email, decoded_access_token.role.value)

@router.post("/", status_code=status.HTTP_200_OK, response_model=dict)
def create_coordinator(request: SignUpCoordinator, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.create_coordinator(decoded_access_token.email, decoded_access_token.role.value, request.email)

@router.get("/", status_code=status.HTTP_200_OK, response_model=dict)
def get_coordinators(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_coordinators(decoded_access_token.email, decoded_access_token.role.value)

@router.get("/search", status_code=status.HTTP_200_OK, response_model=dict)
def search_coordinator_by_name(
    name: str = Query(None, title="Name", description="Name of the coordinator"),
    decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.search_coordinator_by_name(decoded_access_token.email, decoded_access_token.role.value, name)

@router.get("/bookings", status_code=status.HTTP_200_OK, response_model=dict)
def get_coordinator_booking_info(
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
    booking_event_type: str = Query(
        None, title="Booking Event Type", description="Filter by booking event ype"
    ),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):  
    return utils.get_coordinator_bookings(
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
        booking_event_type=booking_event_type
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
    if decoded_access_token.role.value  != Role.COORDINATOR.value:
        raise ex.InvalidRole
    
    coordinator_id = app_utils.get_model_record_id_by_email(Coordinator, decoded_access_token.email)
    if not coordinator_id:    
        raise ex.EmailNotFound

    return hotel_booking_utils.get_hotel_bookings(
        page=page,
        limit=limit,
        coordinator_id=coordinator_id,
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

@router.get("/{coordinator_id}", status_code=status.HTTP_200_OK, response_model=dict)
def get_coordinator_by_id(coordinator_id:int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_coordinator(decoded_access_token.email,decoded_access_token.role.value, coordinator_id)

@router.get(
    "/{coordinator_id}/guests", status_code=status.HTTP_200_OK, response_model=dict
)
def get_coordinator_guests(
    coordinator_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_coordinator_guests(decoded_access_token.email, coordinator_id)


@router.get("/cost-centres", status_code=status.HTTP_200_OK, response_model=dict)
def get_cost_centres(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_cost_centres(decoded_access_token.email)

@router.put("/{coordinator_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_coordinator_by_id(
    coordinator_id: int,
    update_coordinator: UpdateCoordinator,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.update_coordinator_info(decoded_access_token, update_coordinator, coordinator_id)
    
@router.put("/", status_code=status.HTTP_200_OK, response_model=dict)
def update_coordinator(
    update_coordinator: UpdateCoordinator,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.update_coordinator_info(decoded_access_token, update_coordinator)

@router.delete("/{coordinator_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_coordinator(coordinator_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.delete_coordinator(decoded_access_token.email, decoded_access_token.role.value, coordinator_id)

@router.get(
    "/bookings/{booking_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def get_coordinator_booking_info_by_booking_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    if not app_utils.is_valid_email_for_role(decoded_access_token.email, Coordinator):
        raise ex.EmailNotFound
    return app_utils.get_booking_info(
        decoded_access_token.role.value,
        booking_id=booking_id,
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
