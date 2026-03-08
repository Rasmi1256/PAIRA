from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from sqlalchemy import Column, ForeignKey, Integer, Text, DateTime, String, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.types import GUID

from app.db.base_class import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    # -------------------------
    # Primary Key
    # -------------------------
    id = Column(GUID, primary_key=True, default=uuid4)

    # -------------------------
    # Ownership
    # -------------------------
    couple_id = Column(
        Integer,
        ForeignKey("couples.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    author_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    # -------------------------
    # Content
    # -------------------------
    content = Column(
        Text,
        nullable=False
    )

    mood = Column(
        String(20),
        nullable=True
    )

    # -------------------------
    # Privacy
    # -------------------------
    is_private = Column(
        Boolean,
        default=False,
        nullable=False
    )

    # -------------------------
    # Timestamps
    # -------------------------
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # -------------------------
    # Relationships
    # -------------------------
    author = relationship("User", lazy="joined")
    couple = relationship("Couple", lazy="joined")
    attachments = relationship(
        "JournalAttachment",
        back_populates="journal",
        cascade="all, delete-orphan"
    )


class JournalAttachment(Base):
    __tablename__ = "journal_attachments"

    id = Column(GUID, primary_key=True, default=uuid4)

    journal_id = Column(
        GUID,
        ForeignKey("journal_entries.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    type = Column(
        String(20),  # image | audio | file
        nullable=False
    )

    file_path = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    journal = relationship("JournalEntry", back_populates="attachments")
