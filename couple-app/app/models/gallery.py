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
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class AlbumType(str, enum.Enum):
    USER_CREATED = "user_created"
    SMART_COLLECTION = "smart_collection"


class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    album_type = Column(SQLAlchemyEnum(AlbumType), default=AlbumType.USER_CREATED, nullable=False)
    is_smart_collection = Column(Boolean, default=False, nullable=False)
    smart_criteria = Column(String, nullable=True)  # JSON string for smart collection rules
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="albums")
    media_items = relationship("Media", back_populates="album", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    color = Column(String, default="#3B82F6", nullable=False)  # Default blue color
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="tags")

    __table_args__ = (
        {"schema": None},  # Ensure no schema prefix
    )

