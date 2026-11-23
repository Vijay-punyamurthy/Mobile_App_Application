from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Property(Base):
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False, index=True)
    price_unit = Column(String(20), default="USD")
    land_area = Column(Float, nullable=False)
    area_unit = Column(String(50), default="acres")  # acres, sqft, hectares, cents
    property_type = Column(String(50), default="residential", index=True)  # residential, agricultural, commercial, industrial
    status = Column(String(50), default="available", index=True)  # available, pending, sold
    
    # Location
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    country = Column(String(100), default="United States")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    zoning_classification = Column(String(100), default="A-1 Agricultural / Rural")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    owner = relationship("User", back_populates="properties", lazy="selectin")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan", lazy="selectin", order_by="PropertyImage.sort_order")
    favorites = relationship("PropertyFavorite", back_populates="property", cascade="all, delete-orphan")

class PropertyImage(Base):
    __tablename__ = "property_images"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    property = relationship("Property", back_populates="images")

class PropertyFavorite(Base):
    __tablename__ = "property_favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="favorites")
    property = relationship("Property", back_populates="favorites", lazy="selectin")
