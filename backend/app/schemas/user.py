from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime

RoleType = Literal["buyer", "seller", "broker"]

class UserProfileBase(BaseModel):
    full_name: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    company_or_agency: Optional[str] = None
    license_number: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    company_or_agency: Optional[str] = None
    license_number: Optional[str] = None

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: RoleType = "buyer"
    full_name: str
    phone_number: Optional[str] = None
    company_or_agency: Optional[str] = None
    license_number: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    profile: Optional[UserProfileResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
