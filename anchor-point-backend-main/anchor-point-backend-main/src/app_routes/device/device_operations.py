from fastapi import APIRouter, Depends, status, Request, HTTPException
from app_routes.device.schema import CreateDeviceToken
from app_routes.device import utils
from app_schemas.schema import AccessToken
from common_utils.utils import JWTBearer

router = APIRouter()


@router.post("/fcm-token", status_code=status.HTTP_200_OK, response_model=dict)
def create_device_info(
    device: CreateDeviceToken, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_device_info(
        decoded_access_token.email,
        decoded_access_token.role.value,
        device.device_type,
        device.fcm_token,
        device.expired_fcm_token,
    )

