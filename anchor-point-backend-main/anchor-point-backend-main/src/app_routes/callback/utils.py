from app_utils.decorators import transactional
from app_utils import exception as ex
from logger import logger as logging
from common_utils import utils as cutils
from twilio.base.exceptions import TwilioRestException
from app_routes.driver import utils
from app_routes.hotel_bookings import utils as hotel_booking_utils
from app_models import crud
from app_models.models import (
    BookingLogs,
    HotelBookingGuest
)


@transactional
def driver_sms_failure_callback(data):
    try:
        if data.get('MessageStatus') == 'failed':
            booking = cutils.get_driver_sms_payload(data.get('MessageSid'))
            payload = get_driver_payload(booking)
            utils.send_driver_sms(payload, messaging_type="sms")
            logging.info("Driver callback sms sent sucessfully.")
            return {"message": "Driver sms has been sent successfully."}

    except TwilioRestException as e:
        err_msg = str(e)
        logging.error(err_msg)
        raise ex.SMSException(err_msg)
    

@transactional
def guest_sms_failure_callback(data):
    try:
        if data.get('MessageStatus') == 'failed':
            booking = cutils.get_guest_sms_payload(data.get('MessageSid'))
            booking_log = crud.select_records(primary_table=BookingLogs, filter_conditions=[BookingLogs.guest_message_sid == data.get('MessageSid')]).first()
            payload = get_guest_payload(booking, booking_log)
            utils.send_guests_sms(payload, messaging_type="sms")
            logging.info("Guest callback sms sent sucessfully.")
            return {"message": "Guest sms has been sent successfully."}

    except TwilioRestException as e:
        err_msg = str(e)
        logging.error(err_msg)
        raise ex.SMSException(err_msg)
    
@transactional
def get_hotel_guest_info_by_message_sid(message_sid: str):
    filter_conditions = [HotelBookingGuest.guest_message_sid == message_sid]
    guest = crud.select_records(HotelBookingGuest, filter_conditions=filter_conditions).first()
    return {
        "id": guest.id,
        "booking_id": guest.booking_id,
        "name": guest.name,
        "mobile": guest.mobile,
    }

@transactional
def hotel_guest_sms_failure_callback(data):
    try:
        if data.get('MessageStatus') == 'failed':
            message_sid = data.get('MessageSid')
            guest_info = get_hotel_guest_info_by_message_sid(message_sid)
            booking_info = hotel_booking_utils.get_hotel_bookings(booking_id=guest_info["booking_id"])
            hotel_booking_utils.send_guest_sms(booking_info, guest_info, messaging_type="sms")
            logging.info("Guest callback sms sent sucessfully.")
            return {"message": "Guest sms has been sent successfully."}

    except TwilioRestException as e:
        err_msg = str(e)
        logging.error(err_msg)
        raise ex.SMSException(err_msg)

def get_driver_payload(booking):
    return {
            "booking": {
                "id": booking.id,
                "pickup_date": cutils.get_pickup_date(booking.booking_datetime),
                "pickup_time": cutils.get_pickup_time(booking.booking_datetime),
                },
            "driver": {
                "id":booking.driver.id, 
                "primary_mobile": booking.driver.primary_mobile, 
                "otp": booking.driver.otp,},
            }


def get_guest_payload(booking, booking_log):
    return {
            "booking": {
                "id":booking.id, 
                "pickup_date": cutils.get_pickup_date(booking.booking_datetime),
                "pickup_time": cutils.get_pickup_time(booking.booking_datetime),
                },
            "guests": [{ 
                "booking_log_id": booking_log.id,
                "email": booking_log.email,
                "name":booking_log.name,
                "mobile": booking_log.mobile
            }],
            "driver": {
                "primary_mobile": booking.driver.primary_mobile,
                "vehicle_no": booking.driver.vehicle_no},
            }