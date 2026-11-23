import json
import logging
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket

logger = logging.getLogger("signaling")

class ConnectionManager:
    def __init__(self):
        # user_id -> set of active WebSockets (supports multiple tabs / devices for one user)
        self.active_user_connections: Dict[int, Set[WebSocket]] = {}
        # room_id -> set of user_ids in the room
        self.active_rooms: Dict[str, Set[int]] = {}
        # websocket -> user_id
        self.socket_to_user: Dict[WebSocket, int] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_user_connections:
            self.active_user_connections[user_id] = set()
        self.active_user_connections[user_id].add(websocket)
        self.socket_to_user[websocket] = user_id
        logger.info(f"User {user_id} connected to WebSocket. Total active sessions: {len(self.active_user_connections[user_id])}")

    def disconnect(self, websocket: WebSocket):
        user_id = self.socket_to_user.get(websocket)
        if user_id and user_id in self.active_user_connections:
            self.active_user_connections[user_id].discard(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]
        if websocket in self.socket_to_user:
            del self.socket_to_user[websocket]
        
        # Remove from any rooms
        for room_id, members in list(self.active_rooms.items()):
            if user_id in members:
                members.discard(user_id)
                if not members:
                    del self.active_rooms[room_id]
        logger.info(f"User {user_id} disconnected from WebSocket.")

    async def send_to_user(self, user_id: int, message: dict) -> bool:
        """Send a JSON payload to all active sockets of a specific user."""
        sockets = self.active_user_connections.get(user_id)
        if not sockets:
            return False
        
        payload_str = json.dumps(message)
        dead_sockets = set()
        sent = False
        
        for ws in list(sockets):
            try:
                await ws.send_text(payload_str)
                sent = True
            except Exception as e:
                logger.warning(f"Error sending to user {user_id}: {e}")
                dead_sockets.add(ws)
                
        for dead in dead_sockets:
            self.disconnect(dead)
            
        return sent

    async def join_room(self, room_id: str, user_id: int):
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = set()
        self.active_rooms[room_id].add(user_id)

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user_id: Optional[int] = None):
        members = self.active_rooms.get(room_id, set())
        for uid in list(members):
            if exclude_user_id is not None and uid == exclude_user_id:
                continue
            await self.send_to_user(uid, message)

    def is_user_online(self, user_id: int) -> bool:
        return user_id in self.active_user_connections and len(self.active_user_connections[user_id]) > 0

signaling_manager = ConnectionManager()
