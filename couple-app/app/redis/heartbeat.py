"""
app/ws/heartbeat.py

WebSocket heartbeat handler.

RESPONSIBILITIES:
- Keep user marked as online in Redis
- Handle periodic heartbeat messages from client
- Decouple presence logic from video call logic

DESIGN RULES:
- No business logic
- No video call logic
- No database access
"""

from fastapi import WebSocket
from app.ws.presence_manager import presence_manager


class HeartbeatHandler:
    """
    Handles heartbeat pings over WebSocket.
    """

    @staticmethod
    async def on_connect(user_id: int) -> None:
        """
        Called when WebSocket connection is established.
        Marks user as online immediately.
        """
        await presence_manager.heartbeat(user_id)

    @staticmethod
    async def on_ping(user_id: int, websocket: WebSocket) -> None:
        """
        Called when client sends a heartbeat ping.

        Expected client message:
        {
            "type": "ping"
        }
        """
        await presence_manager.heartbeat(user_id)

        # Optional pong response (helps frontend debugging)
        await websocket.send_json(
            {
                "type": "pong"
            }
        )

    @staticmethod
    async def on_disconnect(user_id: int) -> None:
        """
        Called on clean WebSocket disconnect.
        """
        await presence_manager.mark_offline(user_id)
