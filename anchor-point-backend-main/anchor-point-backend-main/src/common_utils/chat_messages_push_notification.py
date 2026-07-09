import json
from typing import Union
from app_models.models import Coordinator, Organizer
from app_schemas.schema import ChatMessage, Role
from app_routes.device import utils as device_utils
from app_utils.decorators import transactional, verify_jwt_role_and_email
from common_utils import utils as cutils
from app_routes.hotel_bookings.hotel_operations import utils as hotel_booking_utils
from app_utils import utils as app_utils
from logger import logger as logging

@transactional
def get_booking_info(booking_id: str, booking_type: str):
    if booking_type == "cab":
        booking_info = app_utils.get_booking_info(role=Role.ORGANIZER.value, booking_id=booking_id).get("booking")
    else:  
        booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=booking_id) 
    
    return json.dumps(booking_info, default=str)

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def send_push_notification(user: Union[Coordinator, Organizer], request: ChatMessage):
    try:
        recipient = request.recipient
        email = recipient.email
        role = recipient.role

        tokens = device_utils.get_device_info(role=role, email=email)

        title = f"New message from {user.name}"
        body = request.message
        data = {
            "booking": get_booking_info(request.booking_id, request.booking_type),
            "notification_type": request.notification_type,
            "target": role,
            "message": request.message
        }
        for token in tokens:
            cutils.send_push_notification_message(
                token=token, title=title, body=body, data=data
            )

    except Exception as err:
        logging.error(str(err))