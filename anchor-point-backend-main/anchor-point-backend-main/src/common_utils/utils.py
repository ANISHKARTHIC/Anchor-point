"""
This file has methods and logics used by the entire application.
"""
from collections import defaultdict
from email.mime.application import MIMEApplication
import mimetypes
from email.mime.base import MIMEBase
from email import encoders
from itertools import chain
import jwt
import os
import json
import smtplib
import pytz
import random
import string
import re
import uuid
import requests
from app_models.models import BookingLogs, Coordinator, CostCentre, Organizer, Driver, Booking, Vehicle, VehicleModel, Vendor , Guest
import firebase_admin
import boto3
import re
import phonenumbers
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException, status, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import inspect
from botocore.exceptions import BotoCoreError
from app_configs import constants as const, dev_configs as cfg
from app_models.database import Base
from app_schemas.schema import AccessToken, CostCentreModel, Role, VerifyRequest
from app_models import crud
from logger import logger as logging
from passlib.context import CryptContext
from memory_profiler import profile
from pyotp import TOTP
from app_utils import exception as ex
from app_utils.decorators import transactional, verify_jwt_role_and_email
from firebase_admin import credentials, messaging
from typing import Optional, Union, List
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from sqlalchemy import func, TIMESTAMP, exc, desc
from app_routes.device.utils import delete_device_info
from fastapi import HTTPException
from pydantic import BaseModel, field_validator
from app_utils import utils as app_utils
from firebase_admin import auth
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from fastapi import APIRouter,Depends,HTTPException
from app_models.models import TariffPlan,VendorCity,Package
from app_schemas.schema import TariffPlanSchema,UpdateTariffPlanSchema
from app_models.database import SessionMaker
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError,IntegrityError,ResourceClosedError
from common_utils import utils as cutils
from psycopg2 import errors


creds = credentials.Certificate(json.loads(os.environ.get("FIREBASE_JSON")))
firebase_admin.initialize_app(creds)
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
totp = TOTP(os.environ.get("OTP_SECRET_KEY"), interval=const.OTP_EXPIREY_TIME)
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("SECRET_ACCESS_KEY"),
    region_name=os.getenv("REGION"),
)

class BaseMobileValidation(BaseModel):
    primary_mobile: str
    secondary_mobile: Optional[str] = ""

    @field_validator("primary_mobile")
    def validate_primary_mobile_number(cls, value):
        return validate_mobile_number_format(value)

    @field_validator("secondary_mobile")
    def validate_mobile_numbers(cls, value, values):
        if not value:
            return value

        value = validate_mobile_number_format(value)
        if value == values.data.get("primary_mobile"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Primary and secondary mobile number should not be same",
            )

        return value
    
def validate_mobile_number_format(number):
    """
    Validates the format of a mobile number.
    Args:
        number (str): The mobile number to be validated.
    Raises:
        ValueError: If the mobile number is not a 10-digit numeric value.
    """
    parsed_number = phonenumbers.parse(number)
    if not phonenumbers.is_valid_number(parsed_number):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid mobile number format",
        )
    return number.replace(" ", "")

def check_domain_in_list(email: str) -> bool:
    """
    Check if the email contains any of the specified domains.
    Args:
        email (str): The email address to be checked.
    Returns:
        bool: True if the email contains any of the specified domains, False otherwise.
    """
    return any(pattern in email for pattern in const.public_domains)


def convert_to_datetime(date:str, time:str):
    """
    Converts date and time in string format to a datetime object.
    Args:
        date (str): The date in 'YYYY-MM-DD' format.
        time (str): The time in 'HH:MM' format.
    Returns:
        datetime: A datetime object representing the combined date and time (utc time).
    """
    try:
        pickup_datetime_str = f"{date} {time}"
        datetime_obj = datetime.strptime(pickup_datetime_str, "%Y-%m-%d %H:%M")
        local_time = pytz.timezone(const.TARGET_TZ).localize(datetime_obj)
        return convert_datetime(local_time)
    except ValueError:
        raise ex.InvalidDateTimeFormat

def get_pickup_date(utc_time):
    datetime_obj = convert_datetime(utc_time, to_utc=False)
    return datetime_obj.strftime(const.DATEFORMAT)


def get_pickup_time(utc_time):
    datetime_obj = convert_datetime(utc_time, to_utc=False)
    return datetime_obj.strftime(const.TIMEFORMAT)

def convert_local_datetime_to_utc(local_datetime_obj: datetime) -> datetime:
    local_timezone = pytz.timezone(const.TARGET_TZ) # Change this to the correct timezone
    local_datetime = local_timezone.localize(local_datetime_obj)  # Attach timezone info
    return local_datetime.astimezone(pytz.utc)  # Convert the local datetime to UTC

def convert_isoformat_to_utc(datetime_str: str) -> datetime:
    local_datetime = datetime.fromisoformat(datetime_str)
    return local_datetime.astimezone(timezone.utc)

def difference_in_hours(timestamp1: datetime, timestamp2: datetime) -> float:
    time_diff = timestamp2 - timestamp1
    hours_diff = time_diff.total_seconds() / 3600
    return round(hours_diff, 2)

def current_utc_time() -> datetime:
    """
    Get the current UTC time.
    Returns:
        datetime: A datetime object representing the current time in UTC.
    """
    return datetime.now(timezone.utc)


def convert_datetime(datetime_obj: datetime, to_utc: bool = True):
    """
    Convert a datetime between UTC and Asia/Pacific time zone.
    Args:
        time (datetime): The input datetime to convert.
        to_utc (bool): If True, convert to UTC; if False, convert to Asia/Pacific time.
    Returns:
        datetime: The converted datetime.
    """
    convert_tz = pytz.UTC if to_utc else pytz.timezone(const.TARGET_TZ)
    return datetime_obj.astimezone(convert_tz)



