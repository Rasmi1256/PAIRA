from app.db.session import engine
from sqlalchemy import text

# SQL to create albums table
create_albums_table = """
CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    album_type VARCHAR DEFAULT 'user_created' NOT NULL,
    is_smart_collection BOOLEAN DEFAULT FALSE NOT NULL,
    smart_criteria VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""

# SQL to create tags table
create_tags_table = """
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    color VARCHAR DEFAULT '#3B82F6' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""

# SQL to add missing columns to media table
add_media_columns = """
ALTER TABLE media ADD COLUMN IF NOT EXISTS album_id INTEGER REFERENCES albums(id);
ALTER TABLE media ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS tags JSON DEFAULT '[]' NOT NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS description TEXT;
"""

with engine.connect() as conn:
    try:
        # Create albums table
        conn.execute(text(create_albums_table))
        print("Created albums table")

        # Create tags table
        conn.execute(text(create_tags_table))
        print("Created tags table")

        # Add missing columns to media table
        conn.execute(text(add_media_columns))
        print("Added missing columns to media table")

        conn.commit()
        print("All changes committed successfully")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
