import uuid
import boto3
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.voice_message import VoiceMessage
from app.schemas.voice_message import VoiceMessageResponse, VoiceMessageUpdate
from app.config import settings

router = APIRouter(prefix="/voice-messages", tags=["Voice Messages"])

# --- S3 Helper ---
def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

@router.post("/", response_model=VoiceMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_voice_message(
    receiver_id: int = Form(...),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validate receiver is in the same couple
    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver or receiver.couple_id != current_user.couple_id:
        raise HTTPException(status_code=403, detail="Invalid receiver")

    # 2. Validate Audio Format
    if audio_file.content_type not in ["audio/wav", "audio/mpeg", "audio/webm", "audio/mp4", "audio/x-m4a"]:
        raise HTTPException(status_code=400, detail=f"Invalid audio format: {audio_file.content_type}")

    # 3. Generate S3 Key
    file_extension = audio_file.filename.split(".")[-1] if "." in audio_file.filename else "wav"
    # Structure: uploads/{user_id}/voice/{uuid}.{ext}
    s3_key = f"uploads/{current_user.id}/voice/{uuid.uuid4()}.{file_extension}"

    # 4. Upload to S3
    s3 = get_s3_client()
    try:
        s3.upload_fileobj(
            audio_file.file,
            settings.AWS_S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={'ContentType': audio_file.content_type} # Critical for playback!
        )
    except Exception as e:
        print(f"S3 Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload audio file to S3")

    # 5. Save Metadata to DB
    # Note: We are saving 's3_key' into 'audio_path'.
    # Your frontend will use this key to request the signed URL.
    
    # Optional: Calculate duration here if needed, or send it from frontend as a Form field.
    # For now, I'll set a placeholder or 0 if you don't have it.
    duration = 0.0 

    voice_message = VoiceMessage(
        couple_id=current_user.couple_id,
        sender_id=current_user.id,
        receiver_id=receiver_id,
        audio_path=s3_key,  # Storing the Key
        duration_seconds=duration 
    )

    db.add(voice_message)
    db.commit()
    db.refresh(voice_message)

    return voice_message


@router.get("/", response_model=List[VoiceMessageResponse])
def get_voice_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    voice_messages = db.query(VoiceMessage).filter(
        VoiceMessage.couple_id == current_user.couple_id
    ).order_by(VoiceMessage.created_at.asc()).all()
    return voice_messages


@router.put("/{voice_message_id}", response_model=VoiceMessageResponse)
def update_voice_message(
    voice_message_id: int,
    voice_message_update: VoiceMessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    voice_message = db.query(VoiceMessage).filter(
        VoiceMessage.id == voice_message_id,
        VoiceMessage.couple_id == current_user.couple_id
    ).first()

    if not voice_message:
        raise HTTPException(status_code=404, detail="Voice message not found")

    if voice_message_update.listened_at is not None:
        voice_message.listened_at = voice_message_update.listened_at

    db.commit()
    db.refresh(voice_message)
    return voice_message


@router.delete("/{voice_message_id}")
def delete_voice_message(
    voice_message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    voice_message = db.query(VoiceMessage).filter(
        VoiceMessage.id == voice_message_id,
        VoiceMessage.couple_id == current_user.couple_id
    ).first()

    if not voice_message:
        raise HTTPException(status_code=404, detail="Voice message not found")

    # Optional: Delete actual file from S3
    try:
        s3 = get_s3_client()
        s3.delete_object(Bucket=settings.AWS_S3_BUCKET_NAME, Key=voice_message.audio_path)
    except Exception as e:
        print(f"Error deleting file from S3: {e}")
        # Proceed to delete DB record anyway

    db.delete(voice_message)
    db.commit()

    return {"message": "Voice message deleted successfully"}