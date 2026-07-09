from typing_extensions import Annotated
from pydantic import BaseModel, StringConstraints

class VehicleInfo(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True)]
    vehicle_model_id: int