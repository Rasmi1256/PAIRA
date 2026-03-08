from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class VideoCallBase(BaseModel):
    caller_id: int
    callee_id: int
    status: str = Field(..., description="Status of the call: ringing, active, ended, missed")
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class VideoCallCreate(BaseModel):
    callee_id: int = Field(..., description="ID of the user being called")

class VideoCallResponse(VideoCallBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime

class VideoCallUpdateStatus(BaseModel):
    status: str = Field(..., description="New status of the call: ringing, active, ended, missed")
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class IncominingCallPayload(BaseModel):
    call_id: UUID
    caller_id: int
    callee_id: int
    started_at: Optional[datetime] = None

class AcceptedPayload(BaseModel):
    call_id: UUID
    callee_id: int
    started_at: Optional[datetime] = None

class CallRejectedPayload(BaseModel):
    call_id: UUID
    callee_id: int

class CallEndedPayload(BaseModel):
    call_id: UUID
    ended_at: datetime
    reason: Optional[str] = Field(None, description="Reason for call ending")