def memory_profile():
    """
    Custom decorator to conditionally apply @profile based on a condition.
    """

    def decorator(func):
        if cfg.PROFILING:
            logging.debug("Started memory profiling")
            return profile(func)
        return func

    return decorator


def get_hashed_password(password: str) -> str:
    """
    Hash a plaintext password using the bcrypt hashing algorithm.
    :param password: The plaintext password to hash.
    :return str : The hashed password as a string.
    """
    return password_context.hash(password)


def verify_password(password: str, hashed_pass: str) -> bool:
    """
    Verify a plaintext password against a previously hashed password.
    :param password: The plaintext password to hash.
    :param hashed_pass: The previously hashed password.
    :return bool : True if the password matches the hashed password, False otherwise.
    """
    return password_context.verify(password, hashed_pass)


def create_access_token(payload) -> dict:
    """
    Create an access token with the provided email.
    Args:
        payload (dict): The payload claims for jwt.
    Returns:
        dict: The dict contains access token.
    """
    expire_time = datetime.utcnow() + timedelta(
        days=365 * const.ACCESS_TOKEN_EXPIRE_TIME
    )
    data = {**payload, "exp": expire_time}
    access_token = jwt.encode(
        data,
        os.environ.get("JWT_SECRET_KEY"),
        algorithm=os.environ.get("JWT_ALGORITHM"),
    )
    return {"access_token": access_token}


class JWTBearer(HTTPBearer):
    """
    Custom FastAPI Bearer Token authentication middleware with JWT validation.
    Args:
        auto_error (bool, optional): Whether to raise an HTTPException on authentication failure. Defaults to True.
    """

    def __init__(self):
        """
        Initialize the JWTBearer instance with auto_error settings.
        """
        super(JWTBearer, self).__init__(auto_error=True)

    async def __call__(self, request: Request):
        """
        Perform the authentication check for a given request.
        Args:
            request (Request): The incoming request.
        Returns:
            str: The JWT token if authentication is successful.
        Raises:
            HTTPException: If authentication fails, an HTTPException is raised with an appropriate status code and message.
        """
        credentials: HTTPAuthorizationCredentials = await super(
            JWTBearer, self
        ).__call__(request)
        if credentials:
            if credentials.scheme == "Bearer":
                return verify_jwt_token(credentials.credentials)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization code",
        )


def verify_jwt_token(token: str) -> dict:
    """
    Verify a JWT token and return its email.
    Args:
        token (str): The JWT token to be verified.
    Returns:
        dict: The decoded payload if the token is valid.
    Raises:
        HTTPException: 403 Forbidden if the token expired.
    """
    try:
        payload = jwt.decode(
            token,
            os.environ.get("JWT_SECRET_KEY"),
            algorithms=[os.environ.get("JWT_ALGORITHM")],
        )
        return AccessToken(**payload)
    except jwt.ExpiredSignatureError:
        raise ex.TokenExpired
    except jwt.InvalidTokenError:
        raise ex.InvalidAccessToken

def get_file_attachment(file):
    """Create a MIMEBase object for the file attachment."""
    try:
        file_content = file.file.read()
        # Get the MIME type based on the file's extension
        mime_type, _ = mimetypes.guess_type(file.filename)
        if mime_type is None:
            mime_type = 'application/octet-stream'  # Default if MIME type cannot be determined
        
        # Create and configure MIMEBase object dynamically
        main_type, sub_type = mime_type.split('/', 1)
        part = MIMEBase(main_type, sub_type)
        part.set_payload(file_content)
        encoders.encode_base64(part)

        # Add headers for the attachment
        part.add_header(
            'Content-Disposition',
            f'attachment; filename="{file.filename}"'
        )
        return part
    except Exception as e:
        raise ValueError(f"Error processing file attachment: {e}")
    
# def send_mail(
#     recipient_email: str,
#     subject: str,
#     body: str,
#     cc_recipient_emails: Optional[List[str]] = [],
#     attachment: UploadFile = None,
#     content_type: str = "plain"
# ):
#     """Send an email with optional CC and file attachment."""
#     # Email configuration
#     smtp_server = os.getenv("SMTP_SERVER")
#     smtp_port = int(os.getenv("SMTP_PORT", 587))  # Default to port 587 for TLS
#     sender_email = os.getenv("EMAIL_USERNAME")
#     sender_password = os.getenv("EMAIL_PASSWORD")

#     # Create the email message
#     msg = MIMEMultipart()
#     msg["From"] = sender_email
#     msg["To"] = recipient_email
#     msg["Subject"] = subject
#     if cc_recipient_emails:
#         msg["Cc"] = ",".join(cc_recipient_emails)

#     # Attach the email body
#     msg.attach(MIMEText(body, content_type))

#     # Attach file if provided
#     if attachment:
#         try:
#             file_name = attachment.filename
#             file_content = attachment.file.read()
#             part = MIMEApplication(file_content, Name=file_name)
#             part['Content-Disposition'] = f'attachment; filename="{file_name}"'
#             msg.attach(part)
#         except ValueError as e:
#             logging.error(f"Attachment Error: {e}")
#             return

#     # Connect to SMTP server and send the email
#     try:
#         with smtplib.SMTP(smtp_server, smtp_port) as server:
#             server.starttls()  # Start TLS encryption
#             server.login(sender_email, sender_password)
#             server.sendmail(
#                 sender_email,
#                 [recipient_email] + cc_recipient_emails,
#                 msg.as_string()
#             )
#     except Exception as e:
#         raise ConnectionError(f"Error sending email: {e}")
    
