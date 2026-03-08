"""
app/services/user_call_lock_service.py

Prevents users from participating in multiple simultaneous calls.

RESPONSIBILITIES:
- Ensure a user can only have ONE active/ringing call
- Use Redis for distributed locking
- Be safe across multiple FastAPI instances

DESIGN RULES:
- No WebSocket logic
- No FastAPI routes
- No database access
"""

from typing import Iterable
from uuid import UUID

from app.redis.client import redis_client
from app.redis.keys import user_call_lock_key


# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------

# Max time (seconds) a user can be locked into a call.
# Should be >= max call duration or refreshed periodically.
USER_CALL_LOCK_TTL = 60 * 60  # 1 hour


class UserCallLockService:
    """
    Distributed lock to prevent parallel calls per user.
    """

    # -----------------------------------------------------
    # ACQUIRE LOCK
    # -----------------------------------------------------
    @staticmethod
    async def acquire_for_users(
        user_ids: Iterable[int],
        call_id: UUID,
    ) -> None:
        """
        Acquires call locks for all given users.

        Raises ValueError if any user is already locked.
        """
        user_ids = list(set(user_ids))

        # First, check if any user is already in a call
        for user_id in user_ids:
            key = user_call_lock_key(user_id)
            if await redis_client.exists(key):
                raise ValueError(
                    f"User {user_id} is already in another call"
                )

        # Acquire locks
        for user_id in user_ids:
            key = user_call_lock_key(user_id)
            await redis_client.set(
                key,
                str(call_id),
                ex=USER_CALL_LOCK_TTL,
            )

    # -----------------------------------------------------
    # RELEASE LOCK
    # -----------------------------------------------------
    @staticmethod
    async def release_for_users(
        user_ids: Iterable[int],
    ) -> None:
        """
        Releases call locks for users.
        """
        for user_id in set(user_ids):
            await redis_client.delete(user_call_lock_key(user_id))
