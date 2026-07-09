from fastapi import status, HTTPException
from pydantic import BaseModel, model_validator

from app_schemas.schema import PasswordModel 

class ForgotPasswordRequest(BaseModel):
    email: str
    role: str

class PasswordResetRequest(PasswordModel):
    token: str
    password: str
    confirm_password: str

    @model_validator(mode="before")
    @classmethod
    def check_passwords_match(cls, values):
        password = values.get('password')
        confirm_password = values.get('confirm_password')
        if password != confirm_password:
            raise HTTPException(
                status_code = status.HTTP_400_BAD_REQUEST,
                detail = 'Passwords do not match'
            )
        return values
    
class ValidateToken(BaseModel):
    token: str