def send_mail(
    recipient_email: str,
    subject: str,
    body: str,
    cc_recipient_emails: Optional[List[str]] = [],
    attachment: UploadFile = None,
    content_type: str = "plain"
):
    """Send an email using AWS SES with optional CC and attachment from a verified domain."""
    
    # AWS SES client configuration
    ses_client = boto3.client(
        "ses",
        aws_access_key_id=os.getenv("ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("SECRET_ACCESS_KEY"),
        region_name=os.getenv("REGION")
    )
    sender_email = os.getenv("EMAIL_SENDER", "Travel Buddy <no-reply@anchorpoint.in>")

    # Create email message
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg["Subject"] = subject
    if cc_recipient_emails:
        msg["Cc"] = ",".join(cc_recipient_emails)

    # Attach the email body
    msg.attach(MIMEText(body, content_type))

    # Attach file if provided
    if attachment:
        try:
            file_name = attachment.filename
            content_type_guess, _ = mimetypes.guess_type(file_name)
            content_type_guess = content_type_guess or "application/octet-stream"
            main_type, sub_type = content_type_guess.split("/", 1)

            part = MIMEBase(main_type, sub_type)
            part.set_payload(attachment.file.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{file_name}"'
            )
            msg.attach(part)
        except Exception as e:
            logging.error(f"Attachment Error: {e}")
            return

    # Send the email via SES
    try:
        response = ses_client.send_raw_email(
            Source=sender_email,
            Destinations=[recipient_email] + cc_recipient_emails,
            RawMessage={"Data": msg.as_string()}
        )
        logging.info(f"Email sent! Message ID: {response['MessageId']}")
    except Exception as e:
        raise ConnectionError(f"Error sending email via SES: {e}")
def otp_mail_content(otp: int):
    """
    Generate email subject and message content for sending an OTP email.
    Args:
        otp (int): The One-Time Password to include in the email.
    Returns:
        Tuple[str, str]: A tuple containing the email subject and message content.
    """
    return const.OTP_MAIL_SUBJECT, const.OTP_MAIL_BODY.format(otp=otp, contact_support=os.environ.get("CONTACT_SUPPORT"))


def admin_acc_creation_mail_content(
    admin_name: str, admin_email: str, admin_password: str
):
    """
    Generate email subject and message content for notifying the creation of an admin account.
    Args:
        admin_name (str): The name of the newly created admin.
        admin_email (str): The email of the newly created admin.
        admin_password (str): The password of the newly created admin.
        super_admin_name (str): The name of the super admin sending the email.
    Returns:
        Tuple[str, str]: A tuple containing the email subject and message content.
    """
    return (
        const.ADMIN_CREATION_MAIL_SUBJECT,
        const.ADMIN_CREATION_MAIL_BODY.format(
            admin_name=admin_name,
            admin_email=admin_email,
            admin_password=admin_password,
            contact_support=os.environ.get("CONTACT_SUPPORT")
        ),
    )


def vendor_acc_creation_mail_content(
    vendor_name: str, vendor_email: str, vendor_password: str
):
    """
    Generate email subject and message content for notifying the creation of an vendor account.
    Args:
        vendor_name (str): The name of the newly created vendor.
        vendor_email (str): The email of the newly created vendor.
        vendor_password (str): The password of the newly created vendor.
    Returns:
        Tuple[str, str]: A tuple containing the email subject and message content.
    """
    return (
        const.VENDOR_CREATION_MAIL_SUBJECT,
        const.VENDOR_CREATION_MAIL_BODY.format(
            vendor_name=vendor_name,
            vendor_email=vendor_email,
            vendor_password=vendor_password,
            contact_support=os.environ.get("CONTACT_SUPPORT")
        ),
    )


def reset_password_mail_content(admin_name: str, password: str):
    """
    Generate email subject and message content for reseting passsword.
    Args:
        admin_name (str): The name of the newly created admin.
        super_admin_name (str): The name of the super admin sending the email.
    Returns:
        Tuple[str, str]: A tuple containing the email subject and message content.
    """
    return (
        const.UPDATE_PASSWORD_SUBJECT,
        const.UPDATE_PASSWORD_MAIL_BODY.format(
            admin_name=admin_name, password=password,
            contact_support=os.environ.get("CONTACT_SUPPORT")
        ),
    )


@transactional
def update_login_status(model: Base, email: str) -> None:
    """
    Update the login status of a Organizer in the database.
    Args:
        db (Session): The SQLAlchemy database session.
        email (str): The email of the organizer.
    """
    filter_criteria = [model.email == email]
    records_to_update = {"is_verified": True, "last_logged_in": current_utc_time()}
    result = crud.update_records(model, filter_criteria, records_to_update)
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="update")


def generate_password(length=12):
    """
    Generate a random password that meets certain constraints.
    Args:
    length (int): The length of the password to generate (default is 12).
    Returns:
        str: A random password that includes at least one lowercase letter, one uppercase letter, one digit.
    """
    characters = string.ascii_letters + string.digits
    password = "".join(random.choice(characters) for _ in range(length))
    return password


def object_as_dict(obj):
    """
    Convert a SQLAlchemy object to a dictionary, excluding null values.
    Parameters:
    - obj: SQLAlchemy object
        The object to be converted to a dictionary.
    Returns:
    dict
        A dictionary where keys are column names and values are corresponding
        attribute values of the SQLAlchemy object. Null values are excluded.
    """
    return {
        c.key: getattr(obj, c.key)
        for c in inspect(obj).mapper.column_attrs
        if getattr(obj, c.key) is not None
    }


def object_to_json(obj):
    obj = object_as_dict(obj)
    return json.dumps(obj, default=str)

def convert_utc_to_local_timezone(column, local_tz=const.TARGET_TZ):
    return func.timezone(local_tz, func.timezone(const.SOURCE_TZ, func.cast(column, TIMESTAMP)))

def format_booking_datetime(
    booking_datetime,
    format_string,
    source_timezone=const.SOURCE_TZ,
    target_timezone=const.TARGET_TZ,
):
    converted_datetime = func.timezone(
        target_timezone,
        func.timezone(source_timezone, func.cast(booking_datetime, TIMESTAMP)),
    )
    return func.to_char(converted_datetime, format_string)


def get_sms_message_body(guest, payload, message_body):
    return message_body.format(
        guest_name=guest["name"],
        pickup_location=guest["source"]["address"],
        driver_name=payload["driver"]["name"],
        driver_mobile=payload["driver"]["primary_mobile"],
        vehicle_model=payload["vehicle_model"],
        vehicle_no=payload["driver"]["vehicle_no"],
    )


