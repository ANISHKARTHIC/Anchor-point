from fastapi import APIRouter, Request
from app_routes.callback import utils


router = APIRouter()


@router.post("/twilio/drivers")
async def driver_message_callback(request: Request):
    form_data = await request.form() 
    return utils.driver_sms_failure_callback(form_data)


@router.post("/twilio/guests")
async def guest_message_callback(request: Request):
    form_data = await request.form() 
    return utils.guest_sms_failure_callback(form_data)

@router.post("/twilio/hotel_bookings/guests")
async def hotel_guest_sms_failure_callback(request: Request):
    form_data = await request.form() 
    return utils.hotel_guest_sms_failure_callback(form_data)
