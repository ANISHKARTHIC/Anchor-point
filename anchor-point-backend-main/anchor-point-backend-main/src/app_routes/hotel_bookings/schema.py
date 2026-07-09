from enum import Enum
from pydantic import BaseModel, StringConstraints
from typing import List, Optional, Dict, Annotated
from datetime import date

class BookingStatus(Enum):
    PENDING = "pending"
    CANCELLED = "cancelled"
    ORGANIZER_ASSIGNED = "organizer_assigned"
    VENDOR_REQUESTED = "vendor_requested"
    VENDOR_DECLINED = "vendor_declined"
    VENDOR_ACCEPTED = "vendor_accepted"
    VENDOR_REASSIGNED = "vendor_reassigned"
    INVOICE_CREATED= "invoice_created"
    INVOICE_GENERATED= "invoice_generated"
    INVOICE_APPROVED= "invoice_approved"
    INVOICE_REJECTED= "invoice_rejected"

class HotelBookingStatus(Enum):
    PENDING = "pending"
    CANCELLED = "cancelled"
    ORGANIZER_ASSIGNED = "organizer_assigned"
    VENDOR_REQUESTED = "vendor_requested"
    VENDOR_ACCEPTED = "vendor_accepted"
    VENDOR_DECLINED = "vendor_declined"
    VENDOR_ASSIGN_REVOKED = "vendor_assign_revoked"
    INVOICE_CREATED= "invoice_created"
    INVOICE_GENERATED= "invoice_generated"
    INVOICE_APPROVED= "invoice_approved"
    INVOICE_REJECTED= "invoice_rejected"
    INVOICE_CREATED_BY_ORGANIZER = "invoice_created_by_organizer"
    INVOICE_CREATED_BY_SUPER_ORGANIZER = "invoice_created_by_super_organizer"
    CONFIRMED= "confirmed"


class VendorHotelBookingStatus(Enum):
    REQUESTED = "requested"
    VENDOR_REASSIGNED = "vendor_reassigned"
    REVOKED = "revoked"
    CANCELLED = "cancelled"
    OWNED = "owned"

class BillingOption(str, Enum):
    COMPANY = "Company"
    GUEST = "Guest"
    SHARED = "Shared"
    
class GuestCreate(BaseModel):
    hotel_booking_guest_id: Optional[int] = None
    delete: Optional[bool] = False
    is_primary: bool
    name: str
    mobile: str
    email: str
    vessel_name: Optional[str] = ""
    rank: Optional[str] = ""
    internal_id: Optional[str] = ""

class RoomDetailCreate(BaseModel):
    room_type: str
    no_of_rooms: int

class CostCentreInfo(BaseModel):
    id: int
    code: str

class VendorInfo(BaseModel):
    id: int
    name: str

class HotelBookingCreate(BaseModel):
    city: str
    trip_type: str
    coordinator_email: str
    cost_centre: CostCentreInfo
    no_of_adults: int
    no_of_children: int
    no_of_rooms: int
    check_in: date
    check_out: date
    guests: List[GuestCreate]
    bid: Optional[str] = ""
    confirmation_no: Optional[str] = None
    billing_option: str = ""
    room_type: Optional[str] = ""
    related_booking_id:  Optional[str] = ""
    cc_recipients:  List[str] = []
    description: Optional[Annotated[str, StringConstraints(strip_whitespace=True)]] = None
    pickup: Optional[dict] = {}
    drop: Optional[dict] = {}

class HotelBookingUpdate(BaseModel):
    booking_id: str
    status: str
    metadata: dict

class HotelBookingEditRequestStatusEnum(Enum):
    requested = "edit_requested"
    acknowledged = "edit_acknowledged"
    confirmed = "edit_confirmed"

class HotelBookingEditRequestModel(BaseModel):
    status: HotelBookingEditRequestStatusEnum
    description: Optional[str] = ""
    metadata: Optional[dict] = {}

class HotelBookingEditRequestUpdate(HotelBookingEditRequestModel):
    request_id: int

class HotelInvoiceItemModel(BaseModel):
    id: Optional[int] = None
    delete: Optional[bool] = False
    name : str
    sac: int
    quantity: int
    tax_percent: float
    tax_rate: float
    rate: float
    amount: float
    
class HotelInvoiceModel(BaseModel):
    id: Optional[int] = None
    booking_id: Optional[str] = None
    invoice_no: Optional[str] = None
    description: Optional[str] = ""
    po_number: Optional[str] = ""
    taxable_amount: float
    non_taxable_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: Optional[float] = 0
    total_amount: float
    invoice_items: List[HotelInvoiceItemModel]

class HotelRoomCategoryModal(BaseModel):
    name: str

class HotelMealPlanModal(BaseModel):
    name: str

class HotelPricingModal(BaseModel):
    vendor_id: int
    room_category_id: int
    meal_plan_id: int
    single_room_rate: float
    double_room_rate: Optional[float] = None
    inclusions: str