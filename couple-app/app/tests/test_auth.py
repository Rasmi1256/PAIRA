import json

def test_register_and_login(client):
    # Register user A
    resp = client.post("/auth/register", json={"email": "a@example.com", "password": "password", "full_name": "User A"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body

    token = body["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Try creating a couple to ensure auth works
    resp = client.post("/couples/", json={"name": "A & B"}, headers=headers)
    assert resp.status_code == 200
    couple = resp.json()
    assert couple["name"] == "A & B"
    assert "id" in couple

    # Register user B
    resp = client.post("/auth/register", json={"email": "b@example.com", "password": "password", "full_name": "User B"})
    assert resp.status_code == 200
    body_b = resp.json()
    assert "access_token" in body_b
