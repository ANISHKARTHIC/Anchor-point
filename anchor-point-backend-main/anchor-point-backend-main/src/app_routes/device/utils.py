from app_models import crud
from app_models.models import Device
from app_utils.decorators import transactional
from app_utils import utils as app_utils
from app_utils import exception as ex
from itertools import chain
from logger import logger as logging
from common_utils import utils as cutils
from common_utils import obj_to_dict
from twilio.base.exceptions import TwilioRestException

@transactional
def get_device_info_by_fcm_token(email: str, role: str, token: str):
    return crud.select_records(
        Device, select_cols=[Device.fcm_token],filter_conditions=[Device.email == email, Device.role == role, Device.fcm_token == token]
    ).first()


@transactional
def get_device_info(**kwargs):
    filter_cols = {"email": Device.email, "role": Device.role}
    filter_conditions = [filter_cols[key] == value for key, value in kwargs.items()]
    devices = crud.select_records(
        Device, select_cols=[Device.fcm_token],filter_conditions=filter_conditions
    ).all()
    return list(chain.from_iterable(devices))

@transactional
def create_device_info(email: str, role: str, device_type: str, fcm_token: str, expired_fcm_token: str = None):
    model = app_utils.get_model_by_role(role)

    if not model:
        raise ex.InvalidRole

    if not app_utils.is_valid_email_for_role(email, model):
        raise ex.EmailNotFound
    
    if not get_device_info_by_fcm_token(email, role, fcm_token):
        records_to_insert = {
            "email": email,
            "role": role,
            "device_type": device_type,
            "fcm_token": fcm_token,
        }
        result = crud.insert_record(Device, **records_to_insert)
        logging.info(f"{email} - {role} - {device_type} : New device token added")
        if not result:
            raise ex.DatabaseOperationFailed(action="insert")
    
    if expired_fcm_token:
        logging.info(f"{email} - {role} - {device_type} : Expired device token removed")
        delete_device_info(expired_fcm_token)

    return {"message": "Successfully created new device"}

@transactional
def delete_device_info(token):
    filter_criteria = [Device.fcm_token == token]
    crud.delete_record(Device, filter_criteria=filter_criteria) 
    logging.info(f"'{token}' removed sucessfully")
