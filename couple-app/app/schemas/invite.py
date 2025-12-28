from pydantic import BaseModel

class InviteCreateOut(BaseModel):
    token: str
    expires_at: str | None = None
