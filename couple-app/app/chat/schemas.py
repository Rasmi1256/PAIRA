from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# 1. Add a schema for Media so Pydantic knows how to read the object
class MediaResponse(BaseModel):
    id: int
    key: str
    file_name: str
    file_type: str
    file_size: int

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    receiver_id: int
    message_text: Optional[str] = None
    media_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message_text: Optional[str]
    media_id: Optional[int]
    
    # 2. Change 'dict' to 'MediaResponse'
    media: Optional[MediaResponse] 
    
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    conversation_id: int