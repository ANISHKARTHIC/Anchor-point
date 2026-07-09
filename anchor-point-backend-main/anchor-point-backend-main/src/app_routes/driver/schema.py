from typing import List
from typing_extensions import Annotated
from pydantic import BaseModel, StringConstraints


class DriverBase(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True)]
    primary_mobile: str
    secondary_mobile: str = None


class DriverChargesBase(BaseModel):
    vendor_id: int
    vehicle_model_id: int
    charge: float
    
class DriverCharge(DriverChargesBase):
    id: int

class UpdateDriverCharges(BaseModel):
    driver_charges : List[DriverCharge]