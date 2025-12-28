from pydantic import BaseModel, Field
from datetime import datetime
import uuid
import enum
from typing import List, Optional

# This must match the enum in models.gallery
class MediaType(str, enum.Enum):
    image = "image"
    video = "video"


class AlbumType(str, enum.Enum):
    USER_CREATED = "user_created"
    SMART_COLLECTION = "smart_collection"


class AlbumCreate(BaseModel):
    name: str
    description: Optional[str] = None
    album_type: AlbumType = AlbumType.USER_CREATED
    smart_criteria: Optional[str] = None


class AlbumUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    album_type: Optional[AlbumType] = None
    smart_criteria: Optional[str] = None


class AlbumResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    user_id: int
    album_type: AlbumType
    is_smart_collection: bool
    smart_criteria: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TagCreate(BaseModel):
    name: str
    color: str = "#3B82F6"


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagResponse(BaseModel):
    id: int
    name: str
    user_id: int
    color: str
    created_at: datetime

    class Config:
        from_attributes = True


class MediaUpdate(BaseModel):
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    album_id: Optional[int] = None
    is_favorite: Optional[bool] = None
    is_starred: Optional[bool] = None


class MediaResponse(BaseModel):
    id: int
    key: str
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    upload_status: str
    user_id: int
    created_at: datetime
    album_id: Optional[int] = None
    is_favorite: bool
    is_starred: bool
    tags: List[str]
    description: Optional[str] = None

    class Config:
        from_attributes = True


class GalleryFilterRequest(BaseModel):
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    tags: Optional[List[str]] = None
    album_id: Optional[int] = None
    is_favorite: Optional[bool] = None
    is_starred: Optional[bool] = None


class FavoriteToggleRequest(BaseModel):
    pass  # No body needed, toggle via path param


class StarToggleRequest(BaseModel):
    pass  # No body needed, toggle via path param


class BulkTagRequest(BaseModel):
    media_ids: List[int]
    tags: List[str]
    action: str  # "add" or "remove"


class GalleryItem(BaseModel):
    id: uuid.UUID
    url: str
    type: MediaType
    createdAt: datetime = Field(..., alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True

