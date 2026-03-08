from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
import uuid
from app.db.base_class import Base
from app.db.types import GUID


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    couple_id = Column(Integer, ForeignKey("couples.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    couple = relationship("Couple", back_populates="conversation")
