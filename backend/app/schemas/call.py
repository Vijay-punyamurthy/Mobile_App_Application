from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.schemas.user import UserResponse

class CallInitiateRequest(BaseModel):
    receiver_id: int
    call_type: str = "video"  # audio, video
    room_id: str

class CallStatusUpdateRequest(BaseModel):
    status: str  # answered, rejected, missed, ended
    duration_seconds: Optional[int] = 0

class CallResponse(BaseModel):
    id: int
    caller_id: int
    receiver_id: int
    call_type: str
    status: str
    room_id: str
    duration_seconds: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    caller: Optional[UserResponse] = None
    receiver: Optional[UserResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class MeetingCreateRequest(BaseModel):
    title: str
    property_id: Optional[int] = None
    scheduled_for: Optional[datetime] = None

class MeetingResponse(BaseModel):
    id: int
    code: str
    title: str
    host_id: int
    property_id: Optional[int] = None
    scheduled_for: Optional[datetime] = None
    status: str
    created_at: datetime
    host: Optional[UserResponse] = None
    
    model_config = ConfigDict(from_attributes=True)
