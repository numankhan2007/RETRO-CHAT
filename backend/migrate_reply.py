"""
One-shot migration: Add reply_to_id to messages table.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("database_url") or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in environment")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check if column exists
    result = conn.execute(text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages'
          AND column_name = 'reply_to_id'
          AND table_schema = 'public';
    """))
    if result.fetchone():
        print("✓ messages.reply_to_id column already exists.")
    else:
        conn.execute(text("ALTER TABLE messages ADD COLUMN reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL;"))
        conn.commit()
        print("✓ Added reply_to_id column to messages table.")

print("\nDone.")
