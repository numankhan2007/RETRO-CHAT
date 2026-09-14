import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("database_url") or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in environment")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Add is_pinned
    result = conn.execute(text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'comments'
          AND column_name = 'is_pinned'
          AND table_schema = 'public';
    """))
    if result.fetchone():
        print("✓ comments.is_pinned column already exists.")
    else:
        conn.execute(text("ALTER TABLE comments ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;"))
        print("✓ Added is_pinned column to comments table.")

    # Add parent_id
    result = conn.execute(text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'comments'
          AND column_name = 'parent_id'
          AND table_schema = 'public';
    """))
    if result.fetchone():
        print("✓ comments.parent_id column already exists.")
    else:
        conn.execute(text("ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL;"))
        print("✓ Added parent_id column to comments table.")

    conn.commit()

print("\nMigration Done.")
