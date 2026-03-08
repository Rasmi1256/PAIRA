import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Enum, Integer, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.db.types import GUID

CALL_STATUS = ("ringing", "active", "ended", "rejected", "missed")

class VideoCall(Base):
    __tablename__ = "video_calls"
    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    caller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    callee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum(*CALL_STATUS, name="call_status"),
        nullable=False,
        default="ringing",
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    caller = relationship("User", foreign_keys=[caller_id])
    callee = relationship("User", foreign_keys=[callee_id])

    def __repr__(self):
        return f"<VideoCall(id={self.id}, caller_id={self.caller_id}, callee_id={self.callee_id}, status={self.status})>"
