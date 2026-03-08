from datetime import datetime

from sqlalchemy import Column, ForeignKey, Integer, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class VoiceMessage(Base):
    __tablename__ = "voice_messages"

    # -------------------------
    # Primary Key
    # -------------------------
    id = Column(Integer, primary_key=True, autoincrement=True)

    # -------------------------
    # Ownership & Authorization
    # -------------------------
    couple_id = Column(
        Integer,
        ForeignKey("couples.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    sender_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    receiver_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    # -------------------------
    # Audio Metadata
    # -------------------------
    audio_path = Column(Text, nullable=False)

    duration_seconds = Column(Integer, nullable=False)

    # -------------------------
    # State Tracking
    # -------------------------
    listened_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # -------------------------
    # ORM Relationships (optional but useful)
    # -------------------------
    couple = relationship("Couple", lazy="joined")
    sender = relationship(
        "User",
        foreign_keys=[sender_id],
        lazy="joined"
    )
    receiver = relationship(
        "User",
        foreign_keys=[receiver_id],
        lazy="joined"
    )
