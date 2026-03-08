from fastapi import WebSocket

from app.ws.presence_manager import presence_manager


class HeartbeatHandler:
    @staticmethod
    async def on_connect(user_id: int) -> None:
        await presence_manager.heartbeat(user_id)

    @staticmethod
    async def on_ping(
        user_id: int, websocket: WebSocket
    ) -> None:
        await presence_manager.heartbeat(user_id)
        await websocket.send_json({"type": "pong"})

    @staticmethod
    async def on_disconnect(user_id: int) -> None:
        await presence_manager.mark_offline(user_id)
