"""
app/ws/video_call.py

WebSocket signaling handler for video calls
(FINAL VERSION – call locks enforced).

ADDED:
- User call locking (prevents parallel calls)
"""

from uuid import UUID
from typing import Dict, Any
import asyncio

from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db, SessionLocal
from app.api.deps import get_current_user_ws
from app.models.user import User
from app.models.video_call import VideoCall
from app.api.video_call import VideoCallService
from app.api.call_timeout_service import CallTimeoutService
from app.api.user_call_lock_service import UserCallLockService
from app.api.v1.call_notification_service import CallNotificationService
from app.ws.connection_manager import connection_manager
from app.ws.heartbeat import HeartbeatHandler


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------

def _get_call_or_raise(db: Session, call_id: UUID) -> VideoCall:
    call = db.query(VideoCall).filter(VideoCall.id == call_id).first()
    if not call:
        raise ValueError("Call not found")
    return call


def _get_other_participant(call: VideoCall, user_id: int) -> int:
    if user_id == call.caller_id:
        return call.callee_id
    if user_id == call.callee_id:
        return call.caller_id
    raise ValueError("User is not part of this call")


async def _handle_call_timeout(call_id: UUID) -> None:
    """
    Handles post-timeout signaling so callers do not remain stuck in "calling".
    """
    timed_out = await CallTimeoutService.schedule_timeout(
        db_factory=SessionLocal,
        call_id=call_id,
    )

    if not timed_out:
        return

    db = SessionLocal()
    try:
        call = _get_call_or_raise(db, call_id)

        # Release call locks when call becomes missed.
        await UserCallLockService.release_for_users(
            user_ids=[call.caller_id, call.callee_id],
        )

        payload = {
            "type": "call_missed",
            "call_id": str(call.id),
        }

        await connection_manager.send_to_user(
            user_id=call.caller_id,
            payload=payload,
        )
        await connection_manager.send_to_user(
            user_id=call.callee_id,
            payload=payload,
        )
    finally:
        db.close()


# ---------------------------------------------------------
# WEBSOCKET ENDPOINT
# ---------------------------------------------------------

async def video_call_ws(
    websocket: WebSocket,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_ws),
):
    await websocket.accept()

    await connection_manager.connect(
        user_id=current_user.id,
        websocket=websocket,
    )

    await HeartbeatHandler.on_connect(current_user.id)

    try:
        while True:
            message: Dict[str, Any] = await websocket.receive_json()
            message_type = message.get("type")

            # ---------------------------------------------
            # HEARTBEAT
            # ---------------------------------------------
            if message_type == "ping":
                await HeartbeatHandler.on_ping(
                    current_user.id,
                    websocket,
                )
                continue

            # ---------------------------------------------
            # CALL INITIATE
            # ---------------------------------------------
            if message_type == "call_initiate":
                callee_id = message.get("callee_id")

                # Create call first (DB source of truth)
                call = VideoCallService.initiate_call(
                    db=db,
                    caller=current_user,
                    callee_id=callee_id,
                )

                # Acquire distributed call locks
                await UserCallLockService.acquire_for_users(
                    user_ids=[current_user.id, callee_id],
                    call_id=call.id,
                )

                # Schedule missed-call timeout
                asyncio.create_task(
                    _handle_call_timeout(call.id)
                )

                await connection_manager.send_to_user(
                    user_id=callee_id,
                    payload={
                        "type": "incoming_call",
                        "call_id": str(call.id),
                        "caller_id": current_user.id,
                    },
                )

                # Notify via push if offline
                await CallNotificationService.notify_incoming_call(
                    callee_id=callee_id,
                    caller_id=current_user.id,
                    call_id=str(call.id),
                )

            # ---------------------------------------------
            # CALL ACCEPT
            # ---------------------------------------------
            elif message_type == "call_accept":
                call_id = UUID(message.get("call_id"))

                call = VideoCallService.accept_call(
                    db=db,
                    call_id=call_id,
                    user=current_user,
                )

                await CallTimeoutService.cancel_timeout(call.id)

                await connection_manager.send_to_user(
                    user_id=call.caller_id,
                    payload={
                        "type": "call_accepted",
                        "call_id": str(call.id),
                    },
                )

            # ---------------------------------------------
            # CALL REJECT
            # ---------------------------------------------
            elif message_type == "call_reject":
                call_id = UUID(message.get("call_id"))

                call = VideoCallService.reject_call(
                    db=db,
                    call_id=call_id,
                    user=current_user,
                )

                await CallTimeoutService.cancel_timeout(call.id)

                # Release call locks
                await UserCallLockService.release_for_users(
                    user_ids=[call.caller_id, call.callee_id],
                )

                await connection_manager.send_to_user(
                    user_id=call.caller_id,
                    payload={
                        "type": "call_rejected",
                        "call_id": str(call.id),
                    },
                )

            # ---------------------------------------------
            # CALL END
            # ---------------------------------------------
            elif message_type == "call_end":
                call_id = UUID(message.get("call_id"))

                call = VideoCallService.end_call(
                    db=db,
                    call_id=call_id,
                    user=current_user,
                )

                # Release call locks
                await UserCallLockService.release_for_users(
                    user_ids=[call.caller_id, call.callee_id],
                )

                other_user_id = _get_other_participant(
                    call,
                    current_user.id,
                )

                await connection_manager.send_to_user(
                    user_id=other_user_id,
                    payload={
                        "type": "call_ended",
                        "call_id": str(call.id),
                    },
                )

            # ---------------------------------------------
            # WEBRTC SIGNALING (SECURE)
            # ---------------------------------------------
            elif message_type in {
                "webrtc_offer",
                "webrtc_answer",
                "ice_candidate",
            }:
                call_id = UUID(message.get("call_id"))

                call = _get_call_or_raise(db, call_id)
                target_user_id = _get_other_participant(
                    call,
                    current_user.id,
                )

                await connection_manager.send_to_user(
                    user_id=target_user_id,
                    payload={
                        **message,
                        "call_id": str(call.id),
                    },
                )

            else:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Unknown message type",
                    }
                )

    except WebSocketDisconnect:
        await connection_manager.disconnect(
            current_user.id,
            websocket,
        )
        await HeartbeatHandler.on_disconnect(current_user.id)