def create_twilio_client():
    account_sid = os.getenv("SMS_ACCOUNT_SID")
    auth_token = os.getenv("SMS_AUTH_TOKEN")
    return Client(account_sid, auth_token)


@transactional
def send_immediate_sms(client, payload, message_body):
    try:
        messaging_service_id = os.getenv("MESSAGING_SERVICE_ID")
        for guest in payload.get("guests"):
            message = client.messages.create(
                to=guest["mobile"],
                messaging_service_sid=messaging_service_id,
                body=get_sms_message_body(guest, payload, message_body),
            )
        return {"message": "SMS sent successfully"}
    except TwilioRestException as e:
        err_msg = str(e)
        logging.error(err_msg)
        raise ex.SMSException(err_msg)


@transactional
def store_message_id(guest_id, message_id):
    filter_criteria = [BookingLogs.guest_id == guest_id]
    records_to_update = {"message_id": message_id}
    return crud.update_records(
        BookingLogs,
        filter_criteria=filter_criteria,
        records_to_update=records_to_update,
    )


@transactional
def schedule_sms(client, payload, message_body, scheduled_time):
    try:
        messaging_service_id = os.getenv("MESSAGING_SERVICE_ID")
        for guest in payload.get("guests"):
            sms_body = get_sms_message_body(guest, payload, message_body)
            if not guest["message_id"]:
                message = client.messages.create(
                    send_at=scheduled_time,
                    schedule_type="fixed",
                    to=guest["mobile"],
                    messaging_service_sid=messaging_service_id,
                    body=sms_body,
                )
                store_message_id(guest["id"], message.sid)
            else:
                message = client.messages(guest["message_id"]).update(body=sms_body)
        return {"message": "SMS scheduled successfully"}
    except TwilioRestException as e:
        err_msg = str(e)
        logging.error(err_msg)
        raise ex.SMSSSchedulingError(err_msg)


def calculate_time_difference_in_hours(booking_datetime):
    current_utc_timestamp = datetime.now(pytz.utc)
    time_difference_seconds = (booking_datetime - current_utc_timestamp).total_seconds()
    time_difference_hours = time_difference_seconds / 3600
    return time_difference_hours


@transactional
def send_sms(client, payload):
    hours = calculate_time_difference_in_hours(payload["booking_datetime"])
    message_body = const.SMS_BODY
    sms_delay = const.SMS_DELAY_IN_HOURS

    if hours < sms_delay:
        return send_immediate_sms(client, payload, message_body)
    else:
        formatted_time = payload["booking_datetime"] - timedelta(hours=2)
        scheduled_time = formatted_time.replace(tzinfo=None)
        return schedule_sms(client, payload, message_body, scheduled_time)


def upload_and_generate_presigned_url(
    image, file_name, content_type="image/jpeg", bucket_name=os.getenv("BUCKET_NAME")
):
    s3 = boto3.client(
        "s3",
        region_name=os.getenv("REGION"),
        aws_access_key_id=os.getenv("ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("SECRET_ACCESS_KEY"),
    )
    s3.put_object(
        Bucket=bucket_name,
        Key=file_name,
        Body=image,
        ContentType=content_type,
        ContentDisposition="string",
    )
    return s3.generate_presigned_url(
        "get_object", Params={"Bucket": bucket_name, "Key": file_name}
    )


def send_push_notification_message(
    title: str, body: str, token: str, data: dict = None
):
    try:
        message = messaging.Message(
            token=token,
            notification=messaging.Notification(title=title, body=body),
            data=data,
        )
        messaging.send(message)
    except firebase_admin.messaging.SenderIdMismatchError:
        logging.error("Mismatch SenderId '{token}'")
        delete_device_info(token=token)
    except firebase_admin.messaging.ThirdPartyAuthError:
        logging.error(const.APN_CERTIFICATE_INVALID)
    except firebase_admin.messaging.UnregisteredError:
        logging.error("FCM device token expired '{token}'")
        delete_device_info(token=token)

def send_multicast_message(title: str, body: str, data: dict, tokens: List[str]):
    try:
        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(title=title, body=body),
            data=data,
        )
        messaging.send_multicast(message)
    except firebase_admin.messaging.UnregisteredError as err:
        raise ex.InvalidDeviceToken


def get_ist_timestamps():
    """
    Get timestamps in Indian Standard Time (IST).
    Returns:
        tuple: A tuple containing:
            - from_timestamp_ist_str (str): Formatted string for the current IST time.
            - to_timestamp_ist_str (str): Formatted string for the end of the day in IST.
    """
    # Set the timezone to IST
    ist_timezone = pytz.timezone(const.TARGET_TZ)

    # Get the current timestamp
    current_timestamp = int(datetime.now().timestamp())

    # Convert the current timestamp to a datetime object in the IST timezone
    current_datetime_ist = datetime.fromtimestamp(
        current_timestamp, tz=timezone.utc
    ).astimezone(ist_timezone)

    # Set the time to the end of the day in IST
    end_of_day_ist = datetime(
        current_datetime_ist.year,
        current_datetime_ist.month,
        current_datetime_ist.day,
        23,
        59,
        59,
    )
    end_of_day_ist = ist_timezone.localize(end_of_day_ist)

    # Format the timestamps as strings
    from_timestamp_ist_str = current_datetime_ist.strftime("%d-%m-%Y %H:%M:%S")
    to_timestamp_ist_str = end_of_day_ist.strftime("%d-%m-%Y %H:%M:%S")

    return from_timestamp_ist_str, to_timestamp_ist_str


def get_current_date():
    ist_timezone = pytz.timezone(const.TARGET_TZ)
    current_date_time_ist = datetime.now(ist_timezone)
    # Extract only the date component
    return current_date_time_ist.strftime("%d-%m-%Y")


