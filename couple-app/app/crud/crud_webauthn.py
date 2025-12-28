from typing import List

from sqlalchemy.orm import Session
from webauthn.helpers.structs import CredentialDeviceType, RegistrationCredential

from app.models.webauthn_credential import WebAuthnCredential


def get_credentials_by_user_id(db: Session, *, user_id: int) -> List[WebAuthnCredential]:
    return db.query(WebAuthnCredential).filter(WebAuthnCredential.user_id == user_id).all()


def create_credential(
    db: Session, *, user_id: int, cred: RegistrationCredential
) -> WebAuthnCredential:
    db_cred = WebAuthnCredential(
        user_id=user_id,
        credential_id=cred.credential_id,
        public_key=cred.credential_public_key,
        sign_count=cred.sign_count,
        transports=cred.transports or [],
    )
    db.add(db_cred)
    db.commit()
    db.refresh(db_cred)
    return db_cred
