from pydantic import BaseModel, field_validator, StringConstraints, Field
from enum import Enum
from datetime import datetime
from typing import Annotated, List, Union, Optional
from common_utils import utils as cutils
from uuid import UUID
from fastapi import HTTPException, status

class BookingStatus(Enum):
    PENDING = "pending"
    CANCELLED = "cancelled"
    ORGANIZER_ASSIGNED = "organizer_assigned"
    VENDOR_ASSIGN_REVOKED = "vendor_assign_revoked"
    BOOKING_ACCEPTED = "booking_accepted"
    VENDOR_REQUESTED = "vendor_requested"
    VENDOR_DECLINED = "vendor_declined"
    VENDOR_ACCEPTED = "vendor_accepted"
    VENDOR_REASSIGNED = "vendor_reassigned"
    DRIVER_ASSIGNED = "driver_assigned"
    DRIVER_REASSIGNED = "driver_reassigned"
    INVOICE_CREATED= "invoice_created"
    INVOICE_GENERATED= "invoice_generated"
    INVOICE_APPROVED= "invoice_approved"
    INVOICE_REJECTED= "invoice_rejected"


class BookingType(str, Enum):
    CAB = "Cab"
    HOTEL = "Hotel"

class TravelMode(str, Enum):
    STANDARD = "standard"
    RENTAL = "rental"

class BookingEventType(str, Enum):
    UPCOMING = "UPCOMING"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"

class BookingRes(BaseModel):
    id: int
    type: str
    cab_type: str
    organizer_id: Optional[int]
    coordinator_id: int
    plan_id: Optional[int]
    booking_date: datetime


class AllBookings(BaseModel):
    bookings: List[BookingRes]


class CreateBooking(BaseModel):
    type: str
    cab_type: str
    pickup_date: datetime


class CreateGuest(BaseModel):
    name: str
    id_no: str
    mobile: str
    cost_centres: list[str]
    source: str
    destination: str
    email: Optional[str]


class GuestRes(CreateGuest):
    booking_id: int


class LocationInfo(BaseModel):
    """
    Represents a location information with latitude, longitude, address, and landmark.
    """
    delete: Optional[bool] = False
    waypoint_id: Optional[int] = None
    location_id: Optional[Union[int, str]] = None
    name: Optional[str]
    latitude: float
    longitude: float
    address: str
    landmark: Optional[str]
    title: Optional[str]

class GuestInfo(BaseModel):
    """
    Represents a guest with their name, ID number, email, mobile number,
    and a list of cost centers. Also includes a location for the guest.
    """
    delete: Optional[bool] = False
    booking_log_id: Optional[int] = None
    id: Optional[int] = None
    name: str
    email: str
    mobile: str
    source: LocationInfo
    waypoints: Optional[List[LocationInfo]] = []
    alternate_email: Optional[str] = ""
    alternate_mobile: Optional[str] = ""
    destination: Optional[LocationInfo] = None
    rank: Optional[str] = ""
    internal_id: Optional[str] = ""
    vessel_name: Optional[str] = ""
    date_of_duty: Optional[str] = None
    start_time: Optional[str] = ""
    flight_details: Optional[str] = ""

    @field_validator("mobile")
    def validate_mobile_number(cls, value):
        return cutils.validate_mobile_number_format(value)

class GuestModal(BaseModel):
    guests : List[GuestInfo]

class CabRequestModel(BaseModel):
    """
    Represents a cab request with type, cab type, pickup date, pickup time,
    and a list of guests with their details and locations.
    """
    id: Optional[int] = None
    organizer_id: Optional[int] = None
    travel_mode: TravelMode = Field(TravelMode.STANDARD, description="Mode of travel")
    cost_centre_id: int
    city_id: Optional[int] = None
    cab_type: str
    pick_up_date: Union[List[str], str]
    pick_up_time: str
    guests: List[GuestInfo]
    po_number: str = "NA"

class CostCentreInfo(BaseModel):
    id: int
    code: str
    address: Optional[str] = None
    gstin_no: Optional[str] = None

class CityInfo(BaseModel):
    id: int
    city: str

class EditCabBookingModal(BaseModel):
    id: UUID
    bid: str
    cost_centre: CostCentreInfo
    city: Optional[CityInfo] = None
    cab_type: str
    po_number: str = "NA"
    pick_up_date: str
    pick_up_time: str
    description: str
    travel_mode: str
    coordinator_email: str
    cc_recipients: Optional[List[str]] = None
    guests: List[GuestInfo]

class HotelBookingModel(BaseModel):
    """
    Represents a hotel booking with hotel-specific details.
    """
    id: Optional[int] = None
    cost_centre_id: int
    check_in_date: str
    check_out_date: str
    hotel_name: str
    guests: List[GuestInfo]


class BookingModel(BaseModel):
    """
    Represents a booking, which can be for a hotel or a cab. Includes common fields and a type field
    to distinguish between hotel and cab bookings.
    """
    id: Optional[UUID] = None
    type: BookingType  # Use 'hotel' or 'cab' to indicate the booking type
    data: Union[CabRequestModel, HotelBookingModel]
    booking_escalation: Optional[bool] = False 
    approver_email: Optional[str] = None
    coordinator_email: Optional[str] = None
    cc_recipients: Optional[List[str]] = None
    description: Optional[Annotated[str, StringConstraints(strip_whitespace=True)]] = None

class BookingInfoResponse(BaseModel):
    """
    Response model for booking information.
    """

    data: Union[List[dict], dict]


class BookingStatusInfo(BaseModel):
    """
    Represents booking status info
    """

    status: BookingStatus
    booking_id: str


class BookingHistory(BaseModel):
    """
    Response Model for booking history
    """

    id: int
    booking_id: int
    event: BookingStatus
    meta_data: dict
    created_at: datetime
