from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.magic_link import MagicLink
from app.core.security import hash_token

def create_magic_link(db: Session,*, user_id: int, token: str, expires_delta: timedelta) -> MagicLink:
    token_hash = hash_token(token)
    expires_at = datetime.now(datetime.UTC) + expires_delta
    db_magic_link = MagicLink(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(db_magic_link)
    db.commit()
    db.refresh(db_magic_link)
    return db_magic_link
def get_magic_link_by_token(db: Session,*, token: str) -> MagicLink | None:
    return db.query(MagicLink).filter(MagicLink.token_hash == hash_token(token)).first()