def upload_to_s3(local_file, object_name, bucket=os.getenv("BUCKET_NAME")):
    s3 = initialize_s3_client()

    try:
        s3.upload_file(local_file, bucket, object_name)
        logging.info(f"Upload successful: {local_file} to {bucket}/{object_name}")
    except BotoCoreError as e:
        logging.error(f"BotoCoreError: {e}")


def get_s3_public_url(
    object_name, bucket=os.getenv("BUCKET_NAME"), region=os.getenv("REGION")
):
    return const.S3_PUBLIC_URL.format(
        bucket=bucket,
        region=region,
        object_name=object_name,
    )

def list_s3_objects(bucket_name: str, folder: str):
    """List all objects in an S3 folder."""
    try:
        objects = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=folder)
        if "Contents" in objects:
            return objects["Contents"]
        return []
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not found.")
    except PartialCredentialsError:
        raise HTTPException(status_code=500, detail="Incomplete AWS credentials.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing S3 objects: {e}")

def generate_presigned_url(bucket_name: str, key: str, expiration: int = 3600):
    """Generate a presigned URL for an S3 object."""
    try:
        return s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': key},
            ExpiresIn=expiration
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating presigned URL: {e}")

def fetch_s3_folder_contents(folder_path, bucket_name):
    """Fetch the list of objects in the S3 folder with presigned URLs."""
    try:
        objects = list_s3_objects(bucket_name, folder_path)
        
        # Generate presigned URLs for each object
        response = []
        for obj in objects:
            file_key = obj["Key"]
            # Skip the folder placeholder (common in S3)
            if file_key == folder_path:
                continue
            
            presigned_url = generate_presigned_url(bucket_name, file_key)
            response.append({"name": file_key.replace(folder_path, ""), "url": presigned_url})
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_presigned_urls_for_folder(folder_prefix, bucket=os.getenv("BUCKET_NAME"), expires_in_seconds=300):
    s3 = initialize_s3_client()

    # List objects in the folder
    response = s3.list_objects_v2(
        Bucket=bucket,
        Prefix=folder_prefix
    )

    # Generate presigned URLs for each object in the folder
    presigned_urls = []
    for obj in response.get('Contents', []):
        key = obj['Key']
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in_seconds
        )
        presigned_urls.append(presigned_url)

    return presigned_urls

def delete_objects_in_folder(folder_prefix, filenames=None, bucket_name=os.getenv("BUCKET_NAME")):
    """
    Deletes objects from an S3 folder.

    Args:
        folder_prefix (str): The folder prefix in the S3 bucket (e.g., "my-folder/").
        filenames (list, optional): List of specific filenames to delete. Defaults to None.
        bucket_name (str): Name of the S3 bucket.

    Returns:
        dict: Details of the deleted objects or a message if no objects were deleted.
    """
    try:
        # List all objects in the folder
        objects = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=folder_prefix)
        if 'Contents' in objects:  # Check if there are objects in the folder
            if filenames:  # Delete only the specified filenames
                keys = [{"Key": f"{folder_prefix}/{filename}"} for filename in json.loads(filenames)]
            else:  # Delete all objects in the folder
                keys = [{"Key": obj["Key"]} for obj in objects["Contents"]]

            # Perform the deletion
            response = s3_client.delete_objects(Bucket=bucket_name, Delete={"Objects": keys})
            deleted_keys = [item["Key"] for item in response.get("Deleted", [])]

            return {
                "message": f"{len(deleted_keys)} objects deleted successfully.",
                "deleted_objects": deleted_keys,
            }
        else:
           return {"message": "No objects found in the specified folder."}
    except Exception as e:
        logging.error(str(e))
        raise e

def generate_presigned_object_url(bucket_name, object_key, expiration=300):
    s3 = initialize_s3_client()

    presigned_url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket_name, 'Key': object_key},
        ExpiresIn=expiration
    )
    return presigned_url

def get_latest_object_after_time(folder_prefix, time_threshold_str=None, bucket_name=os.getenv("BUCKET_NAME")):
    s3 = initialize_s3_client()

    # Parse the input time threshold string into a datetime object if provided
    time_threshold = None
    if time_threshold_str:
        try:
            time_threshold = datetime.strptime(time_threshold_str, '%Y-%m-%d %H:%M:%S').replace(tzinfo=timezone.utc)
        except ValueError as e:
            logging.error(f"Invalid time format: {e}")
            return None
    
    try:
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder_prefix)
        objects = response.get('Contents', [])

        if time_threshold:
            # Filter objects uploaded after the time threshold
            filtered_objects = [obj for obj in objects if obj['LastModified'].replace(tzinfo=timezone.utc) > time_threshold]
        else:
            # No time threshold provided, consider all objects
            filtered_objects = objects
        
        if filtered_objects:
            # Sort filtered objects by LastModified timestamp in descending order
            sorted_objects = sorted(filtered_objects, key=lambda x: x['LastModified'], reverse=True)
        
            # Extract bucket name and object key
            object_key = sorted_objects[0]['Key']

            # Generate presigned URL
            presigned_url = generate_presigned_object_url(bucket_name, object_key)
            return presigned_url
        
        else:
            return None 
        
    except Exception as e:
        logging.error(f"Error retrieving latest object: {e}")
        return None


