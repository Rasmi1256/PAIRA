import os
import uuid
import boto3
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from botocore.exceptions import NoCredentialsError

from app.api.deps import get_db, get_current_user
from app.schemas.user import UserUpdate, UserOut
from app.models.user import User
from app.models.couple import Couple
from app.crud import crud_user
from app.config import settings

router = APIRouter(prefix="/users", tags=["users"])


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


def generate_signed_url(key: str) -> str:
    s3 = get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.AWS_S3_BUCKET_NAME,
            "Key": key,
        },
        ExpiresIn=3600,  # 1 hour
    )


# =========================
# Update User Profile
# =========================

@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.email and payload.email != current_user.email:
        existing_user = crud_user.get_user_by_email(db, email=payload.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered by another user.",
            )
        current_user.email = payload.email

    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    db.commit()
    db.refresh(current_user)

    # 🔐 Return signed profile picture URL
    if current_user.profile_picture_url:
        current_user.profile_picture_url = generate_signed_url(
            current_user.profile_picture_url
        )

    # Fetch partner details if user is in a couple
    partner_name = None
    partner_email = None
    partner_profile_picture_url = None
    if current_user.couple_id:
        couple = db.query(Couple).filter(Couple.id == current_user.couple_id).first()
        if couple:
            partner_id = couple.user1_id if couple.user2_id == current_user.id else couple.user2_id
            partner = db.query(User).filter(User.id == partner_id).first()
            if partner:
                partner_name = partner.full_name
                partner_email = partner.email
                partner_profile_picture_url = partner.profile_picture_url
                if partner_profile_picture_url:
                    partner_profile_picture_url = generate_signed_url(partner_profile_picture_url)

    # Add partner details to the response
    user_data = current_user.__dict__.copy()
    user_data['partnerName'] = partner_name
    user_data['partnerEmail'] = partner_email
    user_data['partnerProfilePictureUrl'] = partner_profile_picture_url
    return user_data


# =========================
# Upload Profile Picture
# =========================

@router.post("/me/profile-picture", response_model=UserOut)
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s3 = get_s3_client()
    bucket = settings.AWS_S3_BUCKET_NAME

    file_extension = os.path.splitext(file.filename)[1]
    object_key = f"profile_pics/{current_user.id}/{uuid.uuid4()}{file_extension}"

    try:
        s3.upload_fileobj(
            file.file,
            bucket,
            object_key,
        )
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not configured.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")

    # ✅ STORE ONLY THE S3 KEY (NOT A URL)
    current_user.profile_picture_url = object_key
    db.commit()
    db.refresh(current_user)

    # ✅ RETURN SIGNED URL FOR IMMEDIATE RENDERING
    current_user.profile_picture_url = generate_signed_url(object_key)

    # Fetch partner details if user is in a couple
    partner_name = None
    partner_email = None
    partner_profile_picture_url = None
    if current_user.couple_id:
        couple = db.query(Couple).filter(Couple.id == current_user.couple_id).first()
        if couple:
            partner_id = couple.user1_id if couple.user2_id == current_user.id else couple.user2_id
            partner = db.query(User).filter(User.id == partner_id).first()
            if partner:
                partner_name = partner.full_name
                partner_email = partner.email
                partner_profile_picture_url = partner.profile_picture_url
                if partner_profile_picture_url:
                    partner_profile_picture_url = generate_signed_url(partner_profile_picture_url)

    # Add partner details to the response
    user_data = current_user.__dict__.copy()
    user_data['partnerName'] = partner_name
    user_data['partnerEmail'] = partner_email
    user_data['partnerProfilePictureUrl'] = partner_profile_picture_url
    return user_data


# =========================
# Get Current User
# =========================

@router.get("/me", response_model=UserOut)
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch partner details if user is in a couple
    partner_name = None
    partner_email = None
    partner_profile_picture_url = None
    if current_user.couple_id:
        couple = db.query(Couple).filter(Couple.id == current_user.couple_id).first()
        if couple:
            partner_id = couple.user1_id if couple.user2_id == current_user.id else couple.user2_id
            partner = db.query(User).filter(User.id == partner_id).first()
            if partner:
                partner_name = partner.full_name
                partner_email = partner.email
                partner_profile_picture_url = partner.profile_picture_url
                if partner_profile_picture_url:
                    partner_profile_picture_url = generate_signed_url(partner_profile_picture_url)

    if current_user.profile_picture_url:
        current_user.profile_picture_url = generate_signed_url(
            current_user.profile_picture_url
        )

    # Add partner details to the response
    user_data = current_user.__dict__.copy()
    user_data['partnerName'] = partner_name
    user_data['partnerEmail'] = partner_email
    user_data['partnerProfilePictureUrl'] = partner_profile_picture_url
    return user_data
