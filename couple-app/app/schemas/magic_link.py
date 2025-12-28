from pydantic import BaseModel, EmailStr

class MagicLinkRequest(BaseModel):
    email: EmailStr

class MagicLinkCreateOut(BaseModel):
    token: str
