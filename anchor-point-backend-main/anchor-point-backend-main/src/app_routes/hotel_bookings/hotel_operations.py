from datetime import date
from typing import Annotated, List, Optional
from app_routes.booking import utils as booking_utils
from fastapi import APIRouter, Query, Depends, status, BackgroundTasks, Form, UploadFile, File
from app_routes.hotel_bookings.schema import HotelBookingCreate, HotelBookingEditRequestModel, HotelBookingUpdate, HotelBookingEditRequestUpdate, HotelInvoiceModel, HotelMealPlanModal, HotelPricingModal, HotelRoomCategoryModal
from app_schemas.schema import AccessToken
from app_routes.hotel_bookings import utils
from common_utils.utils import JWTBearer
from app_utils import exception as ex
from app_utils import utils as app_utils
router = APIRouter()

@router.post("/", status_code=status.HTTP_200_OK, response_model=dict)
def create_booking(
    background_tasks: BackgroundTasks, booking_request: HotelBookingCreate, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_hotel_booking(decoded_access_token.email, decoded_access_token.role.value, booking_request, background_tasks)

@router.get("/bid", status_code=status.HTTP_200_OK, response_model=dict)
def get_bid_from_hotel_bookings(    
    bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
    decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_bid_from_hotel_bookings(decoded_access_token.email, decoded_access_token.role.value, bid)

@router.post("/confirm", status_code=status.HTTP_200_OK, response_model=dict)
def confirm_hotel_booking(
    background_tasks: BackgroundTasks,
    booking_id: str = Form(...),
    status: str = Form(...),
    metadata: str = Form(...),
    confirmation_attachment: Optional[UploadFile] = Form(None),
    decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.confirm_hotel_booking(decoded_access_token.email, decoded_access_token.role.value, booking_id, status, metadata, background_tasks, confirmation_attachment)

@router.put("/status", status_code=status.HTTP_200_OK, response_model=dict)
def update_hotel_booking_by_booking_id(
    update_request: HotelBookingUpdate, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.update_hotel_booking_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, update_request)

@router.get("/status", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_booking_status(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return booking_utils.get_hotel_booking_status(decoded_access_token.email, decoded_access_token.role.value)

@router.get("/summary", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_booking_summary(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_hotel_booking_summary(decoded_access_token.email, decoded_access_token.role.value)

@router.get("/", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_bookings(
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page"),
    bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
    booking_ids: Annotated[str | None, Query(title="Booking ID's", description="Hotel booking ids")] = None,
    room_type: Annotated[list[str] | None, Query(title="Room Type", description="Type of room")] = None,
    trip_type: Annotated[list[str] | None, Query(title="Trip Type", description="Type of trip ie. Official or Family")] = None,
    city: Annotated[list[str] | None, Query(title="Trip Type", description="Name of the city")] = None,
    status: Annotated[list[str] | None, Query(title="Status", description="Status of booking")] = None,
    organizer: Annotated[list[str] | None, Query(title="Organizer Name", description="Name of the organizer")] = None,
    vendor: Annotated[list[str] | None, Query(title="Vendor Name", description="Name of the vendor")] = None,
    check_in_date_gte: str = Query(None, title="Check In Start Date", description="Filter by check_in start date"),
    check_in_date_lte: str = Query(None, title="Check In End Date", description="Filter by check_in end date"),
    check_in_date: str = Query(None, title="Check In Date", description="Filter by check_in date"),
    check_out_date_gte: str = Query(None, title="Check Out Start Date", description="Filter by check_out start date"),
    check_out_date_lte: str = Query(None, title="Check Out End Date", description="Filter by check_out end date"),
    check_out_date: str = Query(None, title="Check Out Date", description="Filter by check_out date"),
    today: str = Query(None, title="Today Date", description="Filter by today"),
    this_week: str = Query(None, title="This Week", description="Filter by this week"),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    email = decoded_access_token.email    
    model = app_utils.get_model_by_role(decoded_access_token.role.value)
    if not model:
        raise ex.InvalidRole
    
    user_id = app_utils.get_model_record_id_by_email(model, email)
    if not user_id:    
        raise ex.EmailNotFound
    
    return utils.get_hotel_bookings(
        page=page,
        limit=limit,
        city=city,
        room_type=room_type,
        trip_type=trip_type,
        organizer=organizer,
        vendor=vendor,
        booking_ids=booking_ids,
        check_in_date_gte=check_in_date_gte,
        check_in_date_lte=check_in_date_lte,
        check_in_date=check_in_date,
        check_out_date_gte=check_out_date_gte,
        check_out_date_lte=check_out_date_lte,
        check_out_date=check_out_date,
        status=status,
        bid=bid,
        today=today,
        this_week=this_week
    )

@router.put("/{booking_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_hotel_booking_info_by_booking_id(
    booking_id: str, update_request: HotelBookingCreate, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.update_booking_data_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id, update_request)

@router.get("/{booking_id}/room_details", status_code=status.HTTP_200_OK, response_model=dict)
def get_room_details_by_booking_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_room_details_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.get("/{booking_id}/guests", status_code=status.HTTP_200_OK, response_model=dict)
def get_guest_details_by_booking_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_guest_details_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.get("/{booking_id}/history", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_booking_history_by_booking_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_hotel_booking_history_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.post("/{booking_id}/edit", status_code=status.HTTP_200_OK, response_model=dict)
def create_booking_edit_request(
    booking_id: str, booking_edit_request: HotelBookingEditRequestModel, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_booking_edit_request(decoded_access_token.email, decoded_access_token.role.value, booking_id, booking_edit_request)

@router.put("/{booking_id}/edit", status_code=status.HTTP_200_OK, response_model=dict)
def update_booking_edit_request(
    background_tasks: BackgroundTasks, booking_id: str, booking_edit_request: HotelBookingEditRequestUpdate, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.update_booking_edit_request(decoded_access_token.email, decoded_access_token.role.value, booking_id, booking_edit_request,  background_tasks)

@router.get("/{booking_id}/edit", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_booking_edit_request(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_hotel_booking_edit_request(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.get("/{booking_id}/edit/history", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_booking_edit_request_history_by_booking_id(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_hotel_booking_edit_request_history_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.get("/{booking_id}/edit/{edit_request_id}/history", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_booking_edit_request(
    booking_id: str, edit_request_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_hotel_booking_edit_request_history(decoded_access_token.email, decoded_access_token.role.value, booking_id, edit_request_id)

@router.get("/edit", status_code=status.HTTP_200_OK, response_model=dict)
def get_edit_booking_requests(
    decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_edit_booking_requests(decoded_access_token.email, decoded_access_token.role.value)

@router.post("/{booking_id}/generate-invoice", status_code=status.HTTP_200_OK, response_model=dict)
def generate_invoice(
    background_tasks: BackgroundTasks, booking_id: str, invoice_request: HotelInvoiceModel, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.generate_invoice(decoded_access_token.email, decoded_access_token.role.value, booking_id, invoice_request, background_tasks)

@router.get("/{booking_id}/invoices", status_code=status.HTTP_200_OK, response_model=dict)
def fetch_hotel_invoice(
    booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.fetch_hotel_invoice(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.post("/vendor_invoice", status_code=status.HTTP_200_OK, response_model=dict)
def create_vendor_invoice(
    booking_id: str = Form(...),
    description: str = Form(""),
    delete_files: str = Form(None),
    documents: List[UploadFile] = File(None),
    decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_vendor_invoice(decoded_access_token.email, decoded_access_token.role.value, booking_id, documents, description, delete_files)

@router.get("/{booking_id}/vendor_invoice", status_code=status.HTTP_200_OK, response_model=dict)
def get_vendor_invoice_by_booking_id(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_vendor_invoice_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.post("/room_categories", status_code=status.HTTP_200_OK, response_model=dict)
def create_hotel_room_category(room_category: HotelRoomCategoryModal, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.create_hotel_room_category(decoded_access_token.email, decoded_access_token.role.value, room_category)

@router.get("/room_categories", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_room_categories(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_hotel_room_categories(decoded_access_token.email, decoded_access_token.role.value)

@router.get("/room_categories/{room_category_id}", status_code=status.HTTP_200_OK, response_model=dict)
def fetch_hotel_room_category_by_id(room_category_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.fetch_hotel_room_category_by_id(decoded_access_token.email, decoded_access_token.role.value, room_category_id)

@router.put("/room_categories/{room_category_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_hotel_room_category_by_id(room_category_id: int, room_category: HotelRoomCategoryModal, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.update_hotel_room_category_by_id(decoded_access_token.email, decoded_access_token.role.value, room_category_id, room_category)

@router.delete("/room_categories/{room_category_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_hotel_room_category_by_id(room_category_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.delete_hotel_room_category_by_id(decoded_access_token.email, decoded_access_token.role.value, room_category_id)

@router.post("/meal_plans", status_code=status.HTTP_200_OK, response_model=dict)
def create_hotel_meal_plan(meal_plan: HotelMealPlanModal, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.create_hotel_meal_plan(decoded_access_token.email, decoded_access_token.role.value, meal_plan)

@router.get("/meal_plans", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_meal_plans(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_hotel_meal_plans(decoded_access_token.email, decoded_access_token.role.value)

@router.get("/meal_plans/{meal_plan_id}", status_code=status.HTTP_200_OK, response_model=dict)
def fetch_hotel_meal_plan_by_id(meal_plan_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.fetch_hotel_meal_plan_by_id(decoded_access_token.email, decoded_access_token.role.value, meal_plan_id)

@router.put("/meal_plans/{meal_plan_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_hotel_meal_plan_by_id(meal_plan_id: int, meal_plan: HotelMealPlanModal, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.update_hotel_meal_plan_by_id(decoded_access_token.email, decoded_access_token.role.value, meal_plan_id, meal_plan)

@router.delete("/meal_plans/{meal_plan_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_hotel_meal_plan_by_id(meal_plan_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.delete_hotel_meal_plan_by_id(decoded_access_token.email, decoded_access_token.role.value, meal_plan_id)

@router.post("/pricing", status_code=status.HTTP_200_OK, response_model=dict)
def create_hotel_pricing(pricing: HotelPricingModal, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.create_hotel_pricing(decoded_access_token.email, decoded_access_token.role.value, pricing)

@router.get("/vendors/{vendor_id}/pricing", status_code=status.HTTP_200_OK, response_model=dict)
def get_vendor_hotel_pricing(vendor_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_vendor_hotel_pricing(decoded_access_token.email, decoded_access_token.role.value, vendor_id)

@router.get("/pricing", status_code=status.HTTP_200_OK, response_model=dict)
def get_hotel_pricing(vendor_id: int = None, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_hotel_pricing(decoded_access_token.email, decoded_access_token.role.value, vendor_id)

@router.get("/pricing/{pricing_id}", status_code=status.HTTP_200_OK, response_model=dict)
def fetch_hotel_pricing_by_id(pricing_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.fetch_hotel_pricing_by_id(decoded_access_token.email, decoded_access_token.role.value, pricing_id)

@router.put("/pricing/{pricing_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_hotel_pricing_by_id(pricing_id: int, pricing: HotelPricingModal, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.update_hotel_pricing_by_id(decoded_access_token.email, decoded_access_token.role.value, pricing_id, pricing)

@router.delete("/pricing/{pricing_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_hotel_pricing_by_id(pricing_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.delete_hotel_pricing_by_id(decoded_access_token.email, decoded_access_token.role.value, pricing_id)

@router.get("/reports", status_code=status.HTTP_200_OK, response_model=dict)
def get_job_reports( 
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
    cost_centre: Annotated[list[str] | None, Query(title="Cost Centres", description="Cost Centre Name")] = None, 
    status: Annotated[list[str] | None, Query(title="Status", description="Status of booking")] = None,
    trip_type: Annotated[list[str] | None, Query(title="Trip Type", description="Filter by trip type")] = None,
    organizer: Annotated[list[str] | None, Query(title="Organizer Name", description="Filter by organizer name")] = None,
    coordinator: Annotated[list[str] | None, Query(title="Coordinator Name", description="Filter by coordinator name")] = None,
    guest: str = Query(None, title="Guest Name", description="Filter by guest name"),
    bid: Annotated[str | None, Query(title="bid", description="Filter by booking sequence id")] = None,
    check_in_date_gte: str = Query(None, title="Check In Start Date", description="Filter by check_in start date"),
    check_in_date_lte: str = Query(None, title="Check In End Date", description="Filter by check_in end date"),
    check_in_date: str = Query(None, title="Check In Date", description="Filter by check_in date"),
    check_out_date_gte: str = Query(None, title="Check Out Start Date", description="Filter by check_out start date"),
    check_out_date_lte: str = Query(None, title="Check Out End Date", description="Filter by check_out end date"),
    check_out_date: str = Query(None, title="Check Out Date", description="Filter by check_out date"),
    today: str = Query(None, title="Today Date", description="Filter by today"),
    this_week: str = Query(None, title="This Week", description="Filter by this week"),
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
        trip_type=trip_type,
        coordinator=coordinator,
        guest=guest,
        organizer=organizer,
        check_in_date_gte=check_in_date_gte,
        check_in_date_lte=check_in_date_lte,
        check_in_date=check_in_date,
        check_out_date_gte=check_out_date_gte,
        check_out_date_lte=check_out_date_lte,
        check_out_date=check_out_date,
        status=status,
        today=today,
        this_week=this_week
    )

@router.get("/reports/download", status_code=status.HTTP_200_OK, response_model=dict)
def get_job_reports_as_excel( 
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
    cost_centre: Annotated[list[str] | None, Query(title="Cost Centres", description="Cost Centre Name")] = None, 
    status: Annotated[list[str] | None, Query(title="Status", description="Status of booking")] = None,
    trip_type: Annotated[list[str] | None, Query(title="Trip Type", description="Filter by trip type")] = None,
    organizer: Annotated[list[str] | None, Query(title="Organizer Name", description="Filter by organizer name")] = None,
    coordinator: Annotated[list[str] | None, Query(title="Coordinator Name", description="Filter by coordinator name")] = None,
    guest: str = Query(None, title="Guest Name", description="Filter by guest name"),
    bid: Annotated[str | None, Query(title="bid", description="Filter by booking sequence id")] = None,
    check_in_date_gte: str = Query(None, title="Check In Start Date", description="Filter by check_in start date"),
    check_in_date_lte: str = Query(None, title="Check In End Date", description="Filter by check_in end date"),
    check_in_date: str = Query(None, title="Check In Date", description="Filter by check_in date"),
    check_out_date_gte: str = Query(None, title="Check Out Start Date", description="Filter by check_out start date"),
    check_out_date_lte: str = Query(None, title="Check Out End Date", description="Filter by check_out end date"),
    check_out_date: str = Query(None, title="Check Out Date", description="Filter by check_out date"),
    today: str = Query(None, title="Today Date", description="Filter by today"),
    this_week: str = Query(None, title="This Week", description="Filter by this week"),
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
        trip_type=trip_type,
        coordinator=coordinator,
        guest=guest,
        organizer=organizer,
        check_in_date_gte=check_in_date_gte,
        check_in_date_lte=check_in_date_lte,
        check_in_date=check_in_date,
        check_out_date_gte=check_out_date_gte,
        check_out_date_lte=check_out_date_lte,
        check_out_date=check_out_date,
        status=status,
        today=today,
        this_week=this_week,
        download=True
    )

@router.get("/invoices/reports", status_code=status.HTTP_200_OK, response_model=dict)
def get_invoice_reports( 
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
    city: Annotated[list[str] | None, Query(title="Trip Type", description="Name of the city")] = None,
    cost_centre: Annotated[list[str] | None, Query(title="Cost Centres", description="Cost Centre Name")] = None, 
    trip_type: Annotated[list[str] | None, Query(title="Trip Type", description="Filter by trip type")] = None,
    organizer: Annotated[list[str] | None, Query(title="Organizer Name", description="Filter by organizer name")] = None,
    coordinator: Annotated[list[str] | None, Query(title="Coordinator Name", description="Filter by coordinator name")] = None,
    bid: Annotated[str | None, Query(title="bid", description="Filter by booking sequence id")] = None,
    check_in_date_gte: str = Query(None, title="Check In Start Date", description="Filter by check_in start date"),
    check_in_date_lte: str = Query(None, title="Check In End Date", description="Filter by check_in end date"),
    check_in_date: str = Query(None, title="Check In Date", description="Filter by check_in date"),
    check_out_date_gte: str = Query(None, title="Check Out Start Date", description="Filter by check_out start date"),
    check_out_date_lte: str = Query(None, title="Check Out End Date", description="Filter by check_out end date"),
    check_out_date: str = Query(None, title="Check Out Date", description="Filter by check_out date"),
    today: str = Query(None, title="Today Date", description="Filter by today"),
    this_week: str = Query(None, title="This Week", description="Filter by this week"),
    sort: Annotated[list[str] | None, Query(title="Sort", description="Sort by")] = None,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
   return utils.get_invoice_reports(        
        email=decoded_access_token.email,
        role=decoded_access_token.role.value,
        page=page,
        limit=limit,
        sort=sort,
        bid=bid,
        city=city,
        cost_centre=cost_centre,
        trip_type=trip_type,
        coordinator=coordinator,
        organizer=organizer,
        check_in_date_gte=check_in_date_gte,
        check_in_date_lte=check_in_date_lte,
        check_in_date=check_in_date,
        check_out_date_gte=check_out_date_gte,
        check_out_date_lte=check_out_date_lte,
        check_out_date=check_out_date,
        today=today,
        this_week=this_week
    )

@router.get("/invoices/reports/download", status_code=status.HTTP_200_OK, response_model=dict)
def get_invoice_reports( 
    page: int = Query(1, title="Page Number", description="Page number for pagination"),
    limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
    city: Annotated[list[str] | None, Query(title="Trip Type", description="Name of the city")] = None,
    cost_centre: Annotated[list[str] | None, Query(title="Cost Centres", description="Cost Centre Name")] = None, 
    trip_type: Annotated[list[str] | None, Query(title="Trip Type", description="Filter by trip type")] = None,
    organizer: Annotated[list[str] | None, Query(title="Organizer Name", description="Filter by organizer name")] = None,
    coordinator: Annotated[list[str] | None, Query(title="Coordinator Name", description="Filter by coordinator name")] = None,
    bid: Annotated[str | None, Query(title="bid", description="Filter by booking sequence id")] = None,
    check_in_date_gte: str = Query(None, title="Check In Start Date", description="Filter by check_in start date"),
    check_in_date_lte: str = Query(None, title="Check In End Date", description="Filter by check_in end date"),
    check_in_date: str = Query(None, title="Check In Date", description="Filter by check_in date"),
    check_out_date_gte: str = Query(None, title="Check Out Start Date", description="Filter by check_out start date"),
    check_out_date_lte: str = Query(None, title="Check Out End Date", description="Filter by check_out end date"),
    check_out_date: str = Query(None, title="Check Out Date", description="Filter by check_out date"),
    today: str = Query(None, title="Today Date", description="Filter by today"),
    this_week: str = Query(None, title="This Week", description="Filter by this week"),
    sort: Annotated[list[str] | None, Query(title="Sort", description="Sort by")] = None,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
   return utils.get_invoice_reports(        
        email=decoded_access_token.email,
        role=decoded_access_token.role.value,
        page=page,
        limit=limit,
        sort=sort,
        bid=bid,
        city=city,
        cost_centre=cost_centre,
        trip_type=trip_type,
        coordinator=coordinator,
        organizer=organizer,
        check_in_date_gte=check_in_date_gte,
        check_in_date_lte=check_in_date_lte,
        check_in_date=check_in_date,
        check_out_date_gte=check_out_date_gte,
        check_out_date_lte=check_out_date_lte,
        check_out_date=check_out_date,
        today=today,
        this_week=this_week,
        download=True
    )