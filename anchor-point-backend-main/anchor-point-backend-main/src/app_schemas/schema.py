import re
from typing import Optional
from fastapi import HTTPException, status
from pydantic import BaseModel, field_validator, constr
from enum import Enum
from app_routes.booking.schema import BookingType


class PasswordModel(BaseModel):
    password: constr(min_length=8, max_length=64)

    @field_validator("password")
    def validate_password(cls, value):
        if not re.match(r"^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$", value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                "Password must be at least eight characters long and include one lowercase letter, one uppercase letter, one digit, and one special character."                
                ),
            )
        return value


class OrganizerResponse(BaseModel):
    name: str
    email: str


class Role(Enum):
    COORDINATOR = "coordinator"
    ORGANIZER = "organizer"
    VENDOR = "vendor"
    DRIVER = "driver"


class AccessToken(BaseModel):
    email: Optional[str] = None
    role: Role
    exp: int

class CostCentreModel(BaseModel):
    code: str
    gstin_no: Optional[str] = ""
    address: Optional[str] = ""

class GuestModel(BaseModel):
    mobile: str
    booking_type: BookingType

class GuestUpdate(BaseModel):
    mobile: str
    email: str
    name: str

class TokenRequest(BaseModel):
    uid: str

class VerifyRequest(BaseModel):
    token: str

class User(BaseModel):
    email : str
    role : str
    
class ChatMessage(BaseModel):
    booking_id: str
    booking_type: str
    notification_type: str
    recipient: User
    message: str

class TariffPlanSchema(BaseModel):
    package_id: int
    vehicle_id: int
    city_id: int
    cost: float
    extra_distance_cost: float
    extra_hour_cost: float

class UpdateTariffPlanSchema(BaseModel):
    package_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    city_id: Optional[int] = None
    cost: Optional[float] = None
    extra_distance_cost: Optional[float] = None
    extra_hour_cost: Optional[float] = None