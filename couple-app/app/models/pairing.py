from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class PairingCode(Base):
    __tablename__ = "pairing_codes"
    code = Column(String(8), primary_key=True)
    generating_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    completing_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    generating_user = relationship("User", foreign_keys=[generating_user_id])
    completing_user = relationship("User", foreign_keys=[completing_user_id])
