from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base_class import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    couple_id = Column(Integer, ForeignKey("couples.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    couple = relationship("Couple", back_populates="conversation")
