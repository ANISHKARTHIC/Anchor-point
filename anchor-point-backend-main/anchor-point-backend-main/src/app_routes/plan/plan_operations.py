from fastapi import APIRouter, Depends, status
from app_routes.plan.schema import PlanInfo
from app_routes.plan import utils
from common_utils.utils import JWTBearer
from app_schemas.schema import AccessToken, Role
from app_utils import exception as ex

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_plan(
    plan_request: PlanInfo, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_plan(decoded_access_token.email, plan_request)

@router.get("/", status_code=status.HTTP_200_OK, response_model=dict)
def get_plans(
    vendor_id: int = None, 
    vehicle_id: int = None,
    decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_plans(decoded_access_token.email, decoded_access_token.role.value, vendor_id, vehicle_id)

@router.get("/vendors", status_code=status.HTTP_200_OK, response_model=dict)
def get_plan_vendors(cab_type: str = None, city_id: int = None, decoded_access_token: AccessToken = Depends(JWTBearer())):
    if decoded_access_token.role.value != Role.ORGANIZER.value:
        raise ex.InvalidRole
    return utils.get_plan_vendors(email=decoded_access_token.email, cab_type=cab_type, city_id=city_id)

@router.get("/{plan_id}", status_code=status.HTTP_200_OK, response_model=dict)
def get_plan_by_id(plan_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_plan_by_id(decoded_access_token.email, decoded_access_token.role.value, plan_id)

@router.put("/{plan_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_plan(
    plan_id: int,
    update_request: PlanInfo,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.update_plan(decoded_access_token.email, plan_id, update_request)

@router.delete("/{plan_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_plan(plan_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.delete_plan(decoded_access_token.email, plan_id)

