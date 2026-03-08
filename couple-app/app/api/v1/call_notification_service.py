"""
app/services/call_notification_service.py

Handles push notification logic for video calls.

RESPONSIBILITIES:
- Decide whether a push notification is needed
- Trigger push notification for offline users or disconnected users
- Stay provider-agnostic (FCM / APNs / OneSignal later)

DESIGN RULES:
- No WebSocket logic
- No FastAPI routes
- No hard dependency on a push provider
"""

from app.ws.presence_manager import presence_manager
from app.ws.connection_manager import connection_manager


class CallNotificationService:
    """
    Service for notifying users about incoming calls.
    """

    @staticmethod
    async def notify_incoming_call(
        callee_id: int,
        caller_id: int,
        call_id: str,
    ) -> None:
        """
        Sends a push notification if the callee has no active WebSocket connections.
        """

        has_ws_connection = connection_manager.is_user_connected(callee_id)

        # If user has active WebSocket connection, it will handle the notification
        if has_ws_connection:
            return

        # -------------------------------------------------
        # PUSH NOTIFICATION PLACEHOLDER
        # -------------------------------------------------
        # This is where you integrate:
        # - Firebase Cloud Messaging (Android/Web)
        # - APNs (iOS)
        # - OneSignal / Expo
        # -------------------------------------------------

        payload = {
            "type": "incoming_call",
            "call_id": call_id,
            "caller_id": caller_id,
        }

        # Example (pseudo-code):
        #
        # await push_provider.send(
        #     user_id=callee_id,
        #     title="Incoming Video Call ❤️",
        #     body="Your partner is calling you",
        #     data=payload,
        # )

        # For now, we just log
        print(
            f"[CALL NOTIFY] User {callee_id} has no WS connection. "
            f"Send push notification: {payload}"
        )
