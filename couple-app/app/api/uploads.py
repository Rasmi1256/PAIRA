import boto3
import uuid
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

from app.config import settings
from app.db.session import get_db
from app.models.media import Media, UploadStatus
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])


# =========================
# Schemas
# =========================

class PresignedUrlRequest(BaseModel):
    fileName: str


class PresignedUrlResponse(BaseModel):
    presignedUrl: str
    key: str


class UploadCompleteRequest(BaseModel):
    key: str
    fileName: str
    fileType: str
    fileSize: int
    albumId: Optional[int] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []


class MediaResponse(BaseModel):
    id: int
    key: str
    file_name: str
    upload_status: UploadStatus

    class Config:
        from_attributes = True


# =========================
# Helpers
# =========================

def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


# =========================
# Generate Presigned PUT URL
# =========================

@router.post(
    "/presigned-url",
    response_model=PresignedUrlResponse,
    status_code=status.HTTP_200_OK,
)
async def create_presigned_url(
    request: PresignedUrlRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generates a presigned URL for uploading a file directly to S3.
    NOTE: No Content-Type is signed to avoid CORS preflight issues.
    """
    s3 = get_s3_client()

    key = f"uploads/{current_user.id}/{uuid.uuid4()}-{request.fileName}"

    try:
        presigned_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.AWS_S3_BUCKET_NAME,
                "Key": key,
            },
            ExpiresIn=300,  # 5 minutes
        )
        return {"presignedUrl": presigned_url, "key": key}
    except ClientError as e:
        print("Presign error:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate upload URL",
        )


# =========================
# Confirm Upload + Save DB
# =========================

@router.post(
    "/complete",
    response_model=MediaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def complete_upload(
    request: UploadCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Confirms upload and stores metadata in DB.
    """

    # Ensure user owns the upload path
    if not request.key.startswith(f"uploads/{current_user.id}/"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid upload key",
        )

    existing = db.query(Media).filter(Media.key == request.key).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="File already registered",
        )

    media = Media(
        key=request.key,
        file_name=request.fileName,
        file_type=request.fileType,
        file_size=request.fileSize,
        user_id=current_user.id,
        couple_id=current_user.couple_id,
        upload_status=UploadStatus.COMPLETED,
        album_id=request.albumId,
        description=request.description,
        tags=request.tags or [],
    )

    db.add(media)
    db.commit()
    db.refresh(media)

    return media


# =========================
# Generate Presigned GET URL
# =========================

from fastapi import APIRouter, Depends, HTTPException, status, Query
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.media import Media
from fastapi.responses import RedirectResponse

# ... (Keep your existing imports and setup)

# --- NEW HELPER: Authenticate from Query Token ---
def get_user_from_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Ensure ID is int (since your DB uses Integers)
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Could not validate credentials")


# --- UPDATED ROUTE ---
@router.get("/signed-url")
def get_signed_url(
    key: str,
    token: str = Query(..., description="JWT Token"), 
    db: Session = Depends(get_db),
):
    # 1. Authenticate
    get_user_from_token(token, db)

    # 2. Check DB
    media = db.query(Media).filter(Media.key == key).first()
    if not media:
        raise HTTPException(status_code=404, detail="File not found")

    # 3. Generate S3 URL
    s3 = get_s3_client()
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_S3_BUCKET_NAME, "Key": key},
        ExpiresIn=3600,
    )

    # 4. REDIRECT the browser to the image
    return RedirectResponse(url=url)