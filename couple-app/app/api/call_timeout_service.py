"""
app/services/call_timeout_service.py

Handles automatic timeout of unanswered video calls.

RESPONSIBILITIES:
- Mark ringing calls as MISSED after timeout
- Be safe across multiple servers
- Avoid duplicate execution using Redis locks

DESIGN RULES:
- No WebSocket logic
- No FastAPI routes
- Pure background-safe business logic
"""

import asyncio
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.video_call import VideoCall
from app.redis.client import redis_client
from app.redis.keys import active_call_key
from app.api.video_call import VideoCallService


# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------

# How long the phone rings (seconds)
CALL_RING_TIMEOUT_SECONDS = 30


class CallTimeoutService:
    """
    Handles ringing call timeouts.
    """

    @staticmethod
    async def schedule_timeout(
        db_factory,
        call_id: UUID,
    ) -> bool:
        """
        Schedule a timeout check for a ringing call.

        db_factory:
            A callable that returns a new DB session.
            This avoids reusing stale sessions.
        """

        redis_key = active_call_key(str(call_id))

        # Store call as active (used as a lock + reference)
        await redis_client.set(redis_key, "ringing", ex=CALL_RING_TIMEOUT_SECONDS)

        # Wait for timeout duration
        await asyncio.sleep(CALL_RING_TIMEOUT_SECONDS)

        # If key is gone, call was answered/rejected
        if not await redis_client.exists(redis_key):
            return False

        # Timeout expired → mark call as MISSED
        db: Session = db_factory()

        try:
            call = (
                db.query(VideoCall)
                .filter(VideoCall.id == call_id)
                .first()
            )

            if not call:
                return False

            # Only ringing calls can become missed
            if call.status != "ringing":
                return False

            VideoCallService._transition_call(
                db=db,
                call=call,
                new_status="missed",
            )

            call.ended_at = datetime.utcnow()
            db.commit()
            return True

        finally:
            # Cleanup redis key & DB session
            await redis_client.delete(redis_key)
            db.close()

    # -----------------------------------------------------
    # CANCEL TIMEOUT
    # -----------------------------------------------------

    @staticmethod
    async def cancel_timeout(call_id: UUID) -> None:
        """
        Cancel a scheduled timeout (call accepted/rejected).
        """
        await redis_client.delete(active_call_key(str(call_id)))
