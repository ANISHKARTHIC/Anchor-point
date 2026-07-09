from fastapi import APIRouter, status, Depends, BackgroundTasks, Form, Query
from typing import List, Annotated, Literal
from app_schemas.schema import AccessToken
from fastapi import BackgroundTasks, File, UploadFile
from app_routes.invoice import utils
from common_utils.utils import JWTBearer
from app_schemas.schema import AccessToken
from app_routes.invoice.schema import InvoiceReject


router = APIRouter()


@router.post("/", status_code=status.HTTP_200_OK)
def generate_invoice(
   background_tasks: BackgroundTasks,
   booking_id: str = Form(...),
   base_fare: float = Form(...),
   driver_charge: float = Form(...),
   taxable_sub_total: float = Form(...),
   non_taxable_sub_total: float = Form(...),
   final_invoice_amount: float = Form(...),
   cgst_amount: float = Form(...),
   sgst_amount: float = Form(...),
   package_id: int = Form(...),
   vehicle_id: int = Form(...),
   discount_percent: float = Form(0.0),
   cancellation_amount: float = Form(0.0),
   extra_kms: float = Form(0.0),
   extra_hrs: float = Form(0.0),
   extra_distance_cost: float = Form(0.0),
   extra_duration_cost: float = Form(0.0),
   po_number: str = Form(None),
   description: str = Form(None),
   miscellaneous: float = Form(0.0),
   parking_and_toll: float = Form(0.0),
   trip_documents: List[UploadFile] = File(None),
   decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.generate_and_store_invoice_pdf(
      background_tasks,
      booking_id,
      base_fare,
      driver_charge,
      discount_percent,
      cancellation_amount,
      extra_kms,
      extra_hrs,
      extra_distance_cost,
      extra_duration_cost,
      taxable_sub_total,
      non_taxable_sub_total,
      final_invoice_amount,
      po_number,
      description,
      miscellaneous,
      parking_and_toll,
      cgst_amount,
      sgst_amount,
      package_id,
      vehicle_id,
      trip_documents,
      decoded_access_token.email,
      decoded_access_token.role.value,
   )

@router.post("/approve/{booking_id}", status_code=status.HTTP_200_OK)
def approve_invoice(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.update_invoice_event(decoded_access_token.email, booking_id)


@router.post("/reject/{booking_id}", status_code=status.HTTP_200_OK)
def reject_invoice(booking_id: str, invoice_reject_request: InvoiceReject, decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.update_invoice_event(decoded_access_token.email, booking_id, invoice_reject_request.comment, reject=True,)


@router.get("/history/{booking_id}", status_code=status.HTTP_200_OK)
def invoice_history_by_id(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.get_invoice_history_info(decoded_access_token.email, decoded_access_token.role.value, booking_id)


@router.get("/summary/{booking_id}", status_code=status.HTTP_200_OK)
def invoice_trip_summary(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.get_invoice_trip_summary(decoded_access_token.email, decoded_access_token.role.value, booking_id)


@router.get("/public_url/{booking_id}", status_code=status.HTTP_200_OK)
def invoice_public_url(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.get_invoice_public_url(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.get("/client/presigned_url/{booking_id}", status_code=status.HTTP_200_OK)
def invoice_presigned_url(
   booking_id: str, 
   invoice_type: Literal["invoices", "credit_notes"] = Query("invoices", description="Type of invoice"),
   invoice_time : str = None, 
   decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.get_client_invoice_presigned_url(decoded_access_token.email, decoded_access_token.role.value, booking_id, invoice_type, invoice_time)

@router.get("/reports", status_code=status.HTTP_200_OK, response_model=dict)
def get_invoice_reports( 
   page: int = Query(1, title="Page Number", description="Page number for pagination"),
   limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
   booking_type: Annotated[list[str] | None, Query(title="Booking Type", description="Type of booking ie. hotel or cab")] = None,
   bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
   cost_centre: Annotated[list[str] | None, Query(title="Cost Centres", description="Cost Centre Name")] = None,
   today: str = Query(None, title="Today Date", description="Filter by today"),
   this_week: str = Query(None, title="This Week", description="Filter by this week"),
   invoice_date: str = Query( None, title="Invoice Exact Date", description="Filter by invoice exact date"),
   invoice_start_date: str = Query( None, title="Invoice Start Date", description="Filter by invoice start date"),
   invoice_end_date: str = Query( None, title="Invoice end Date", description="Filter by invoice start date"),
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
      cost_centre=cost_centre,
      today=today,
      this_week=this_week,
      booking_type=booking_type,
      invoice_date=invoice_date,
      invoice_start_date=invoice_start_date,
      invoice_end_date=invoice_end_date
   )

@router.get("/reports/download", status_code=status.HTTP_200_OK)
def get_invoice_reports_as_excel( 
   page: int = Query(1, title="Page Number", description="Page number for pagination"),
   limit: int = Query(10, title="Limit", description="Number of items per page", ge=1, le=10),
   booking_type: Annotated[list[str] | None, Query(title="Booking Type", description="Type of booking ie. hotel or cab")] = None,
   cost_centre: Annotated[list[str] | None, Query(title="Cost Centres", description="Cost Centre Name")] = None,
   bid: Annotated[str | None, Query(title="bid", description="Booking sequence id")] = None,
   today: str = Query(None, title="Today Date", description="Filter by today"),
   this_week: str = Query(None, title="This Week", description="Filter by this week"),
   invoice_date: str = Query( None, title="Invoice Exact Date", description="Filter by invoice exact date"),
   invoice_start_date: str = Query( None, title="Invoice Start Date", description="Filter by invoice start date"),
   invoice_end_date: str = Query( None, title="Invoice end Date", description="Filter by invoice start date"),
   sort: Annotated[list[str] | None, Query(title="Sort", description="Sort by")] = None,
   decoded_access_token: AccessToken = Depends(JWTBearer()),
):
   return utils.get_invoice_reports( 
      email=decoded_access_token.email,
      role=decoded_access_token.role.value,
      page=page,
      limit=limit,
      sort=sort,
      today=today,
      bid=bid,
      cost_centre=cost_centre,
      this_week=this_week,
      booking_type=booking_type,
      invoice_date=invoice_date,
      invoice_start_date=invoice_start_date,
      invoice_end_date=invoice_end_date,
      download=True
   )

@router.get("/tariff_plan/summary", status_code=status.HTTP_200_OK)
def invoice_trip_summary(
   booking_id: str = Query(..., description="The ID of the booking"),
   package_id: int = Query(..., description="The ID of the package"),
   vehicle_id: int = Query(..., description="The ID of the vehicle"),
   decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.get_invoice_tariff_plan_summary(
        decoded_access_token.email,
        decoded_access_token.role.value,
        booking_id,
        package_id,
        vehicle_id
    )

@router.get("/{booking_id}", status_code=status.HTTP_200_OK)
def get_invoice_by_booking_id_endpoint(booking_id: str, decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.get_invoice_data_by_booking_id(decoded_access_token.email, decoded_access_token.role.value, booking_id)

@router.get("{invoice_id}/credit_note", status_code=status.HTTP_200_OK)
def get_credit_note_invoice_by_invoice_id_endpoint(invoice_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
   return utils.get_credit_note_invoice_data_by_invoice_id(decoded_access_token.email, decoded_access_token.role.value, invoice_id)

@router.post("/credit_note", status_code=status.HTTP_200_OK)
def generate_invoice(
   background_tasks: BackgroundTasks,
   invoice_id: int = Form(...),
   base_fare: float = Form(...),
   driver_charge: float = Form(...),
   taxable_sub_total: float = Form(...),
   non_taxable_sub_total: float = Form(...),
   final_invoice_amount: float = Form(...),
   cgst_amount: float = Form(...),
   sgst_amount: float = Form(...),
   package_id: int = Form(...),
   vehicle_id: int = Form(...),
   discount_percent: float = Form(0.0),
   cancellation_amount: float = Form(0.0),
   extra_kms: float = Form(0.0),
   extra_hrs: float = Form(0.0),
   extra_distance_cost: float = Form(0.0),
   extra_duration_cost: float = Form(0.0),
   po_number: str = Form(None),
   description: str = Form(None),
   miscellaneous: float = Form(0.0),
   parking_and_toll: float = Form(0.0),
   trip_documents: List[UploadFile] = File(None),
   decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.generate_and_store_credit_note_invoice_pdf(
      background_tasks,
      invoice_id,
      base_fare,
      driver_charge,
      discount_percent,
      cancellation_amount,
      extra_kms,
      extra_hrs,
      extra_distance_cost,
      extra_duration_cost,
      taxable_sub_total,
      non_taxable_sub_total,
      final_invoice_amount,
      po_number,
      description,
      miscellaneous,
      parking_and_toll,
      cgst_amount,
      sgst_amount,
      package_id,
      vehicle_id,
      trip_documents,
      decoded_access_token.email,
      decoded_access_token.role.value,
   )

