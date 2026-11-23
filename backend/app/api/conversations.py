from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List
from app.database.session import get_db
from app.core.rbac import get_current_user
from app.models.user import User
from app.models.chat import Conversation, ConversationParticipant, Message
from app.schemas.chat import (
    ConversationResponse,
    ConversationCreate,
    MessageCreate,
    MessageResponse
)
from app.services.signaling import signaling_manager

router = APIRouter(prefix="/conversations", tags=["In-App Messaging"])

@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find all conversations current user is part of
    result = await db.execute(
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(ConversationParticipant.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    convos = result.scalars().all()
    
    response = []
    for c in convos:
        c_model = ConversationResponse.model_validate(c)
        if c.messages:
            c_model.last_message = MessageResponse.model_validate(c.messages[-1])
        response.append(c_model)
    return response

@router.post("", response_model=ConversationResponse)
async def create_or_get_conversation(
    req: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.participant_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start conversation with yourself"
        )
        
    # Check if target user exists
    target = await db.execute(select(User).where(User.id == req.participant_user_id))
    if not target.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant user not found")
        
    # Check if a 1-on-1 conversation already exists between these two users
    stmt = (
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(ConversationParticipant.user_id.in_([current_user.id, req.participant_user_id]))
        .group_by(Conversation.id)
    )
    result = await db.execute(stmt)
    convos = result.scalars().all()
    
    existing = None
    for c in convos:
        u_ids = {p.user_id for p in c.participants}
        if u_ids == {current_user.id, req.participant_user_id}:
            if req.property_id is None or c.property_id == req.property_id:
                existing = c
                break
                
    if existing:
        c_model = ConversationResponse.model_validate(existing)
        if existing.messages:
            c_model.last_message = MessageResponse.model_validate(existing.messages[-1])
        return c_model
        
    # Create new conversation
    new_convo = Conversation(property_id=req.property_id)
    db.add(new_convo)
    await db.flush()
    
    p1 = ConversationParticipant(conversation_id=new_convo.id, user_id=current_user.id)
    p2 = ConversationParticipant(conversation_id=new_convo.id, user_id=req.participant_user_id)
    db.add_all([p1, p2])
    
    if req.initial_message:
        msg = Message(
            conversation_id=new_convo.id,
            sender_id=current_user.id,
            content=req.initial_message,
            message_type="text"
        )
        db.add(msg)
        
    await db.commit()
    await db.refresh(new_convo)
    
    c_model = ConversationResponse.model_validate(new_convo)
    if new_convo.messages:
        c_model.last_message = MessageResponse.model_validate(new_convo.messages[-1])
    return c_model

@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    convo = result.scalar_one_or_none()
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
    # Security / Authorization: User must be a participant in this conversation!
    participant_ids = {p.user_id for p in convo.participants}
    if current_user.id not in participant_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view messages in this conversation."
        )
        
    return [MessageResponse.model_validate(m) for m in convo.messages]

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: int,
    req: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    convo = result.scalar_one_or_none()
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
    # Security / Authorization: User must be a participant in this conversation!
    participant_ids = {p.user_id for p in convo.participants}
    if current_user.id not in participant_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to send messages in this conversation."
        )
        
    new_msg = Message(
        conversation_id=convo.id,
        sender_id=current_user.id,
        content=req.content,
        message_type=req.message_type,
        media_url=req.media_url
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)
    
    msg_dict = MessageResponse.model_validate(new_msg).model_dump(mode="json")
    
    # Broadcast to other participants in real time via WebSocket
    for p_id in participant_ids:
        if p_id != current_user.id:
            await signaling_manager.send_to_user(p_id, {
                "type": "chat:message",
                "conversation_id": conversation_id,
                "message": msg_dict
            })
            
    return MessageResponse.model_validate(new_msg)
