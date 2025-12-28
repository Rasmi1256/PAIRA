# Couple App - Step 1 (Auth + Couple pairing + Invite flow)

## Overview

This is a FastAPI application implementing user authentication, couple pairing, and invite flow for joining couples.

## Project Structure

- `app/`: Main application package containing:
  - `api/`: API routes for auth, couples, invites
  - `models/`: SQLAlchemy ORM models
  - `schemas/`: Pydantic schemas
  - `core/`: Security utilities
  - `db/`: Database session and base classes
  - `main.py`: Application entrypoint

## Setup & Run

1. Start PostgreSQL:

```bash
docker-compose up -d
```

2. Create and activate Python virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the application:

```bash
uvicorn app.main:app --reload
```

## Usage Examples (via curl)

- Register user A:

```bash
curl -X POST "http://127.0.0.1:8000/auth/register" -H "Content-Type: application/json" -d '{"email":"a@example.com","password":"pass"}'
```

- Use returned token for authorization:

```
Authorization: Bearer <token>
```

- Create a couple:

```bash
curl -X POST "http://127.0.0.1:8000/couples/" -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"name":"A & B"}'
```

- Create invite:

```bash
curl -X POST "http://127.0.0.1:8000/couples/1/invites" -H "Authorization: Bearer <token>"
```

- Register user B and accept invite:

```bash
curl -X POST "http://127.0.0.1:8000/invites/accept" -H "Authorization: Bearer <token_b>" -H "Content-Type: application/json" -d '{"token":"<invite_token>"}'
```

## Notes

- Currently uses synchronous SQLAlchemy for simplicity.
- Can be refactored to async later if needed.
- Includes token authentication with JWT.
