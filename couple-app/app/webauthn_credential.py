from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary, JSON
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    credential_id = Column(LargeBinary, nullable=False, unique=True)
    public_key = Column(LargeBinary, nullable=False)
    sign_count = Column(Integer, nullable=False, default=0)
    transports = Column(JSON)

    user = relationship("User", back_populates="webauthn_credentials")