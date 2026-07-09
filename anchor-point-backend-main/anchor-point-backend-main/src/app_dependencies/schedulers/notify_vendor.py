from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from datetime import datetime,timedelta
from app_models.models import Booking,Vendor
from app_utils.utils import get_model_record_by_id
from common_utils.utils import send_mail
from app_configs import constants as const
from app_utils.decorators import transactional
import os
from pytz import utc
from app_models.database import conn_string
from apscheduler.triggers.date import DateTrigger
import logging
from common_utils import utils as cutils

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

job_stores={"default":SQLAlchemyJobStore(url=conn_string)}
scheduler = BackgroundScheduler(jobstores=job_stores,timezone=utc)

#start scheduler 
def start_scheduer():
    if not scheduler.running:
        scheduler.start()
        logger.info("scheduler started with SQLAlchemyJobStore")

#stop scheduler 
def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("sheduler shutdown complete")

# notify vendor jobs
@transactional
def notify_vendor_add_driver(id):
    booking_record = get_model_record_by_id(Booking, id)

    if booking_record.vendor_id and not booking_record.driver_id:
        vendor = booking_record.vendor
        organizer = booking_record.organizers

        mail_subject=const.DRIVER_ASSIGNMENT_REMAINDER_MAIL_SUBJECT.format(bid=booking_record.bid)
        mail_body=const.DRIVER_ASSIGNMENT_REMAINDER_MAIL_BODY.format(
            vendor_name=vendor.name,
            bid=booking_record.bid,
            contact_support=os.environ.get("CONTACT_SUPPORT")
        )
        send_mail(subject=mail_subject,body=mail_body,recipient_email=vendor.email, cc_recipient_emails=[organizer.email])
        logger.info(f"successfully sent driver assignment mail to vendor")
    
def create_vendor_assignment_job(booking_id,booking_datetime:datetime):
    notify_time = booking_datetime - timedelta(hours=2)
    if notify_time <= cutils.current_utc_time():
        logger.info(f"Booking {booking_id} time already passed, skipping job.")
    job_id = f"booking_{booking_id}"
    scheduler.add_job(notify_vendor_add_driver,trigger=DateTrigger(run_date=notify_time),id=job_id,args=[booking_id],replace_existing=True)
    logger.info(f"Scheduled job {job_id} at {notify_time} UTC")
