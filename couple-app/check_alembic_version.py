from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT version_num FROM alembic_version;"))
    version = result.fetchone()
    if version:
        print("Alembic version in DB:", version[0])
    else:
        print("No alembic_version table or no version")
