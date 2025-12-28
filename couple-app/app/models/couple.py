from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Couple(Base):
    __tablename__ = "couples"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)

    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Ensure same couple pair cannot exist twice
    __table_args__ = (
        UniqueConstraint('user1_id', 'user2_id', name='unique_couple_pair'),
        CheckConstraint('user1_id != user2_id', name='prevent_self_couple')
    )

    # Relationships
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])

    # One couple → One conversation
    conversation = relationship(
        "Conversation",
        back_populates="couple",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # One couple → Many media
    media = relationship("Media", back_populates="couple")
