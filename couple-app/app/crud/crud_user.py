from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate


def get_user_by_email(db: Session, *, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_google_id(db: Session, *, google_id: str) -> User | None:
    return db.query(User).filter(User.google_id == google_id).first()


def create_user(db: Session, *, user_in: UserCreate) -> User:
    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password) if user_in.password else "",
        google_id=user_in.google_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
