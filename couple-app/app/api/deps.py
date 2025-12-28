from fastapi import Depends, HTTPException, status, WebSocket
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.config import settings  # <--- CONFIG USED

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class TokenData(BaseModel):
    sub: str | None = None


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        token_data = TokenData(sub=user_id)

    except JWTError:
        raise credentials_exception

    # IMPORTANT: convert to int because User.id is Integer
    try:
        user_id_int = int(token_data.sub)
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id_int).first()

    if user is None:
        raise credentials_exception

    return user


def get_current_user_ws(
    websocket: WebSocket,
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency for WebSocket authentication.
    Token is expected in `?token=JWT_TOKEN`
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate WebSocket credentials",
    )

    token = websocket.query_params.get("token")
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        token_data = TokenData(sub=user_id)

    except JWTError:
        raise credentials_exception

    # Convert to int for DB lookup
    try:
        user_id_int = int(token_data.sub)
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id_int).first()

    if user is None:
        raise credentials_exception

    return user
