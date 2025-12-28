from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str | None = None
    full_name: str | None = None
    google_id: str | None = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    profile_picture_url: str | None
    partnerName: Optional[str] = None
    partnerEmail: Optional[str] = None
    partnerProfilePictureUrl: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
