from typing import Any, Dict, List
import asyncio

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: Dict[int, List[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(
        self, user_id: int, websocket: WebSocket
    ) -> None:
        async with self._lock:
            if user_id not in self._connections:
                self._connections[user_id] = []
            self._connections[user_id].append(websocket)

    async def disconnect(
        self, user_id: int, websocket: WebSocket | None
    ) -> None:
        async with self._lock:
            if user_id not in self._connections:
                return

            if websocket is None:
                del self._connections[user_id]
                return

            if websocket in self._connections[user_id]:
                self._connections[user_id].remove(websocket)

            if not self._connections[user_id]:
                del self._connections[user_id]

    async def send_to_user(
        self, user_id: int, payload: Dict[str, Any]
    ) -> None:
        async with self._lock:
            sockets = list(self._connections.get(user_id, []))

        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                await self.disconnect(user_id, socket)

    def is_user_connected(self, user_id: int) -> bool:
        return bool(self._connections.get(user_id))


connection_manager = ConnectionManager()
