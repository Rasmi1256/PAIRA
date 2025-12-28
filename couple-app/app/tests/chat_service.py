# tests/test_chat_service.py

import pytest
from fastapi.testclient import TestClient
from your_app.main import app  # Assuming a FastAPI app and entrypoint

# This is a conceptual example. You will need to adapt it to your
# application's specific structure, especially for authentication
# and how you initialize your app for testing.

@pytest.mark.asyncio
async def test_chat_message_exchange():
    """
    Tests if two clients can connect and exchange messages.
    """
    client = TestClient(app)
    
    # You'll need a way to generate valid auth tokens for your test users.
    # This is often done using a test fixture.
    token_user_one = get_auth_token_for("user_one")
    token_user_two = get_auth_token_for("partner_of_user_one")

    # Use context managers to ensure WebSockets are properly closed.
    # Two clients connect to the chat endpoint.
    with client.websocket_connect(f"/ws/chat?token={token_user_one}") as websocket_one, \
         client.websocket_connect(f"/ws/chat?token={token_user_two}") as websocket_two:
        
        # Test: User One sends a message
        await websocket_one.send_json({"message": "Hello there!"})
        
        # Verify: User Two receives the message
        data_received_by_two = await websocket_two.receive_json()
        assert data_received_by_two["sender"] == "user_one"
        assert data_received_by_two["message"] == "Hello there!"

        # Test: User Two replies
        await websocket_two.send_json({"message": "Hi back!"})

        # Verify: User One receives the reply
        data_received_by_one = await websocket_one.receive_json()
        assert data_received_by_one["sender"] == "partner_of_user_one"
        assert data_received_by_one["message"] == "Hi back!"


@pytest.mark.asyncio
async def test_partner_disconnect_broadcast():
    """
    Tests the logic from your TODO.md: when a user disconnects, their
    partner receives an 'offline' status broadcast.
    """
    client = TestClient(app)
    token_user_one = get_auth_token_for("user_one")
    token_user_two = get_auth_token_for("partner_of_user_one")

    # User One connects first
    with client.websocket_connect(f"/ws/chat?token={token_user_one}") as websocket_one:
        # User Two connects
        with client.websocket_connect(f"/ws/chat?token={token_user_two}") as websocket_two:
            # At this point, both users are connected.
            # The inner 'with' block for websocket_two will now exit,
            # causing its connection to close.
            pass

        # Verify: User One receives the offline status update for User Two.
        # This tests the 'except WebSocketDisconnect' block you implemented.
        status_update = await websocket_one.receive_json()
        
        assert status_update["type"] == "status_update"
        assert status_update["user_id"] == "partner_of_user_one"
        assert status_update["status"] == "offline"
        assert "last_seen" in status_update

