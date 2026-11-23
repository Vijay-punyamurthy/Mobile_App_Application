from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Call(Base):
    __tablename__ = "calls"
    
    id = Column(Integer, primary_key=True, index=True)
    caller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    call_type = Column(String(20), nullable=False)  # audio, video
    status = Column(String(30), default="initiated")  # initiated, ringing, answered, rejected, missed, ended
    room_id = Column(String(100), unique=True, index=True, nullable=False)
    duration_seconds = Column(Integer, default=0)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    
    caller = relationship("User", foreign_keys=[caller_id], lazy="selectin")
    receiver = relationship("User", foreign_keys=[receiver_id], lazy="selectin")

class MeetingRoom(Base):
    __tablename__ = "meeting_rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)
    scheduled_for = Column(DateTime, nullable=True)
    status = Column(String(30), default="scheduled")  # scheduled, live, concluded
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    host = relationship("User", foreign_keys=[host_id], lazy="selectin")
    property = relationship("Property", foreign_keys=[property_id], lazy="selectin")
