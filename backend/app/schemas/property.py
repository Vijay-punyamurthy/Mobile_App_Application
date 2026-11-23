from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserResponse

class PropertyImageBase(BaseModel):
    image_url: str
    is_primary: bool = False
    sort_order: int = 0

class PropertyImageResponse(PropertyImageBase):
    id: int
    property_id: int
    
    model_config = ConfigDict(from_attributes=True)

class PropertyCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str
    price: float = Field(..., gt=0)
    price_unit: str = "USD"
    land_area: float = Field(..., gt=0)
    area_unit: str = "acres"
    property_type: str = "residential"  # residential, agricultural, commercial, industrial
    status: str = "available"  # available, pending, sold
    address: str
    city: str
    state: str
    country: str = "United States"
    latitude: float
    longitude: float
    zoning_classification: Optional[str] = "A-1 Agricultural / Rural"
    images: Optional[List[PropertyImageBase]] = []

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    price_unit: Optional[str] = None
    land_area: Optional[float] = None
    area_unit: Optional[str] = None
    property_type: Optional[str] = None
    status: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    zoning_classification: Optional[str] = None

class PropertyResponse(BaseModel):
    id: int
    owner_id: int
    title: str
    description: str
    price: float
    price_unit: str
    land_area: float
    area_unit: str
    property_type: str
    status: str
    address: str
    city: str
    state: str
    country: str
    latitude: float
    longitude: float
    zoning_classification: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    images: List[PropertyImageResponse] = []
    owner: Optional[UserResponse] = None
    is_favorited: Optional[bool] = False
    
    model_config = ConfigDict(from_attributes=True)
