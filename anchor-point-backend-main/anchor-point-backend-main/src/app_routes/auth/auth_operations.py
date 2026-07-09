from fastapi import APIRouter, status, BackgroundTasks
from app_routes.auth import utils
from app_routes.auth import schema

router = APIRouter()


@router.post("/forgot-password", status_code=status.HTTP_200_OK, response_model=dict)
def forgot_password(background_tasks: BackgroundTasks, forgot_password_request: schema.ForgotPasswordRequest):
    return utils.forgot_password(background_tasks, forgot_password_request)

@router.post("/reset-password", status_code=status.HTTP_200_OK, response_model=dict)
def reset_password(password_reset_request: schema.PasswordResetRequest):
    return utils.reset_password(password_reset_request)

@router.post("/validate", status_code=status.HTTP_200_OK, response_model=dict)
def validate_token(request: schema.ValidateToken):
    return utils.validate_token(request.token)
