from typing import Dict, Any, List
from fastapi import WebSocket
import asyncio

class ConnectionManager:
     def __init__(self) -> None:
        # user_id -> list of active WebSocket connections
        self._connections: Dict[int, List[WebSocket]] = {}

        # Lock to avoid race conditions in async environment
        self._lock = asyncio.Lock()

        async def connect(self, user_id: int, websocket: WebSocket) -> None:
            async with self._lock:
                if user_id not in self._connections:
                    self._connections[user_id] = []

                self._connections[user_id].append(websocket)

        async def disconnect(self, user_id: int, websocket: WebSocket) -> None:
             async with self.lock:
                 if user_id not in self._connections:
                     return
                 
                 if websocket is None:
                     del self._connections[user_id]
                     return 

                 if websocket in self._connections[user_id]:
                     self._connections[user_id].remove(websocket)

                 if not self._connections[user_id]:  # No more connections for this user
                     del self._connections[user_id]

        async def send_to_user(self, user_id: int, message: Dict[str, Any]) -> None: 
            async with self._lock:
                connections = self._connections.get(user_id, [])

            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except Exception:
                    # Handle exceptions (e.g., connection closed) if needed
                    await self.disconnect(user_id, websocket)

        def is_user_connected(self, user_id: int) -> bool:
            return user_id in self._connections and len(self._connections[user_id]) > 0

        connection_manager = ConnectionManager()                 



   