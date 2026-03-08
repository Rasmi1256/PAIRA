from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
import boto3
from app.config import settings
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.couple import Couple
from app.chat.models import ChatConversation, Message
from app.chat import schemas
from sqlalchemy import func

router = APIRouter(prefix="/chat", tags=["Chat"])


def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


@router.get("/conversation", response_model=schemas.ConversationResponse)
def get_or_create_conversation(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if not user.couple_id:
        raise HTTPException(400, "User has no couple")

    couple = db.query(Couple).filter_by(id=user.couple_id).first()
    if not couple:
        raise HTTPException(400, "Couple not found")

    partner_id = (
        couple.user2_id if couple.user1_id == user.id else couple.user1_id
    )

    conv = (
        db.query(ChatConversation)
        .filter(
            ((ChatConversation.user1_id == user.id) & (ChatConversation.user2_id == partner_id))
            | ((ChatConversation.user1_id == partner_id) & (ChatConversation.user2_id == user.id))
        )
        .first()
    )

    if not conv:
        conv = ChatConversation(user1_id=user.id, user2_id=partner_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    return {"conversation_id": conv.id}


@router.get("/messages/{conversation_id}", response_model=list[schemas.MessageResponse])
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    conv = db.query(ChatConversation).filter_by(id=conversation_id).first()

    if not conv:
        raise HTTPException(404, "Conversation not found")

    if user.id not in [conv.user1_id, conv.user2_id]:
        raise HTTPException(403, "Access denied")

    # FIX: Use joinedload to fetch reactions efficiently
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id, Message.deleted_at.is_(None))
        .options(joinedload(Message.reactions))  # <--- CRITICAL FIX
        .order_by(Message.created_at.asc())
        .all()
    )

    # Generate signed URLs for media
    s3 = get_s3_client()
    result = []
    for msg in messages:
        media_data = msg.media
        if msg.media:
            # Generate signed URL for media
            signed_url = s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.AWS_S3_BUCKET_NAME,
                    "Key": msg.media.key,
                },
                ExpiresIn=3600,  # 1 hour
            )
            media_data = {
                "id": msg.media.id,
                "key": msg.media.key,
                "file_name": msg.media.file_name,
                "file_type": msg.media.file_type,
                "file_size": msg.media.file_size,
                "signed_url": signed_url,
            }

        msg_dict = {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "message_text": msg.message_text,
            "media_id": msg.media_id,
            "media": media_data,
            "is_read": msg.is_read,
            "created_at": msg.created_at,
            # Calculate status for frontend
            "status": "seen" if msg.seen_at else ("delivered" if msg.delivered_at else "sent"),

            # FIX: Include reactions in the response
            "reactions": msg.reactions
        }
        result.append(msg_dict)

    return result


# --- NEW ENDPOINT: SHARED GALLERY ---
@router.get("/conversations/{conversation_id}/media", response_model=list[schemas.MessageResponse])
def get_chat_media(
    conversation_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Fetch all messages that contain media for this conversation
    """
    conv = db.query(ChatConversation).filter_by(id=conversation_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")

    if user.id not in [conv.user1_id, conv.user2_id]:
        raise HTTPException(403, "Access denied")
    
    media_messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.media_id.isnot(None) # Only messages with media
        )
        .options(joinedload(Message.media))
        .order_by(Message.created_at.desc())
        .all()
    )
    
    # Generate signed URLs for media
    s3 = get_s3_client()
    result = []
    for msg in media_messages:
        media_data = None
        if msg.media:
            # Generate signed URL for media
            signed_url = s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.AWS_S3_BUCKET_NAME,
                    "Key": msg.media.key,
                },
                ExpiresIn=3600,  # 1 hour
            )
            media_data = {
                "id": msg.media.id,
                "key": msg.media.key,
                "file_name": msg.media.file_name,
                "file_type": msg.media.file_type,
                "file_size": msg.media.file_size,
                "signed_url": signed_url,
            }

        msg_dict = {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "message_text": msg.message_text,
            "media_id": msg.media_id,
            "media": media_data,
            "is_read": msg.is_read,
            "created_at": msg.created_at,
            "status": "seen" if msg.seen_at else ("delivered" if msg.delivered_at else "sent"),
            "reactions": msg.reactions
        }
        result.append(msg_dict)

    return result


@router.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    msg = db.query(Message).filter_by(id=message_id).first()

    if not msg:
        raise HTTPException(404, "Message not found")

    if msg.sender_id != user.id:
        raise HTTPException(403, "You can only delete your own messages")

    # If message has media, delete it from S3
    if msg.media:
        try:
            s3 = get_s3_client()
            s3.delete_object(Bucket=settings.AWS_S3_BUCKET_NAME, Key=msg.media.key)
            # Delete media record from DB
            db.delete(msg.media)
        except Exception as e:
            print(f"Error deleting media from S3: {e}")
            # Proceed with message deletion anyway

    # Soft delete by setting deleted_at
    msg.deleted_at = func.now()
    db.commit()

    return {"message": "Message deleted successfully"}
