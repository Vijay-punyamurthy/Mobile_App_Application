import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.database.session import get_db
from app.core.rbac import get_current_user
from app.models.user import User
from app.models.call import MeetingRoom
from app.schemas.call import (
    MeetingCreateRequest,
    MeetingResponse
)

router = APIRouter(prefix="/meetings", tags=["Meeting Rooms"])

@router.get("", response_model=List[MeetingResponse])
async def list_meetings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MeetingRoom)
        .order_by(desc(MeetingRoom.created_at))
        .limit(20)
    )
    meetings = result.scalars().all()
    return [MeetingResponse.model_validate(m) for m in meetings]

@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    req: MeetingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    code = f"land-{uuid.uuid4().hex[:8]}"
    new_meeting = MeetingRoom(
        code=code,
        title=req.title,
        host_id=current_user.id,
        property_id=req.property_id,
        scheduled_for=req.scheduled_for,
        status="scheduled"
    )
    db.add(new_meeting)
    await db.commit()
    await db.refresh(new_meeting)
    return MeetingResponse.model_validate(new_meeting)

@router.get("/{code}", response_model=MeetingResponse)
async def get_meeting_by_code(
    code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MeetingRoom).where(MeetingRoom.code == code))
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting room not found")
    return MeetingResponse.model_validate(meeting)
