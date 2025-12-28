from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class CoupleInvite(Base):
    __tablename__ = "couple_invites"
    id = Column(Integer, primary_key=True, index=True)
    couple_id = Column(Integer, ForeignKey("couples.id"), nullable=False)

    # We store only the hash of the token in DB for security
    token_hash = Column(String, unique=True, index=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    used = Column(Boolean, default=False)

    couple = relationship("Couple")
