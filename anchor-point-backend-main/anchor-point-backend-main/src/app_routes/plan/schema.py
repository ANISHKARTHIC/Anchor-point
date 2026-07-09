from typing import Optional
from pydantic import BaseModel

class DriverChargeInfo(BaseModel):  
    vehicle_model: str
    charge: str
    
class PlanInfo(BaseModel):
    package_id: int
    vehicle_id: int
    vendor_id: int
    cost: float
    extra_distance_cost: float
    extra_hour_cost: float