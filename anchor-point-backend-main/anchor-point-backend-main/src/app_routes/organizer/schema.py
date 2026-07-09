from pydantic import BaseModel, field_validator, StringConstraints
from app_schemas.schema import PasswordModel
from typing import Optional, Annotated
from enum import Enum
from app_routes.booking.schema import BookingStatus


class OrganizerRole(Enum):
    SUPER = 1
    NORMAL = 0


class OrganizerResponse(BaseModel):
    name: str
    email: str


class OrganizerModel(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True)]
    email: str
    role: int
    password: Optional[str] = None
    fcm_token: Optional[str] = None


class LoginOrganizer(BaseModel):
    email: str
    password: str


class UpdateOrganizer(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True)]
    role: int
    is_active: bool
    is_verified: bool


class UpdatePassword(BaseModel):
    email: str
    current_password: str
    new_password: str

    @field_validator("new_password")
    def validate_new_password(cls, value):
        return PasswordModel.validate_password(value)


class ForgotPassword(BaseModel):
    email: str

class UpdateBookingStatus(BaseModel):
    booking_id: str
    status: str
    metadata: Optional[dict] = {}


class OptimalRoute(BaseModel):
    vendor_location: Optional[str] = None
    driver_location: Optional[str] = None
    pickups_dropoffs: list[dict]

class UpdateBookingModel(BaseModel):
    cab_type: Optional[str] = None
    description: Optional[str] = None
    cost_centre: Optional[dict] = None
    pick_up_date: Optional[str] = None
    pick_up_time: Optional[str] = None