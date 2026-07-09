from typing import Annotated
from fastapi import APIRouter, Query, Depends, status, BackgroundTasks
from app_routes.booking.schema import (
    BookingInfoResponse,
    BookingModel,
    EditCabBookingModal,
    GuestModal,
)
from app_schemas.schema import AccessToken
from app_routes.booking import utils
from app_utils import utils as app_utils
from common_utils.utils import JWTBearer

router = APIRouter()

@router.post("/", status_code=status.HTTP_200_OK, response_model=dict)
def create_booking(
    background_tasks: BackgroundTasks, request: BookingModel, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_booking(decoded_access_token.email, request, background_tasks)

@router.get("/status", status_code=status.HTTP_200_OK, response_model=dict)
def get_booking_status(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_booking_status(decoded_access_token.email, decoded_access_token.role.value)

@router.get("/bid", status_code=status.HTTP_200_OK, response_model=dict)
def get_bid_from_bookings(    
    bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
    decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_bid_from_bookings(decoded_access_token.email, decoded_access_token.role.value, bid)

@router.put("/{booking_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_booking_info_by_booking_id(
    booking_id: str, update_request: EditCabBookingModal, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.update_booking_info_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id, update_request)

@router.get("/{booking_id}/trips", status_code=status.HTTP_200_OK, response_model=dict)
def get_plan_by_booking_id(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_trip_info(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.get("/guests", status_code=status.HTTP_200_OK, response_model=dict)
def get_guest_info(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_guest_info(decoded_access_token.email)


@router.get("/guests/{booking_id}", status_code=status.HTTP_200_OK, response_model=dict)
def get_guest_info(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_guest_info(decoded_access_token.email, booking_id)

@router.get("/{booking_id}/plans", status_code=status.HTTP_200_OK, response_model=dict)
def get_plan_by_booking_id(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_plan_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.get("/summary", status_code=status.HTTP_200_OK, response_model=dict)
def bookings_summary(
    trip_from_timestamp: str = Query(
        None,
        title="Trip Start time",
        description="Start time to filter bookings between time range",
    ),
    trip_to_timestamp: str = Query(
        None,
        title="Trip End time",
        description="End time to filter bookings between time range",
    ),
    role: str = Query(None, title="User role"),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return app_utils.get_bookings_summary(
        decoded_access_token.email,
        decoded_access_token.role.value,
        trip_from_timestamp,
        trip_to_timestamp,
    )

@router.get("/insights", status_code=status.HTTP_200_OK, response_model=dict)
def fetch_booking_insights_endpoint(
    trip_from_timestamp: str = Query(
        None,
        title="Trip Start time",
        description="Start time to filter bookings between time range",
    ),
    trip_to_timestamp: str = Query(
        None,
        title="Trip End time",
        description="End time to filter bookings between time range",
    ),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return app_utils.fetch_booking_insights(
        decoded_access_token.email,
        decoded_access_token.role.value,
        trip_from_timestamp,
        trip_to_timestamp
    )

@router.get("/reports", status_code=status.HTTP_200_OK, response_model=dict)
def get_job_reports( 
   page: int = Query(1, title="Page Number", description="Page number for pagination"),
   limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
   booking_type: Annotated[list[str] | None, Query(title="Booking Type", description="Type of booking ie. hotel or cab")] = None,
   cost_centre: Annotated[list[str] | None, Query(title="Cost Centres", description="Cost Centre Name")] = None,
   bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
   trip_status: Annotated[list[str] | None, Query(title="Trip Status", description="Staus of trip")] = None,
   today: str = Query(None, title="Today Date", description="Filter by today"),
   this_week: str = Query(None, title="This Week", description="Filter by this week"),
   pickup_date: str = Query(None, title="Exact Date", description="Filter by exact date"),
   pickup_start_date: str = Query( None, title="Start Date", description="Filter by Start date"),
   pickup_end_date: str = Query( None, title="End Date", description="Filter by End date"),
   sort: Annotated[list[str] | None, Query(title="Sort", description="Sort by")] = None,
   decoded_access_token: AccessToken = Depends(JWTBearer()),
):
   return utils.get_job_reports(        
      email=decoded_access_token.email,
      role=decoded_access_token.role.value,
      page=page,
      limit=limit,
      sort=sort,
      bid=bid,
      cost_centre=cost_centre,
      trip_status=trip_status,
      today=today,
      this_week=this_week,
      booking_type=booking_type,
      pickup_date=pickup_date,
      pickup_start_date=pickup_start_date,
      pickup_end_date=pickup_end_date
   )

@router.get("/reports/download", status_code=status.HTTP_200_OK, response_model=dict)
def get_job_reports_as_excel( 
   page: int = Query(1, title="Page Number", description="Page number for pagination"),
   limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
   booking_type: Annotated[list[str] | None, Query(title="Booking Type", description="Type of booking ie. hotel or cab")] = None,
   cost_centre: Annotated[list[str] | None, Query(title="Cost Centres", description="Cost Centre Name")] = None,
   bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
   trip_status: Annotated[list[str] | None, Query(title="Trip Status", description="Staus of trip")] = None,
   today: str = Query(None, title="Today Date", description="Filter by today"),
   this_week: str = Query(None, title="This Week", description="Filter by this week"),
   pickup_date: str = Query(None, title="Exact Date", description="Filter by exact date"),
   pickup_start_date: str = Query( None, title="Start Date", description="Filter by Start date"),
   pickup_end_date: str = Query( None, title="End Date", description="Filter by End date"),
   sort: Annotated[list[str] | None, Query(title="Sort", description="Sort by")] = None,
   decoded_access_token: AccessToken = Depends(JWTBearer()),
):
   return utils.get_job_reports(        
      email=decoded_access_token.email,
      role=decoded_access_token.role.value,
      page=page,
      limit=limit,
      sort=sort,
      bid=bid,
      cost_centre=cost_centre,
      trip_status=trip_status,
      today=today,
      this_week=this_week,
      booking_type=booking_type,
      pickup_date=pickup_date,
      pickup_start_date=pickup_start_date,
      pickup_end_date=pickup_end_date,
      download=True
   )

@router.get(
    "/{booking_id}/history", status_code=status.HTTP_200_OK, response_model=dict
)
def get_booking_history_by_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_booking_history_info(
        decoded_access_token.email, decoded_access_token.role.value, booking_id
    )

@router.get(
    "/{booking_id}/activity_log", status_code=status.HTTP_200_OK, response_model=dict
)
def get_booking_activity_log_by_booking_id(
    booking_id: str, booking_type: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_booking_activity_log_info(
        decoded_access_token.email, decoded_access_token.role.value, booking_id, booking_type
    )

@router.get(
    "/{booking_id}/optimal-route", status_code=status.HTTP_200_OK, response_model=dict
)
def get_optimal_route_for_booking_id(
    booking_id: str, location:str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.fetch_optimal_route(
         booking_id, location, decoded_access_token.role.value,
    )

@router.get("/{booking_id}/vendors")
def vednor_assign_list(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_vendor_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id)