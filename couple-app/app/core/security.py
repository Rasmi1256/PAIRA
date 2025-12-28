import hashlib

from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, UTC
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    # truncate password to 72 bytes max before hashing for bcrypt compatibility
    truncated_password = password.encode('utf-8')[:72].decode('utf-8', 'ignore')
    return pwd_context.hash(truncated_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"sub": str(subject), "exp": expire}
    encoded = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded

def decode_token(token: str):
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def hash_token(token: str) -> str:
    """
    Return a stable hex SHA-256 hash for the invite token.
    We use this to store only the hash in the DB.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