def initialize_s3_client():
    try:
        s3 = boto3.client(
            "s3",
            region_name=os.getenv("REGION"),
            aws_access_key_id=os.getenv("ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("SECRET_ACCESS_KEY"),
        )
        logging.info("S3 client initialized successfully")
        return s3
    except Exception as e:
        logging.error(f"Error initializing S3 client: {e}")
        return None


def download_s3_objects_in_subfolder(
    folder_path, localFilePath, bucket_name=os.getenv("BUCKET_NAME")
):
    try:
        s3 = initialize_s3_client()
        content_type_mapping = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'application/pdf': '.pdf',
        }
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder_path)
        if not os.path.exists(localFilePath):
            os.makedirs(localFilePath)

        downloaded_files = []
        for object in response.get("Contents", []):
            head_response = s3.head_object(Bucket=bucket_name, Key=object["Key"])
            content_type = head_response.get('ContentType')     
            if object["Size"]:
                filename = f"{localFilePath}/{object['Key'].split('/')[-1]}{content_type_mapping[content_type]}"
                s3.download_file(
                    Filename=filename, Bucket=bucket_name, Key=object["Key"]
                )
                downloaded_files.append(filename)
        return downloaded_files

    except Exception as e:
        logging.error(f"Error downloading S3 objects in subfolder: {e}")

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def generate_firebase_access_token(user: Union[Coordinator, Organizer]):
    try:
        role = Role.COORDINATOR.value if isinstance(user, Coordinator) else Role.ORGANIZER.value
        uid = str(uuid.uuid4())
        custom_claims = { "role": role }
        token = auth.create_custom_token(uid, custom_claims)
        return {"firebase_access_token": token}
    except jwt.exceptions.InvalidAlgorithmError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid access token"
        )
    
@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def verify_firebase_access_token(user: Union[Coordinator, Organizer], request: VerifyRequest):
    try:
        decoded_token = auth.verify_id_token(request.token)
        return {"uid": decoded_token["uid"], "decoded_token": decoded_token}
    except Exception as e:
        logging.error(e)
        raise ex.InvalidFirebaseAccessToken
    
def get_access_token(token: str):
    try:
        secret_key = os.environ.get("JWT_SECRET_KEY")
        algorithm = os.environ.get("JWT_ALGORITHM")
        decode_token = jwt.decode(
            jwt=token,
            key=secret_key,
            algorithms=algorithm,
            options={"verify_exp": False},
        )
        payload = {"email": decode_token.get("email"), "role": decode_token.get("role")}
        return create_access_token(payload)
    except jwt.exceptions.InvalidAlgorithmError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid access token"
        )

def build_cost_centre_json():
    return func.json_build_object(
        "id", CostCentre.id, 
        "code", CostCentre.code, 
        "gstin_no", CostCentre.gstin_no, 
        "address", CostCentre.address
    )

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_cost_centres(user_record: Union[Coordinator, Organizer]) -> dict:
    result = crud.select_records(
        CostCentre,
        select_cols=[build_cost_centre_json()],
        order_by=[CostCentre.code]
    ).all()
    flattened_data = list(chain.from_iterable(result))
    return {"cost_centres": flattened_data}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.COORDINATOR.value, Role.ORGANIZER.value])
def get_cost_centre_by_id(user_record: Union[Coordinator, Organizer], cost_centre_id: int) -> dict:
    result = crud.select_records(
        CostCentre,
        select_cols=[build_cost_centre_json()],
        filter_conditions=[CostCentre.id == cost_centre_id]
    ).scalar()
    if not result:
        raise ex.RecordNotFound(model=f"Cost centre with id '{cost_centre_id}'")
    return {"cost_centre": result}

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def create_cost_centre(organizer: Organizer, cost_centre_model: CostCentreModel) -> dict:
    try:
        records_to_insert = cost_centre_model.dict()
        cost_centre_record = crud.insert_record(CostCentre, **records_to_insert)
        if not cost_centre_record:
            raise ex.DatabaseOperationFailed(action="insert")
        records_to_insert["id"] = cost_centre_record.id
        return {"cost_centre": records_to_insert, "message": "Successfully created new cost centre record"}
    except exc.IntegrityError as err:
        logging.error(err)
        raise ex.RecordExists(field_name="cost centre", field_value=cost_centre_model.code)

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def update_cost_centre_by_id(organizer: Organizer, cost_centre_id: int, update_cost_centre_model: CostCentreModel) -> dict:
    try:
        cost_centre_record = app_utils.get_model_record_by_id(CostCentre, cost_centre_id)
        
        if not cost_centre_record:
            raise ex.RecordNotFound(model=f"Cost centre with id '{cost_centre_id}'")
        
        filter_criteria = [CostCentre.id == cost_centre_record.id]
        records_to_update = update_cost_centre_model.dict()
        result = crud.update_records(CostCentre, filter_criteria, records_to_update)

        if not result.rowcount:        
            raise ex.DatabaseOperationFailed(action="update")
        
        return {"message": f"Successfully updated cost centre record with id '{cost_centre_id}'."}

    except exc.IntegrityError as err:
        logging.error(err)
        raise ex.RecordExists(field_name="cost centre", field_value=update_cost_centre_model.code)
    
@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def delete_cost_centre_by_id(organizer: Organizer, cost_centre_id: int) -> dict:
    cost_centre_record = app_utils.get_model_record_by_id(CostCentre, cost_centre_id)
    
    if not cost_centre_record:
        raise ex.RecordNotFound(model=f"Cost centre with id '{cost_centre_id}'")
    
    filter_criteria = [CostCentre.id == cost_centre_record.id]
    result = crud.delete_record(CostCentre, filter_criteria)
    
    if not result.rowcount:
        raise ex.DatabaseOperationFailed(action="delete")
    
    return {"message": f"Successfully deleted cost centre record with id '{cost_centre_id}'."}

def make_google_api_request(request, params):
    response = requests.get(request, params=params)
    if response.status_code == 200:
        data = response.json()
        status = data.get("status")
        if status == "OK":
            return data
        elif status == "REQUEST_DENIED":
            raise ex.GoogleMapsRequestDenined
    err_msg = data.get("error_message")
    logging.info(err_msg)
    raise ex.GoogleMapsException(err_msg=err_msg)

def extract_name_from_email(email):
    # Extracting username part before '@'
    username = email.split('@')[0]

    # Removing any dots and numbers from the username
    username = re.sub(r'\d+', '', username)  # Remove numbers
    username = username.replace('.', ' ')     # Replace dots with spaces
    # Capitalizing the first letter of each word
    name_parts = username.split()
    name_parts_capitalized = [part.capitalize() for part in name_parts]

    # Joining the parts to form the name
    name = ' '.join(name_parts_capitalized)
    
    return name


