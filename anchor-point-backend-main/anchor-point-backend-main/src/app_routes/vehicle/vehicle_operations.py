from fastapi import APIRouter, Depends, status
from app_routes.vehicle.schema import VehicleInfo
from app_routes.vehicle import utils
from common_utils.utils import JWTBearer
from app_schemas.schema import AccessToken

router = APIRouter()


@router.post("/models", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_vehicle_model(
    vehicle_model: str,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.create_vehicle_model(decoded_access_token.email, vehicle_model)


@router.get("/models", status_code=status.HTTP_200_OK, response_model=dict)
def get_vehicle_models(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_vehicle_models(decoded_access_token.email, decoded_access_token.role.value)


@router.get(
    "/models/{vehicle_model_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def get_vehicle_model_by_id(
    vehicle_model_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_vehicle_model_by_id(decoded_access_token.email, vehicle_model_id)


@router.put(
    "/models/{vehicle_model_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def update_vehicle_model(
    vehicle_model_id: int,
    vehicle_model:str,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.update_vehicle_model(
        decoded_access_token.email, vehicle_model_id, vehicle_model
    )


@router.delete(
    "/models/{vehicle_model_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def delete_vehicle_model(
    vehicle_model_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.delete_vehicle_model(decoded_access_token.email, vehicle_model_id)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=dict,
)
def create_vehicle(
    vehicle: VehicleInfo,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.create_vehicle(decoded_access_token.email, vehicle)


@router.get("/", status_code=status.HTTP_200_OK, response_model=dict)
def get_vehicles(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_vehicles(decoded_access_token.email)


@router.get("/{vehicle_id}", status_code=status.HTTP_200_OK, response_model=dict)
def get_vehicle_by_id(
    vehicle_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_vehicle_by_id(decoded_access_token.email, vehicle_id)


@router.put("/{vehicle_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_vehicle(
    vehicle_id: int,
    update_request: VehicleInfo,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.update_vehicle(decoded_access_token.email, vehicle_id, update_request)


@router.delete("/{vehicle_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_vehicle(
    vehicle_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.delete_vehicle(decoded_access_token.email, vehicle_id)
