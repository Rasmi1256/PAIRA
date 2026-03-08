from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class VoiceMessageBase(BaseModel):
    audio_path: str
    duration_seconds: int
    


class VoiceMessageCreate(VoiceMessageBase):
    receiver_id: int


class VoiceMessageUpdate(BaseModel):
    listened_at: Optional[datetime] = None


class VoiceMessageResponse(VoiceMessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    couple_id: int
    sender_id: int
    receiver_id: int
    listened_at: Optional[datetime]
    created_at: datetime
