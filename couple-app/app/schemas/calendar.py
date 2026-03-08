from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: date
    event_type: str  # 'anniversary', 'milestone', 'custom'


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    event_type: Optional[str] = None


class CalendarEventResponse(CalendarEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    couple_id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class CoupleAnniversaryUpdate(BaseModel):
    anniversary_date: Optional[date] = None
