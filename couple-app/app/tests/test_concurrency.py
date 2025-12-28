"""
Concurrency test for invite accept flow.

IMPORTANT: for a reliable result run this test against a real Postgres instance.
Set TEST_DATABASE_URL to a postgres URL before running tests, e.g.:
  postgres://testuser:testpass@localhost:55432/testdb

Run the app separately (bound to 127.0.0.1:8000) using that DB:
  DATABASE_URL=<TEST_DATABASE_URL> uvicorn app.main:app --reload

Then run this test:
  TEST_SERVER_URL=http://127.0.0.1:8000 pytest -q app/tests/test_concurrency.py::test_simultaneous_accepts -q

Notes:
- This test spawns two processes that both call /invites/accept nearly simultaneously.
- It asserts that only one process succeeds (HTTP 200) and the other fails (HTTP 400/409/etc).
"""

import os
import multiprocessing as mp
import requests

TEST_SERVER = os.getenv("TEST_SERVER_URL", "http://127.0.0.1:8000")
TEST_DB_URL = os.getenv("TEST_DATABASE_URL")  # used only for info/warnings

def register_user(email, password, name):
    r = requests.post(f"{TEST_SERVER}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": name,
    })

    print("\n=== /auth/register RESPONSE ===")
    print("Status:", r.status_code)
    print("Body:", r.text)
    print("===============================")

    # Let the test fail explicitly so we see the body
    if r.status_code != 200 and r.status_code != 201:
        import pytest
        pytest.fail(f"/auth/register failed: {r.status_code} {r.text}")

    return r.json()["access_token"]


def create_couple_and_invite(token: str, couple_name: str = "Sim Couple"):
    headers = {"Authorization": f"Bearer {token}"}
    # create couple
    r = requests.post(f"{TEST_SERVER}/couples/", json={"name": couple_name}, headers=headers)
    r.raise_for_status()
    couple = r.json()
    # create invite
    r = requests.post(f"{TEST_SERVER}/couples/{couple['id']}/invites", headers=headers)
    r.raise_for_status()
    return couple["id"], r.json()["token"]

def accept_invite_worker(invite_token: str, auth_token: str, result_q: mp.Queue):
    """
    Worker will attempt to accept the invite using the provided auth token.
    Puts (status_code, body_json_or_text) into result_q.
    """
    try:
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        r = requests.post(f"{TEST_SERVER}/invites/accept", params={"token": invite_token}, headers=headers, timeout=10)
        try:
            body = r.json()
        except Exception:
            body = r.text
        result_q.put((r.status_code, body))
    except Exception as ex:
        result_q.put(("err", str(ex)))

def cleanup_test_users(emails_to_delete):
    """A simple cleanup utility to delete users by email to make test rerunnable."""
    try:
        # We need an authenticated user to find other users.
        # Register a temporary admin/cleanup user.
        cleanup_token = register_user("cleanup@example.com", "pw", "Cleanup User")
        headers = {"Authorization": f"Bearer {cleanup_token}"}

        for email in emails_to_delete:
            # This assumes you have a GET /users/?email=... endpoint or similar
            # For this app, we'll just try to re-register and ignore failure,
            # as there's no delete/get user endpoint. A better solution would be a dedicated cleanup endpoint.
            pass # No-op for now, but shows intent. The real fix is to reset the DB.
    except Exception:
        # If cleanup user already exists or something else fails, ignore and proceed.
        pass

def test_simultaneous_accepts():
    if TEST_DB_URL is None:
        print("WARNING: TEST_DATABASE_URL not set. The test will still run but results may be unreliable on sqlite.")
    # 1) register three users: creator (A), acceptor1 (B), acceptor2 (C)
    token_a = register_user("concur_a@example.com", "pw", "User A")
    token_b = register_user("concur_b@example.com", "pw", "User B")
    token_c = register_user("concur_c@example.com", "pw", "User C")

    # 2) A creates a couple and an invite token
    couple_id, invite_token = create_couple_and_invite(token_a, couple_name="Concurrency Test Couple")

    # 3) Spin two processes that attempt accept at same time
    q = mp.Queue()
    p1 = mp.Process(target=accept_invite_worker, args=(invite_token, token_b, q))
    p2 = mp.Process(target=accept_invite_worker, args=(invite_token, token_c, q))

    # Start both processes as close together as possible
    p1.start()
    p2.start()

    # Join
    p1.join(timeout=15)
    p2.join(timeout=15)

    # Collect results
    results = []
    while not q.empty():
        results.append(q.get())

    # Cleanup processes if still alive
    if p1.is_alive():
        p1.terminate()
    if p2.is_alive():
        p2.terminate()

    # At least one should succeed (200) and the other should fail (400 or similar).
    success_count = sum(1 for r in results if r[0] == 200)
    fail_count = sum(1 for r in results if r[0] != 200)

    # Print details for debug
    print("Concurrency accept results:", results)

    assert success_count == 1, f"Expected exactly 1 success, got {success_count}. Results: {results}"
    assert fail_count == 1, f"Expected 1 failure, got {fail_count}. Results: {results}"
