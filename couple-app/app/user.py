from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None


class UserCreate(UserBase):
    password: str | None = None


class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
