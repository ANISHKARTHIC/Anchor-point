from datetime import date
from app_models.models import Vendor
from fastapi import APIRouter, Query, Depends, status, Form, UploadFile, File, BackgroundTasks
from typing import Annotated, List, Optional
from app_routes.organizer.schema import UpdateBookingStatus
from app_routes.vendor.schema import LoginVendor, DriverInfo, TripInfo, VendorBase, VendorGarageLocationBase, VendorUpdate
from app_routes.booking import utils as booking_utils
from app_routes.driver import utils as driver_utils
from app_routes.vendor import utils
from common_utils.utils import JWTBearer
from app_schemas.schema import AccessToken, Role
from app_utils import utils as app_utils
from app_utils import exception as ex
from app_routes.hotel_bookings import utils as hotel_booking_utils

router = APIRouter()

@router.post("/garage_locations", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_vendor_garage_location(
    request: VendorGarageLocationBase, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_vendor_garage_location(decoded_access_token.email, decoded_access_token.role.value, request)

@router.get("/garage_locations", status_code=status.HTTP_200_OK, response_model=dict)
def get_garage_locations(
    vendor_id: int = Query(None, title="Vendor ID", description=""),
    city_id: int = Query(None, title="City ID", description=""),
    decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_garage_locations(decoded_access_token.email, decoded_access_token.role.value, vendor_id, city_id)

@router.get("/garage_locations/{garage_location_id}", status_code=status.HTTP_200_OK, response_model=dict)
def get_garage_location_by_id(
    garage_location_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_garage_location_by_id(decoded_access_token.email, decoded_access_token.role.value, garage_location_id)

@router.put("/garage_locations/{garage_location_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_garage_location_by_id(
    garage_location_id: int, update_request: VendorGarageLocationBase, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.update_garage_location_by_id(decoded_access_token.email, decoded_access_token.role.value, garage_location_id, update_request)

@router.delete("/garage_locations/{garage_location_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_garage_location_by_id(
    garage_location_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.delete_garage_location_by_id(decoded_access_token.email, decoded_access_token.role.value, garage_location_id)

@router.post("/cities", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_vendor_city(
    city: str,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.create_vendor_city(decoded_access_token.email, city)

@router.get("/cities", status_code=status.HTTP_200_OK, response_model=dict)
def get_vendor_cities(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_vendor_cities(decoded_access_token.email, decoded_access_token.role.value)

@router.get(
    "/cities/{vendor_city_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def get_vendor_city_by_id(
    vendor_city_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_vendor_city_by_id(decoded_access_token.email, vendor_city_id)


@router.put(
    "/cities/{vendor_city_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def update_vendor_city(
    vendor_city_id: int,
    city: str,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.update_vendor_city(
        decoded_access_token.email, vendor_city_id, city
    )

@router.delete(
    "/cities/{vendor_city_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def delete_vendor_city(
    vendor_city_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.delete_vendor_city(decoded_access_token.email, vendor_city_id)

@router.get("/", status_code=status.HTTP_200_OK, response_model=dict)
def get_vendors(
    city: str = Query(
        None, title="City", description="Name of the city"
    ),
    vendor_type: str = Query(
        None, title="Vendor Type", description="Type of vendor ie. hotel or cab"
    ),    
    decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_vendors(decoded_access_token.email, decoded_access_token.role.value, city, vendor_type)

@router.get("/hotel_bookings", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_bookings(
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page"),
    bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
    room_type: Annotated[list[str] | None, Query(title="Room Type", description="Type of room")] = None,
    trip_type: Annotated[list[str] | None, Query(title="Trip Type", description="Type of trip ie. Official or Family")] = None,
    city: Annotated[list[str] | None, Query(title="Trip Type", description="Name of the city")] = None,
    organizer: Annotated[list[str] | None, Query(title="Organizer Name", description="Name of the organizer")] = None,
    check_in_date_gte: str = Query(None, title="Check In Start Date", description="Filter by check_in start date"),
    check_in_date_lte: str = Query(None, title="Check In End Date", description="Filter by check_in end date"),
    check_in_date: str = Query(None, title="Check In Date", description="Filter by check_in date"),
    check_out_date_gte: str = Query(None, title="Check Out Start Date", description="Filter by check_out start date"),
    check_out_date_lte: str = Query(None, title="Check Out End Date", description="Filter by check_out end date"),
    check_out_date: str = Query(None, title="Check Out Date", description="Filter by check_out date"),
    vendor_booking_status: Annotated[list[str] | None, Query(title="Vendor Booking Status", description="Status of Vendor booking")] = None,
    status: Annotated[list[str] | None, Query(title="Status", description="Status of booking")] = None,
    today: str = Query(None, title="Today Date", description="Filter by today"),
    this_week: str = Query(None, title="This Week", description="Filter by this week"),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    if decoded_access_token.role.value != Role.VENDOR.value:
        raise ex.InvalidRole

    vendor_id = app_utils.get_model_record_id_by_email(Vendor, decoded_access_token.email)
    if not vendor_id:    
        raise ex.EmailNotFound

    return hotel_booking_utils.get_vendor_hotel_bookings(
        page=page,
        limit=limit,
        bid=bid,
        city=city,
        room_type=room_type,
        trip_type=trip_type,
        organizer=organizer,
        check_in_date_gte=check_in_date_gte,
        check_in_date_lte=check_in_date_lte,
        check_in_date=check_in_date,
        check_out_date_gte=check_out_date_gte,
        check_out_date_lte=check_out_date_lte,
        check_out_date=check_out_date,
        status=status,
        vendor_booking_status=vendor_booking_status,
        today=today,
        this_week=this_week,
        vendor_id=vendor_id
    )

@router.get("/hotel_bookings/{booking_id}/request", status_code=status.HTTP_200_OK, response_model=dict)
def get_vendor_hotel_booking_request(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_vendor_hotel_booking_request(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_vendor(
    request: VendorBase, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_vendor(decoded_access_token.email, request)

@router.put(
    "/{vendor_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def update_vendor_by_id(
    vendor_id: int, update_request: VendorUpdate, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.update_vendor_by_id(decoded_access_token.email, vendor_id, update_request)

@router.get("/{vendor_id}", status_code=status.HTTP_200_OK, response_model=dict)
def get_vendor_by_id(vendor_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_vendor_by_id(decoded_access_token.email, decoded_access_token.role.value, vendor_id)

@router.delete(
    "/{vendor_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def delete_vendor_by_id(
    vendor_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.delete_vendor_by_id(decoded_access_token.email, vendor_id)

@router.get("/bookings/{booking_id}/invoices", status_code=status.HTTP_200_OK)
def get_vendor_invoice_by_booking_id_endpoint(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.get_vendor_invoice_data_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.get("/bookings/{booking_id}/plan_summary", status_code=status.HTTP_200_OK)
def get_vendor_plan_summary_endpoint(
   booking_id: str,
   plan_id: Annotated[int | None, Query(title="plan id", description="The ID of the plan")] = None,
   decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.get_vendor_invoice_summary(
        decoded_access_token.email,
        decoded_access_token.role.value,
        booking_id,
        plan_id,
    )

@router.post("/login", status_code=status.HTTP_200_OK, response_model=dict)
def login(request: LoginVendor):
    return utils.login(request.email, request.password)

@router.post("/logout", status_code=status.HTTP_200_OK, response_model=dict)
def log_out(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return app_utils.log_out(decoded_access_token.email, decoded_access_token.role.value)

@router.put("/bookings/status", status_code=status.HTTP_200_OK, response_model=dict)
def update_booking_status(
    request: UpdateBookingStatus,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return booking_utils.update_booking_status(
        decoded_access_token.email, decoded_access_token.role.value, request
    )

@router.get("/bookings", status_code=status.HTTP_200_OK, response_model=dict)
def get_vendor_booking_info(
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
    if not app_utils.is_valid_email_for_role(decoded_access_token.email, Vendor):
        raise ex.EmailNotFound
    return app_utils.get_booking_info(
        role=decoded_access_token.role.value,
        page=page,
        limit=limit,
        booking_type=booking_type,
        cab_type=cab_type,
        pickup_date=pickup_date,
        pickup_start_date=pickup_start_date,
        pickup_end_date=pickup_end_date,
        status=status,
    )

@router.get(
    "/bookings/{booking_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def get_vendor_booking_info_by_booking_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    if not app_utils.is_valid_email_for_role(decoded_access_token.email, Vendor):
        raise ex.EmailNotFound
    return app_utils.get_booking_info(
        decoded_access_token.role.value,
        booking_id=booking_id,
    )


@router.get(
    "/{vendor_id}/bookings", status_code=status.HTTP_200_OK, response_model=dict
)
def get_vendor_bookings(
    vendor_id: int,
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
    cab_type: Annotated[list[str] | None, Query(title="Cab Type", description="Type of cab ie. SUV, Sedan etc")] = None,
    status: Annotated[list[str] | None, Query(title="Status", description="Status of booking")] = None,
    organizer: Annotated[list[str] | None, Query(title="Organizer Name", description="Name of the organizer")] = None,
    bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
    today: str = Query(None, title="Today Date", description="Filter by today"),
    this_week: str = Query(None, title="This Week", description="Filter by this week"),
    pickup_date: str = Query(None, title="Exact Date", description="Filter by exact date"),
    pickup_start_date: str = Query( None, title="Start Date", description="Filter by start date"),
    pickup_start_datetime: str = Query(None, title="Start DateTime", description="Filter by start datetime"),
    pickup_end_datetime: str = Query(None, title="End DateTime", description="Filter by end datetime"),
    pickup_end_date: str = Query(None, title="End Date", description="Filter by end date"),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.get_booking_info(
        email=decoded_access_token.email,
        role=decoded_access_token.role.value,
        page=page,
        limit=limit,
        bid=bid,
        today=today,
        this_week=this_week,
        cab_type=cab_type,
        pickup_date=pickup_date,
        pickup_start_date=pickup_start_date,
        pickup_end_date=pickup_end_date,
        pickup_start_datetime=pickup_start_datetime,
        pickup_end_datetime=pickup_end_datetime,
        status=status,
        organizer=organizer,
        vendor_id=vendor_id
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
    "/bookings/{booking_id}/drivers",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def create_driver_info(
    background_tasks: BackgroundTasks,
    booking_id: str,
    driver_info_request: DriverInfo,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return driver_utils.create_driver_info(
        decoded_access_token.email, booking_id, driver_info_request, background_tasks
    )


@router.get(
    "/bookings/{booking_id}/drivers",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def get_driver_info_by_booking_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_driver_info_by_booking_id(decoded_access_token.email, booking_id)


@router.post(
    "/invoices", 
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def add_invoice(
   booking_id: str = Form(...),
   driver_charge: float = Form(...),
   base_fare: float = Form(...),
   invoice_amount: float = Form(...),
   plan_id: int = Form(...),
   description: str = Form(None),
   discount_percent: float = Form(None),
   miscellaneous: Optional[float] = Form(None),
   parking_and_toll: Optional[float] = Form(None),
   cancellation_amount: Optional[float] = Form(0.0),
   extra_kms_amount: Optional[float] = Form(0.0),
   extra_hrs_amount: Optional[float] = Form(0.0),
   extra_kms_qty: Optional[float] = Form(0.0),
   extra_hrs_qty: Optional[float] = Form(0.0),
   trip_documents: List[UploadFile] = File(None),
   decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.add_invoice_info(
      decoded_access_token.email, decoded_access_token.role.value, 
      booking_id, driver_charge, base_fare,
      invoice_amount, cancellation_amount, description, discount_percent, miscellaneous, parking_and_toll, 
      extra_kms_amount, extra_hrs_amount, plan_id, extra_kms_qty, extra_hrs_qty, trip_documents
)
    
@router.post(
    "/trips",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def create_trip_info(trip_info_request: TripInfo, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.create_trip_info(decoded_access_token.email, decoded_access_token.role.value, trip_info_request)
@router.put(
    "/trips/{trip_id}",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def update_trip_info(trip_id: int, update_trip_info_request: TripInfo, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.update_trip_info(decoded_access_token.email, decoded_access_token.role.value, trip_id, update_trip_info_request)