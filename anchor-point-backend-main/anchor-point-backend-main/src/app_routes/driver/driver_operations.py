from app_routes.driver.schema import DriverChargesBase, UpdateDriverCharges
from fastapi import APIRouter, Form, UploadFile, status, Depends
from app_schemas.schema import AccessToken
from app_routes.driver import utils
from app_routes.trip import utils as trip_utils
from common_utils.utils import JWTBearer
from typing import Optional

router = APIRouter()


@router.post("/login/{booking_id}", status_code=status.HTTP_200_OK, response_model=dict)
def login(booking_id: str, otp: str):
    return utils.login(booking_id, otp)


@router.get(
    "/bookings/{booking_id}", status_code=status.HTTP_200_OK, response_model=dict
)
def get_booking_info_by_booking_id(
    booking_id: str,
    driver_location: str = None,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.retrieve_booking_info_by_id(booking_id, decoded_access_token.role.value, driver_location)


@router.post("/trips", status_code=status.HTTP_200_OK, response_model=dict)
def create_trip(
    booking_id: str = Form(...),
    status: str = Form(...),
    odo_reading: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    odo_reading_image: Optional[UploadFile] = Form(None),
    distance: Optional[str] = Form(None),
    duration: Optional[str] = Form(None),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return trip_utils.create_trip(
        booking_id, status, odo_reading, location, distance, duration, odo_reading_image
    )


@router.post("/trips/status", status_code=status.HTTP_200_OK, response_model=dict)
def create_trip_event_with_signature(
    booking_id: str = Form(...),
    location: str = Form(...),
    status: str = Form(...),
    booking_log_id: str = Form(...),
    guest_name: str = Form(...),
    signature_image: Optional[UploadFile] = Form(None),
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return trip_utils.create_trip_event_with_signature(
        booking_id, status, location, booking_log_id, guest_name, signature_image
    )


@router.get("/trips/history", status_code=status.HTTP_200_OK, response_model=dict)
def get_trip_history(
    booking_id: str,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return trip_utils.get_trip_history(booking_id)

@router.post(
    "/charges", status_code=status.HTTP_201_CREATED, response_model=dict
)
def create_driver_charge(
    request: DriverChargesBase, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.create_driver_charge(decoded_access_token.email, request)


@router.get("/charges", status_code=status.HTTP_200_OK, response_model=dict)
def get_driver_charges(vendor_id: int = None, decoded_access_token: AccessToken = Depends(JWTBearer())):
    return utils.get_driver_charges(decoded_access_token.email, vendor_id)

@router.get(
    "/charges/{driver_charge_id}",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def get_driver_charge_by_id(
    driver_charge_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.get_driver_charge_by_id(decoded_access_token.email, driver_charge_id)


@router.put(
    "/charges",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def update_driver_charges(
    update_request: UpdateDriverCharges,
    decoded_access_token: AccessToken = Depends(JWTBearer()),
):
    return utils.update_driver_charges(
        decoded_access_token.email, update_request
    )


@router.delete(
    "/charges/{driver_charge_id}",
    status_code=status.HTTP_200_OK,
    response_model=dict,
)
def delete_driver_charge(
    driver_charge_id: int, decoded_access_token: AccessToken = Depends(JWTBearer())
):
    return utils.delete_driver_charge(
        decoded_access_token.email, driver_charge_id
    )