def send_message(messaging_type, to, body, content_sid, content_variables, callback_url = None):

    client = create_twilio_client()
    if messaging_type == "whatsapp":
        message = client.messages.create(
                content_sid=content_sid,
                content_variables=json.dumps(content_variables),
                from_=f'whatsapp:{os.environ.get("SMS_FROM")}',
                body=body,
                to=f'whatsapp:{to}',
                status_callback=callback_url,
                )
        logging.info(f'Whatsapp SMS has been sent to {to}')
    else:
        message = client.messages.create(
                to=to,
                messaging_service_sid=os.getenv("MESSAGING_SERVICE_ID"),
                body=body,
            )
        logging.info(f'SMS has been sent to {to}')
        
    return message.sid


@transactional
def get_driver_sms_payload(message_sid):
    join_conditions = [(Driver, Driver.id == Booking.driver_id)]
    filter_condition = [Driver.message_sid == message_sid]
    return crud.select_records(
        primary_table=Booking,
        filter_conditions=filter_condition,
        join_conditions=join_conditions,
    ).scalar()


@transactional
def get_guest_sms_payload(message_sid):
    join_conditions = [(BookingLogs, BookingLogs.booking_id == Booking.id),
                       (Driver, Driver.id == Booking.driver_id)]
    filter_condition = [BookingLogs.guest_message_sid == message_sid]
    return crud.select_records(
        primary_table=Booking,
        filter_conditions=filter_condition,
        join_conditions=join_conditions,
    ).scalar()

def rows_to_dict_list(columns, result):
    response = []
    for row in result:
        row_dict = {}
        for idx, column_name in enumerate(columns):
            row_dict[column_name] = row[idx]
        response.append(row_dict)
    return response

@transactional
def is_record_present(table, column_name, field_value, field_id=None):
    column = getattr(table, column_name)
    filter_conditions = [column.ilike(field_value), table.is_active == True]
    
    if field_id:
        filter_conditions.append(table.id != field_id)
    
    record = crud.select_records(
        primary_table=table,
        filter_conditions=filter_conditions,
    ).first()
    
    return record

@transactional
def upsert_model_record(model, fields, record_id = None):
    """
    Generic method to upsert (insert or update) a record in the database.
    Params:
        model : The SQLAlchemy model to operate on.
        fields : Fields to insert or update in the record.
        record_id: ID of the record to update. Defaults to None.
    Returns:
        int: The ID of the upserted record (updated or newly inserted).
    """
    cur_utc_time = current_utc_time()
    fields["mdate"] = cur_utc_time

    if record_id:
        # Update the existing record
        condition = [model.id == record_id]
        crud.update_records(model, condition, fields)
    else:
        # Insert a new record
        fields["cdate"] = cur_utc_time 
        record = crud.insert_record(model, **fields)
        record_id = record.id
    
    return record_id

def apply_sort_condition(column, order):
   return desc(column) if order == "desc" else column

def build_sort_criteria(sort_field_mapping, sort):
   order_by = []
   if sort:
      for ele in sort:
         column, order = (ele.split(":") if ":" in ele else (ele, "asc"))
         # Check if the column is in the mapping dictionary
         if column in sort_field_mapping:
            order_by.append(apply_sort_condition(sort_field_mapping[column], order))
      
   return order_by

class BookingLogger:
    def __init__(self, user, booking_id, booking_type):
        self.user_role = self._get_user_role(user)
        self.user_name = user.name
        self.booking_id = booking_id
        self.booking_type = booking_type
        self.cur_utc_time = current_utc_time()
        self.booking_activity_logs = []
        self.route_recalculation_flag = False

    def trigger_route_recalculation(self):
        """
        Sets the route recalculation flag to True, indicating that 
        a recalculation of the optimal route has been triggered.
        """
        self.route_recalculation_flag = True

    def _get_user_role(self, user):
        """Helper method to determine the user role."""
        if isinstance(user, Coordinator):
            return f"{Role.COORDINATOR.value}_name"
        return f"{Role.ORGANIZER.value}_name"
    
    def log_change(self, event, **kwargs):
        """Logs changes made to the booking."""
        meta_data = {
            self.user_role: self.user_name,
            **kwargs
        }
        self.booking_activity_logs.append({
            "booking_id": self.booking_id,
            "event": event,
            "cdate": self.cur_utc_time,
            "booking_type": self.booking_type,
            "meta_data": meta_data
        })
   
    def get_booking_activity_log(self):
        """Get booking activity logs."""
        return self.booking_activity_logs



@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def create_tariff_plan(organizer: Organizer, tariff_plan_model: TariffPlanSchema):
    try:
        tariff_plan_record = crud.insert_record(
            model=TariffPlan,
            package_id=tariff_plan_model.package_id,
            vehicle_id=tariff_plan_model.vehicle_id,
            city_id=tariff_plan_model.city_id,
            cost=tariff_plan_model.cost,
            extra_distance_cost=tariff_plan_model.extra_distance_cost,
            extra_hour_cost=tariff_plan_model.extra_hour_cost,
        )
        return {
            "message": "Tariff plan created successfully",
            "id": tariff_plan_record.id 
        }   
    except IntegrityError:
        raise ex.RecordExists(msg="A tariff plan already exists for the given city and package.")
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500,detail=f"Database error:{str(error)}")
    
def build_tariff_plan_json():
    return func.jsonb_build_object(
        "id", TariffPlan.id,
        "package", func.jsonb_build_object("id", Package.id, "name", Package.name, "distance_kms", Package.distance_kms, "interval_hrs", Package.interval_hrs),
        "vehicle", func.jsonb_build_object("id", Vehicle.id, "name", Vehicle.name, "vehicle_model", VehicleModel.vehicle_model),
        "city", func.jsonb_build_object("id", VendorCity.id, "name", VendorCity.city),
        "cost", TariffPlan.cost,
        "extra_distance_cost", TariffPlan.extra_distance_cost,
        "extra_hour_cost", TariffPlan.extra_hour_cost,
    )

