import time
from typing import Optional 

from app.redis.client import redis_client
from app.redis.keys import presence_key

PRESENCE_TTL_SECONDS = 30

class PresenceManager:

    async def heartbeat(self, user_id : int) -> None:
        key = presence_key(user_id)
        await redis_client.set(
            key,
            int(time.time()),
            ex = PRESENCE_TTL_SECONDS,
        )

    async def mark_offline(self, user_id : int) -> None:
        key = presence_key(user_id)
        await redis_client.delete(key)

    async def is_online(self, user_id : int) -> bool:
        key = presence_key(user_id)
        return await redis_client.exists(key) == 1

    async def last_seen(self, user_id : int) -> Optional[int]:
        key = presence_key(user_id)
        value = await redis_client.get(key)

        if value is None:
            return None
        return int(value)

presence_manager = PresenceManager()
    
