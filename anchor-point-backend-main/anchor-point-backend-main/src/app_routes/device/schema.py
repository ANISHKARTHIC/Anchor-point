from typing import Optional
from pydantic import BaseModel



class CreateDeviceToken(BaseModel):

    fcm_token: str
    device_type: str
    expired_fcm_token: Optional[str] = None