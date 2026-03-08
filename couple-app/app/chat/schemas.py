from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

# --- Media Schema ---
class MediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    file_name: str
    file_type: str
    file_size: int
    signed_url: Optional[str] = None

# --- NEW: Reaction Schema ---
class ReactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    emoji: str

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
    media: Optional[MediaResponse]
    
    is_read: bool
    created_at: datetime
    
    # --- ADDED: Computed Status field ---
    status: Optional[str] = "sent"

    # --- ADDED: List of Reactions ---
    reactions: List[ReactionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ConversationResponse(BaseModel):
    conversation_id: int