from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.couple import Couple
from app.chat.models import ChatConversation, Message
from app.chat import schemas

router = APIRouter(prefix="/chat", tags=["Chat"])


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

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return messages

