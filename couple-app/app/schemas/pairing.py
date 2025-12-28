from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PairingInitiateResponse(BaseModel):
    secretCode: str
    expiresAt: str
    message: str


class PairingCompleteRequest(BaseModel):
    secretCode: str


class PairingCompleteResponse(BaseModel):
    message: str
    partnerName: str
    coupleId: int
    conversationId: int
