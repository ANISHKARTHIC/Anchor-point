from typing_extensions import Annotated
from pydantic import BaseModel, field_validator, StringConstraints
from typing import Optional
from common_utils import utils as cutils


class SignUpCoordinator(BaseModel):
    email: str


class LoginCoordinator(SignUpCoordinator):
    otp: str


class UpdateCoordinator(BaseModel):
    email: Optional[str] = None
    name: Optional[Annotated[str, StringConstraints(strip_whitespace=True)]] = None
    mobile: Optional[str] = None
    fcm_token: Optional[str] = None

    @field_validator("mobile")
    def validate_primary_mobile_number(cls, value):
        return cutils.validate_mobile_number_format(value)
