from sqlalchemy import Column, Integer, LargeBinary, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credentials"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    credential_id = Column(LargeBinary, unique=True, nullable=False)
    public_key = Column(LargeBinary, nullable=False)
    sign_count = Column(Integer, nullable=False)
    transports = Column(JSON, nullable=True)

    user = relationship("User", back_populates="webauthn_credentials")
