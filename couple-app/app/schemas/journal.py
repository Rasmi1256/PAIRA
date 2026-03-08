from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from uuid import UUID


class JournalAttachmentBase(BaseModel):
    type: str  # 'image' | 'audio' | 'file'
    file_path: str


class JournalAttachmentCreate(JournalAttachmentBase):
    pass


class JournalAttachmentResponse(JournalAttachmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    journal_id: UUID
    created_at: datetime


class JournalEntryBase(BaseModel):
    content: str
    mood: Optional[str] = None
    is_private: bool = False


class JournalEntryCreate(JournalEntryBase):
    pass


class JournalEntryUpdate(BaseModel):
    content: Optional[str] = None
    mood: Optional[str] = None
    is_private: Optional[bool] = None


class JournalEntryResponse(JournalEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    couple_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    attachments: List[JournalAttachmentResponse] = []
