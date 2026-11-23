from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from datetime import datetime, timezone
from typing import List
from app.database.session import get_db
from app.core.rbac import get_current_user
from app.models.user import User
from app.models.call import Call
from app.schemas.call import (
    CallInitiateRequest,
    CallStatusUpdateRequest,
    CallResponse
)
from app.services.signaling import signaling_manager

router = APIRouter(prefix="/calls", tags=["Audio & Video Calling"])

@router.get("/history", response_model=List[CallResponse])
async def get_call_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Call)
        .where(or_(Call.caller_id == current_user.id, Call.receiver_id == current_user.id))
        .order_by(desc(Call.started_at))
        .limit(50)
    )
    result = await db.execute(stmt)
    calls = result.scalars().all()
    return [CallResponse.model_validate(c) for c in calls]

@router.post("/initiate", response_model=CallResponse, status_code=status.HTTP_201_CREATED)
async def initiate_call(
    req: CallInitiateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.receiver_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot place a call to yourself"
        )
        
    receiver_res = await db.execute(select(User).where(User.id == req.receiver_id))
    receiver = receiver_res.scalar_one_or_none()
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver user not found")
        
    new_call = Call(
        caller_id=current_user.id,
        receiver_id=req.receiver_id,
        call_type=req.call_type,
        status="initiated",
        room_id=req.room_id
    )
    db.add(new_call)
    await db.commit()
    await db.refresh(new_call)
    
    # Send incoming call event to receiver via WebSocket
    caller_name = current_user.profile.full_name if current_user.profile else current_user.email
    await signaling_manager.send_to_user(req.receiver_id, {
        "type": "call:incoming",
        "room_id": req.room_id,
        "caller_id": current_user.id,
        "caller_name": caller_name,
        "caller_avatar": current_user.profile.avatar_url if current_user.profile else None,
        "call_type": req.call_type,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return CallResponse.model_validate(new_call)

@router.post("/{room_id}/status", response_model=CallResponse)
async def update_call_status(
    room_id: str,
    req: CallStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Call).where(Call.room_id == room_id))
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call record not found")
        
    if current_user.id != call.caller_id and current_user.id != call.receiver_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized call record access")
        
    call.status = req.status
    if req.status in ["ended", "rejected", "missed"]:
        call.ended_at = datetime.now(timezone.utc)
        if req.duration_seconds:
            call.duration_seconds = req.duration_seconds
            
    await db.commit()
    await db.refresh(call)
    
    # Notify peer
    peer_id = call.receiver_id if current_user.id == call.caller_id else call.caller_id
    await signaling_manager.send_to_user(peer_id, {
        "type": f"call:{req.status}",
        "room_id": room_id,
        "duration_seconds": call.duration_seconds
    })
    
    return CallResponse.model_validate(call)
