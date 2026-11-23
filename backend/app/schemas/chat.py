from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserResponse

class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"
    media_url: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    message_type: str
    media_url: Optional[str] = None
    is_read: bool
    created_at: datetime
    sender: Optional[UserResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class ConversationParticipantResponse(BaseModel):
    id: int
    user_id: int
    joined_at: datetime
    user: Optional[UserResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class ConversationCreate(BaseModel):
    participant_user_id: int
    property_id: Optional[int] = None
    initial_message: Optional[str] = None

class ConversationResponse(BaseModel):
    id: int
    property_id: Optional[int] = None
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    participants: List[ConversationParticipantResponse] = []
    last_message: Optional[MessageResponse] = None
    
    model_config = ConfigDict(from_attributes=True)
