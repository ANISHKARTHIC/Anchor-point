from typing import Optional
from typing_extensions import Annotated
from pydantic import BaseModel, StringConstraints


class PackageInfo(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True)]
    distance_kms: int
    interval_hrs: int
    description: Optional[Annotated[str, StringConstraints(strip_whitespace=True)]] = None