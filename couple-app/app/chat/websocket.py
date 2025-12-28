from fastapi import WebSocket, WebSocketDisconnect, Depends, APIRouter
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import Dict, List, Union

from app.db.session import get_db
from app.chat import models
from app.chat.presence_manager import presence_manager
from app.api.deps import get_current_user_ws

# CHANGED: UUID to int for dictionary keys
active_connections: Dict[int, List[WebSocket]] = {}

ws_router = APIRouter(prefix="/ws", tags=["WebSocket"])


# CHANGED: UUID to int
async def connect(conversation_id: int, websocket: WebSocket):
    await websocket.accept()
    if conversation_id not in active_connections:
        active_connections[conversation_id] = []
    active_connections[conversation_id].append(websocket)


# CHANGED: UUID to int
async def disconnect(conversation_id: int, websocket: WebSocket):
    if conversation_id in active_connections:
        if websocket in active_connections[conversation_id]:
            active_connections[conversation_id].remove(websocket)
            # Optional: Clean up empty lists
            if not active_connections[conversation_id]:
                del active_connections[conversation_id]


# CHANGED: UUID to int
async def broadcast(conversation_id: int, message: dict):
    # Create a copy of the list to avoid "dictionary changed size during iteration" errors
    connections = active_connections.get(conversation_id, []).copy()
    for connection in connections:
        try:
            await connection.send_json(message)
        except Exception:
            # Handle stale connections if necessary
            pass


@ws_router.websocket("/chat/{conversation_id}")
async def chat_socket(
    websocket: WebSocket,
    conversation_id: int,  # CHANGED: UUID to int
    db: Session = Depends(get_db),
    user=Depends(get_current_user_ws)
):
    # 1. Validate the conversation exists and user is part of it
    conv = db.query(models.ChatConversation).filter_by(id=conversation_id).first()

    if not conv or user.id not in [conv.user1_id, conv.user2_id]:
        await websocket.close(code=4003) # Close with "Forbidden" code
        return

    # 2. Update presence
    presence_manager.user_connected(user.id)
    
    # Notify partner that user is online
    partner_id = conv.user1_id if conv.user2_id == user.id else conv.user2_id
    # Note: You might want to broadcast this to all user's chats, 
    # but for now we broadcast to this specific conversation context
    await broadcast(
        conversation_id,
        {"type": "online_status", "user_id": user.id, "status": "online"},
    )

    # 3. Accept Connection
    await connect(conversation_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")

            # typing start
            if event == "typing_start":
                await broadcast(
                    conversation_id,
                    {"type": "typing", "user_id": user.id, "status": "start"},
                )
                continue

            # typing stop
            if event == "typing_stop":
                await broadcast(
                    conversation_id,
                    {"type": "typing", "user_id": user.id, "status": "stop"},
                )
                continue

            # send message
            if event == "message":
                msg = models.Message(
                    conversation_id=conversation_id,
                    sender_id=user.id,
                    receiver_id=data["receiver_id"],
                    message_text=data.get("message_text"),
                    media_id=data.get("media_id"),
                )

                db.add(msg)
                db.commit()
                db.refresh(msg)

                media_data = None
                if msg.media:
                    media_data = {
                        "id": msg.media.id,
                        "key": msg.media.key,
                        "file_name": msg.media.file_name,
                        "file_type": msg.media.file_type,
                        "file_size": msg.media.file_size,
                    }

                await broadcast(
                    conversation_id,
                    {
                        "type": "message",
                        "id": str(msg.id),
                        "sender_id": msg.sender_id,
                        "receiver_id": msg.receiver_id,
                        "message_text": msg.message_text,
                        "media": media_data,
                        "created_at": str(msg.created_at),
                    },
                )

                await broadcast(
                    conversation_id,
                    {"type": "delivered", "message_id": str(msg.id)},
                )

                continue

            # seen
            if event == "seen":
                message_id = data.get("message_id")

                msg = (
                    db.query(models.Message)
                    .filter(
                        models.Message.id == message_id,
                        models.Message.conversation_id == conversation_id,
                        models.Message.receiver_id == user.id,
                    )
                    .first()
                )

                if msg and not msg.is_read:
                    msg.is_read = True
                    msg.seen_at = func.now()
                    db.commit()

                    await broadcast(
                        conversation_id,
                        {"type": "seen", "message_id": str(msg.id)},
                    )

                continue

    except WebSocketDisconnect:
        await disconnect(conversation_id, websocket)

        became_offline = presence_manager.user_disconnected(user.id)

        if became_offline:
            last_seen = presence_manager.update_last_seen(db, user.id)

            await broadcast(
                conversation_id,
                {
                    "type": "online_status",
                    "user_id": user.id,
                    "status": "offline",
                    "last_seen": str(last_seen),
                },
            )