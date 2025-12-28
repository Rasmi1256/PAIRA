from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'albums';"))
    exists = result.fetchone()
    print("albums table exists" if exists else "albums table does NOT exist")
