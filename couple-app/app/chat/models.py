# app/chat/models.py
import uuid
from sqlalchemy import Column, ForeignKey, DateTime, func, String, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    user1_id = Column(ForeignKey("users.id"))
    user2_id = Column(ForeignKey("users.id"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    conversation_id = Column(Integer,
                             ForeignKey("chat_conversations.id"))

    sender_id = Column(ForeignKey("users.id"))
    receiver_id = Column(ForeignKey("users.id"))

    message_text = Column(String, nullable=True)
    media_id = Column(ForeignKey("media.id"), nullable=True)

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    delivered_at = Column(DateTime(timezone=True), server_default=func.now())
    seen_at = Column(DateTime(timezone=True), nullable=True)

    media = relationship("Media")
