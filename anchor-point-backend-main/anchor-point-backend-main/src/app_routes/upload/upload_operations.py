from fastapi import APIRouter, Depends, File, UploadFile, status, HTTPException
from typing import List
from common_utils.utils import JWTBearer
from app_schemas.schema import AccessToken
from common_utils import utils
import uuid
import os

router = APIRouter(tags=["Upload"], dependencies=[Depends(JWTBearer())])

@router.post("/", status_code=status.HTTP_200_OK)
async def upload_file(
    file: UploadFile = File(...),
    decoded_access_token: AccessToken = Depends(JWTBearer())
):
    """
    Uploads a file to S3 and returns the public URL.
    """
    try:
        # Create a unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        object_name = f"uploads/{unique_filename}"
        
        # Save file locally first to upload to s3
        local_file_path = f"/tmp/{unique_filename}"
        with open(local_file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        utils.upload_to_s3(local_file_path, object_name)
        
        # Cleanup local file
        if os.path.exists(local_file_path):
            os.remove(local_file_path)
            
        public_url = utils.get_s3_public_url(object_name)
        return {"url": public_url, "message": "Successfully uploaded file"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
