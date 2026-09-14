import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("database_url") or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in environment")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages'
          AND column_name = 'is_pinned'
          AND table_schema = 'public';
    """))
    if result.fetchone():
        print("✓ messages.is_pinned column already exists.")
    else:
        conn.execute(text("ALTER TABLE messages ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;"))
        conn.commit()
        print("✓ Added is_pinned column to messages table.")

print("\nDone.")