def get_tariff_plan_by_filters(city_id: int, package_id: int, vehicle_id: int):
    select_cols = [build_tariff_plan_json().label("tariff_plan")]
    join_conditions = [
        (Package, TariffPlan.package_id == Package.id),
        (VendorCity, TariffPlan.city_id == VendorCity.id),
        (Vehicle, TariffPlan.vehicle_id == Vehicle.id),
        (VehicleModel, Vehicle.vehicle_model_id == VehicleModel.id)
    ]
    filter_conditions = [TariffPlan.city_id == city_id, TariffPlan.package_id == package_id, TariffPlan.vehicle_id == vehicle_id]
    query = crud.select_records(
        TariffPlan,
        select_cols=select_cols,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions
    )
    return query.scalar()

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_all_tariff_plans(organizer: Organizer, city_id = None, package_id = None):
    try:
        select_cols = [func.jsonb_agg(build_tariff_plan_json()).label("tariff_plan")]
        join_conditions = [
            (Package, TariffPlan.package_id == Package.id),
            (VendorCity, TariffPlan.city_id == VendorCity.id),
            (Vehicle, TariffPlan.vehicle_id == Vehicle.id),
            (VehicleModel, Vehicle.vehicle_model_id == VehicleModel.id)
        ]

        filter_conditions = []
        if city_id:
            filter_conditions.append(TariffPlan.city_id == city_id)
        if package_id:
            filter_conditions.append(TariffPlan.package_id == package_id)
        
        query = crud.select_records(
            TariffPlan,
            select_cols=select_cols,
            join_conditions=join_conditions,
            filter_conditions=filter_conditions
        )

        return {"tariff_plans": query.scalar() or []}
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500,detail=f"Database error:{str(error)}")


@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_tariff_packages_vehicles(organizer: Organizer, city_id = None):
    # Build query with join to fetch package & vehicle details
    join_conditions = [
        (Package, TariffPlan.package_id == Package.id),
        (VendorCity, TariffPlan.city_id == VendorCity.id),
        (Vehicle, TariffPlan.vehicle_id == Vehicle.id),
        (VehicleModel, Vehicle.vehicle_model_id == VehicleModel.id)
    ]
    filter_conditions = []
    if city_id:
        filter_conditions.append(TariffPlan.city_id == city_id)

    query = crud.select_records(
        TariffPlan,
        join_conditions=join_conditions,
        filter_conditions=filter_conditions
    )
    rows = query.all()

    # Group data: package -> vehicles
    package_map = defaultdict(lambda: {"package": None, "vehicles": []})

    for row in rows:
        # Add package info once
        package = row.package
        vehicle = row.vehicle

        if not package_map[package.id]["package"]:
            package_map[package.id]["package"] = {
                "id": package.id,
                "name": package.name,
            }

        # Add vehicle info (avoid duplicates)
        if not any(v["id"] == vehicle.id for v in package_map[package.id]["vehicles"]):
            package_map[package.id]["vehicles"].append({
                "id": vehicle.id,
                "name": vehicle.name,
            })

    # Convert dict to list
    response = list(package_map.values())
    return response

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def get_tariff_plan_by_id(organizer: Organizer, tariff_plan_id: int):
    try:
        select_cols = [build_tariff_plan_json()]
        join_conditions = [
            (Package, TariffPlan.package_id == Package.id),
            (VendorCity, TariffPlan.city_id == VendorCity.id),
            (Vehicle, TariffPlan.vehicle_id == Vehicle.id),
            (VehicleModel, Vehicle.vehicle_model_id == VehicleModel.id)
        ]
        filter_conditions = [TariffPlan.id == tariff_plan_id]
        
        query = crud.select_records(
            TariffPlan,
            select_cols=select_cols,
            join_conditions=join_conditions,
            filter_conditions=filter_conditions
        )
        row = query.scalar()
        if not row:
            raise ex.RecordNotFound(model="Tarrif plan")
        
        return {"tariff_plan": row}
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500,detail=f"Database error:{str(error)}")

@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])
def update_tariff_plan_by_id(
    organizer: Organizer,
    tariff_plan_id: int,
    update_tariff_plan_data: UpdateTariffPlanSchema,
):
    try:
        tariff_plan_record = app_utils.get_model_record_by_id(TariffPlan, tariff_plan_id)
        filter_criteria = [TariffPlan.id == tariff_plan_id]
        records_to_update = update_tariff_plan_data.model_dump(exclude_unset=True)
        result = crud.update_records(
            TariffPlan, 
            filter_criteria=filter_criteria, 
            records_to_update=records_to_update
            )
        if not result.rowcount:
            raise ex.DatabaseOperationFailed(action="update")
        
        return {
            "message": "Tariff plan updated successfully",
            "id": tariff_plan_id 
        }
    except IntegrityError:
        raise ex.RecordExists(msg="A tariff plan already exists for the given city and package.")
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500,detail=f"Database error:{str(error)}")
    
@transactional
@verify_jwt_role_and_email(allowed_roles=[Role.ORGANIZER.value])    
def delete_tariff_plan(organizer: Organizer, tariff_plan_id: int):
    try:
        tariff_plan_record = app_utils.get_model_record_by_id(TariffPlan, tariff_plan_id)
        filter_criteria = [TariffPlan.id == tariff_plan_id]
        result=crud.delete_record(
            TariffPlan,
            filter_criteria=filter_criteria
        )
        if not result.rowcount:
            raise ex.DatabaseOperationFailed(action="delete")
        
        return {
            "message": "Tariff plan deleted successfully",
            "id": tariff_plan_id 
        }
            
    except SQLAlchemyError as error:
        raise HTTPException(status_code=500,detail=f"Database error:{str(error)}")
   
