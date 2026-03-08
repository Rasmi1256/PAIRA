import uuid
from sqlalchemy import Column, ForeignKey, DateTime, func, String, Boolean, Integer, UniqueConstraint
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
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"))
    sender_id = Column(ForeignKey("users.id"))
    receiver_id = Column(ForeignKey("users.id"))
    message_text = Column(String, nullable=True)
    
    # ForeignKey is correct here
    media_id = Column(Integer, ForeignKey("media.id"), nullable=True)

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), server_default=func.now())
    seen_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    media = relationship("Media")
    
    # --- ADDED: Relationship to Reactions ---
    reactions = relationship("Reaction", back_populates="message", cascade="all, delete-orphan")


# --- ADDED: New Table for Reactions ---
class Reaction(Base):
    __tablename__ = "chat_reactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    emoji = Column(String, nullable=False) # e.g., "👍", "❤️"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("Message", back_populates="reactions")

    # Constraint: One user can only add one specific emoji to a message once
    __table_args__ = (
        UniqueConstraint('message_id', 'user_id', 'emoji', name='unique_user_reaction'),
    )