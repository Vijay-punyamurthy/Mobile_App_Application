import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_token
from app.services.signaling import signaling_manager

logger = logging.getLogger("ws_signaling")
router = APIRouter(tags=["WebSocket Real-Time & WebRTC Signaling"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # Authenticate via JWT token
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=4001, reason="Unauthorized or invalid token")
        return
        
    try:
        user_id = int(payload["sub"])
    except ValueError:
        await websocket.close(code=4002, reason="Invalid token subject")
        return
        
    await signaling_manager.connect(user_id, websocket)
    
    # Broadcast user online
    await websocket.send_text(json.dumps({
        "type": "connection:established",
        "user_id": user_id,
        "role": payload.get("role")
    }))
    
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except Exception:
                continue
                
            msg_type = data.get("type")
            target_id = data.get("target_id")
            
            # --- WebRTC P2P Signaling ---
            if msg_type == "rtc:offer":
                # Forward SDP offer to target peer
                if target_id:
                    await signaling_manager.send_to_user(int(target_id), {
                        "type": "rtc:offer",
                        "sender_id": user_id,
                        "room_id": data.get("room_id"),
                        "sdp": data.get("sdp")
                    })
                    
            elif msg_type == "rtc:answer":
                # Forward SDP answer to target peer
                if target_id:
                    await signaling_manager.send_to_user(int(target_id), {
                        "type": "rtc:answer",
                        "sender_id": user_id,
                        "room_id": data.get("room_id"),
                        "sdp": data.get("sdp")
                    })
                    
            elif msg_type == "rtc:ice":
                # Forward ICE candidate to target peer
                if target_id:
                    await signaling_manager.send_to_user(int(target_id), {
                        "type": "rtc:ice",
                        "sender_id": user_id,
                        "candidate": data.get("candidate")
                    })
                    
            # --- Call State Events ---
            elif msg_type == "call:accept":
                if target_id:
                    await signaling_manager.send_to_user(int(target_id), {
                        "type": "call:accepted",
                        "room_id": data.get("room_id"),
                        "receiver_id": user_id
                    })
                    
            elif msg_type == "call:reject":
                if target_id:
                    await signaling_manager.send_to_user(int(target_id), {
                        "type": "call:rejected",
                        "room_id": data.get("room_id"),
                        "receiver_id": user_id
                    })
                    
            elif msg_type == "call:end":
                if target_id:
                    await signaling_manager.send_to_user(int(target_id), {
                        "type": "call:ended",
                        "room_id": data.get("room_id")
                    })
                    
            # --- Meeting Room Multipoint / Broadcast ---
            elif msg_type == "room:join":
                room_id = data.get("room_id")
                if room_id:
                    await signaling_manager.join_room(room_id, user_id)
                    await signaling_manager.broadcast_to_room(room_id, {
                        "type": "room:user_joined",
                        "room_id": room_id,
                        "user_id": user_id
                    }, exclude_user_id=user_id)
                    
            elif msg_type == "room:signal":
                room_id = data.get("room_id")
                if room_id:
                    await signaling_manager.broadcast_to_room(room_id, {
                        "type": "room:signal",
                        "room_id": room_id,
                        "sender_id": user_id,
                        "payload": data.get("payload")
                    }, exclude_user_id=user_id)
                    
            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        signaling_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        signaling_manager.disconnect(websocket)
