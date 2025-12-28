from app.models.invite import CoupleInvite
from app.models.couple import Couple
from app.models.user import User
import pytest

def test_invite_and_accept_flow(client):
    # Register user A and create couple
    r = client.post("/auth/register", json={"email": "alpha@example.com", "password": "pw", "full_name": "Alpha"})
    assert r.status_code == 200
    token_a = r.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    r = client.post("/couples/", headers=headers_a, json={"name": "Alpha & Beta"})
    assert r.status_code == 200
    couple = r.json()
    couple_id = couple["id"]

    # Create invite by A
    r = client.post(f"/couples/{couple_id}/invites", headers=headers_a)
    assert r.status_code == 200
    invite_obj = r.json()
    assert "token" in invite_obj
    invite_token = invite_obj["token"]

    # Register user B
    r = client.post("/auth/register", json={"email": "beta@example.com", "password": "pw", "full_name": "Beta"})
    assert r.status_code == 200
    token_b = r.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Accept invite with B
    r = client.post("/invites/accept", headers=headers_b, json={"token": invite_token})
    assert r.status_code == 200
    assert r.json().get("couple_id") == couple_id

    # Attempt to accept same invite again (should fail)
    r = client.post("/invites/accept", headers=headers_b, json={"token": invite_token})
    assert r.status_code == 400

def test_couple_full_rejects_third_user(client):
    # Register user X, create couple C and invite Y
    r = client.post("/auth/register", json={"email": "x1@example.com", "password":"pw", "full_name":"X1"})
    token_x1 = r.json()["access_token"]
    headers_x1 = {"Authorization": f"Bearer {token_x1}"}

    r = client.post("/couples/", headers=headers_x1, json={"name":"X1 & X2"})
    couple_id = r.json()["id"]

    # Create invite and accept with Y (second partner)
    r = client.post(f"/couples/{couple_id}/invites", headers=headers_x1)
    token = r.json()["token"]

    r = client.post("/auth/register", json={"email": "x2@example.com", "password":"pw", "full_name":"X2"})
    token_x2 = r.json()["access_token"]
    headers_x2 = {"Authorization": f"Bearer {token_x2}"}

    r = client.post("/invites/accept", headers=headers_x2, json={"token": token})
    assert r.status_code == 200

    # Now try registering a third user and accepting (should be rejected)
    r = client.post("/auth/register", json={"email": "x3@example.com", "password":"pw", "full_name":"X3"})
    token_x3 = r.json()["access_token"]
    headers_x3 = {"Authorization": f"Bearer {token_x3}"}

    # Create a new invite by one of existing partners
    r = client.post(f"/couples/{couple_id}/invites", headers=headers_x1)
    new_token = r.json()["token"]

    r = client.post("/invites/accept", headers=headers_x3, json={"token": new_token})
    assert r.status_code == 400
    assert "full" in r.json().get("detail", "").lower() or "already" in r.json().get("detail", "").lower()
