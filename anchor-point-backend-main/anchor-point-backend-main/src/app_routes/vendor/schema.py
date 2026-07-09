from datetime import datetime
from pydantic import BaseModel, StringConstraints, model_validator
from typing import Annotated, Optional
from common_utils import utils as cutils
from enum import Enum

class VendorBookingStatus(Enum):
    REQUESTED = "requested"
    OWNED = "owned"
    REASSIGNED = "reassigned"
    
class VendorBase(cutils.BaseMobileValidation):
    name: Annotated[str, StringConstraints(strip_whitespace=True)]
    email: str
    address: str
    coordinates: str
    tax: float
    city_id: int
    vendor_type: str
    is_third_party: bool

class VendorUpdate(cutils.BaseMobileValidation):
    name: Annotated[str, StringConstraints(strip_whitespace=True)]
    address: str
    coordinates: str
    tax: float
    city_id: int
    vendor_type: str
    is_third_party: bool
    is_active: bool
    
class LoginVendor(BaseModel):
    email: str
    password: str


class DriverInfo(cutils.BaseMobileValidation):
    name: Annotated[str, StringConstraints(strip_whitespace=True)]
    vehicle_no: str
    action: str
    previous_driver_id: Optional[int] = None
    previous_driver_name: Optional[str] = None

class TripInfo(BaseModel):
    booking_id: str
    starting_odo: int
    starting_time: datetime
    ending_odo: int
    ending_time: datetime
    distance: float = None
    duration: float = None

    @model_validator(mode="before")
    @classmethod
    def calculate_total_duration(cls, values):
        starting_odo = values.get("starting_odo")
        ending_odo = values.get("ending_odo")
        starting_time = cutils.convert_isoformat_to_utc(values.get("starting_time"))
        ending_time =  cutils.convert_isoformat_to_utc(values.get("ending_time"))
        
        values["starting_time"] = starting_time
        values["ending_time"] = ending_time

        values["distance"] = ending_odo - starting_odo
        values["duration"] = cutils.difference_in_hours(starting_time, ending_time)
    
        return values

class VendorGarageLocationBase(BaseModel):
    vendor_id: int
    city_id: int
    title: str
    address: str
    latitude: float
    longitude: float
    address: str