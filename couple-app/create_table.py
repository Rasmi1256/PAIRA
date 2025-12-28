from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('''
        CREATE TABLE pairing_codes (
            code VARCHAR(8) PRIMARY KEY,
            generating_user_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used_at TIMESTAMP WITH TIME ZONE,
            completing_user_id INTEGER REFERENCES users(id)
        );
    '''))
    conn.commit()
    print('Table pairing_codes created successfully')
