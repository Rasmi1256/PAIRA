import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Boolean,
    Text,
    func,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class UploadStatus(str, enum.Enum):
    COMPLETED = "completed"
    FAILED = "failed"


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    upload_status = Column(SQLAlchemyEnum(UploadStatus), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    couple_id = Column(Integer, ForeignKey("couples.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # New fields for albums, favorites, tags
    album_id = Column(Integer, ForeignKey("albums.id"), nullable=True)
    is_favorite = Column(Boolean, default=False, nullable=False)
    is_starred = Column(Boolean, default=False, nullable=False)
    tags = Column(JSON, default=list, nullable=False)  # Array of tag names
    description = Column(Text, nullable=True)  # Optional description/caption

    # Relationships
    album = relationship("Album", back_populates="media_items")
    user = relationship("User", back_populates="media")
    couple = relationship("Couple", back_populates="media")

    # To complete the relationship, add the following to your User model:
    # media = relationship("Media", back_populates="user")
