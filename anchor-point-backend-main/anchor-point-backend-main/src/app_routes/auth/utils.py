import os
import pytz
import secrets
from datetime import datetime, timedelta
from typing import Union
from fastapi import BackgroundTasks
from app_models import crud
from app_models import models
from app_schemas.schema import Role
from app_utils.decorators import transactional
from app_routes.auth import schema
from app_utils import exception as ex
from common_utils import utils as cutils
from app_configs import constants as const

def generate_reset_token():
    return secrets.token_urlsafe(64)

def get_model_by_role(role: str):
    return models.Organizer if  role == Role.ORGANIZER.value else models.Vendor

@transactional
def validate_token(token: str):
    get_password_reset_token(token)
    return {"message": "The reset password link is active"}

@transactional
def forgot_password(background_tasks: BackgroundTasks, forgot_password_request: schema.ForgotPasswordRequest):
    cur_utc_time = cutils.current_utc_time()
    email = forgot_password_request.email
    role = forgot_password_request.role
    model = get_model_by_role(role)
    response = {"message": "Password reset mail has sent"}
    user = crud.select_records(model, filter_conditions=[model.email == email]).first()
    if not user:
        return response
    
    reset_password_token = generate_reset_token()
    create_or_update_password_reset_token(email, role, reset_password_token, cur_utc_time)
    send_reset_password_mail(background_tasks=background_tasks, email=email, user_name=user.name, reset_password_token=reset_password_token)
    return response

def send_reset_password_mail(background_tasks: BackgroundTasks, email: str, user_name: str, reset_password_token: str):
    subject = "Password reset requested"
    api_url = os.getenv('API_URL')
    reset_password_link = const.RESET_PASSWORD_URL.format(api_url=api_url, reset_password_token=reset_password_token)
    reset_password_mail_body = const.RESET_PASSWORD_BODY.format(user=user_name, reset_password_link=reset_password_link)
    background_tasks.add_task(cutils.send_mail, recipient_email=email, subject=subject, body=reset_password_mail_body)

@transactional
def reset_password(password_reset_request: schema.PasswordResetRequest):
    cur_utc_time = cutils.current_utc_time()
    token = password_reset_request.token
    reset_token_record = get_password_reset_token(token)
    model = get_model_by_role(reset_token_record.role)
    update_user_password(model, reset_token_record.email, password_reset_request.password, cur_utc_time)
    delete_password_reset_token(password_reset_request.token)
    return {"message": "Passsword reset successfully"}

@transactional
def get_password_reset_token(token: str):
    filter_conditions = [models.PasswordResetTokens.token == token]
    record =  crud.select_records(models.PasswordResetTokens, filter_conditions=filter_conditions).first()
    if not record or datetime.now(pytz.UTC) - record.mdate > timedelta(minutes=5):
        raise ex.ResetPasswordLinkExpired
    return record

@transactional
def delete_password_reset_token(token: str):
    filter_criteria = [models.PasswordResetTokens.token == token]
    crud.delete_record(models.PasswordResetTokens, filter_criteria=filter_criteria)

@transactional
def create_or_update_password_reset_token(email:str, role:str, reset_password_token: str, cur_utc_time: datetime):
    filter_conditions = [
        models.PasswordResetTokens.email == email, 
        models.PasswordResetTokens.role == role
    ]
    reset_token_record = crud.select_records(models.PasswordResetTokens, filter_conditions=filter_conditions).first()
    
    if not reset_token_record:
        crud.insert_record(models.PasswordResetTokens, email=email, role=role, token=reset_password_token, cdate=cur_utc_time, mdate=cur_utc_time)
    else:
        records_to_update = {"token": reset_password_token, "mdate": cur_utc_time}
        crud.update_records(models.PasswordResetTokens, filter_criteria=filter_conditions, records_to_update=records_to_update)

@transactional
def update_user_password(model: Union[models.Organizer, models.Vendor], email: str, new_password: str, cur_utc_time: datetime):
    filter_criteria = [model.email == email]
    hash_password = cutils.get_hashed_password(new_password)
    records_to_update = {"password": hash_password, "mdate": cur_utc_time}
    crud.update_records(model, filter_criteria=filter_criteria, records_to_update=records_to_update)