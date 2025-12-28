import os
import uuid
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from fastapi import UploadFile, HTTPException
from app.config import settings


# This will use credentials from settings
AWS_REGION = settings.AWS_S3_REGION
try:
    s3_client = boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
except NoCredentialsError:
    print("Could not initialize AWS S3 client. Check credentials.")
    s3_client = None
except Exception as e:
    print(f"Could not initialize AWS S3 client. Error: {e}")
    s3_client = None


AWS_S3_BUCKET_NAME = settings.AWS_S3_BUCKET_NAME

def upload_file_to_gcs(file: UploadFile, user_id: str) -> str:
    """
    Uploads a file to S3 and returns its public URL.
    Assumes the bucket is configured to allow public read access.
    """
    if not s3_client or not AWS_S3_BUCKET_NAME or not AWS_REGION:
        raise HTTPException(status_code=500, detail="AWS S3 is not configured.")

    try:
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''

        # e.g. gallery/user_uuid/some_uuid.jpg
        object_name = f"gallery/{user_id}/{uuid.uuid4()}.{file_extension}"

        file.file.seek(0)  # Ensure file pointer is at the beginning
        s3_client.upload_fileobj(
            file.file,
            AWS_S3_BUCKET_NAME,
            object_name,
            ExtraArgs={'ContentType': file.content_type},
        )

        return f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{object_name}"
    except ClientError as e:
        print(f"An error occurred during S3 upload: {e}")
        raise HTTPException(status_code=500, detail="Could not upload file.")