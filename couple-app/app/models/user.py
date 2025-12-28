from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    google_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)

    couple_id = Column(Integer, ForeignKey("couples.id"), nullable=True)
    couple = relationship("Couple", foreign_keys=[couple_id])
    magic_links = relationship("MagicLink", back_populates="user")
    webauthn_credentials = relationship("WebAuthnCredential", back_populates="user")
    profile_picture_url = Column(String, nullable=True)

    # Gallery relationships
    media = relationship("Media", back_populates="user")
    albums = relationship("Album", back_populates="user")
    tags = relationship("Tag", back_populates="user")
