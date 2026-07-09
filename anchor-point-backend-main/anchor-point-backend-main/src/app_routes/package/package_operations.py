from fastapi import APIRouter, Depends, status
from app_routes.package.schema import PackageInfo
from app_routes.package import utils
from common_utils.utils import JWTBearer
from app_schemas.schema import AccessToken

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_package(package: PackageInfo, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.create_package(decoded_access_token.email, package)

@router.get("/", status_code=status.HTTP_200_OK, response_model=dict)
def get_packages(decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_packages(decoded_access_token.email)

@router.get("/{package_id}", status_code=status.HTTP_200_OK, response_model=dict)
def get_package_by_id(
    package_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_package_by_id(decoded_access_token.email, package_id)


@router.put("/{package_id}", status_code=status.HTTP_200_OK, response_model=dict)
def update_package(
    package_id: int,
    request: PackageInfo,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.update_package(decoded_access_token.email, package_id, request)


@router.delete("/{package_id}", status_code=status.HTTP_200_OK, response_model=dict)
def delete_package(
    package_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.delete_package(decoded_access_token.email, package_id)
