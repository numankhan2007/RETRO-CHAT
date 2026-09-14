"""
One-shot migration: TIMESTAMP → TIMESTAMPTZ + add otp_attempts column.

Run this once against the live Supabase database:
    python migrate_timestamptz.py

What it does:
  1. Queries information_schema for all 'timestamp without time zone' columns
  2. ALTERs each to TIMESTAMPTZ using 'AT TIME ZONE UTC' (all existing values are UTC)
  3. Adds the otp_attempts column to users if it doesn't already exist
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
    # --- Step 1: Find all naive TIMESTAMP columns ---
    result = conn.execute(text("""
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE data_type = 'timestamp without time zone'
          AND table_schema = 'public'
        ORDER BY table_name, column_name;
    """))
    columns = result.fetchall()

    if not columns:
        print("✓ No 'timestamp without time zone' columns found — already migrated.")
    else:
        print(f"Found {len(columns)} naive TIMESTAMP column(s) to migrate:\n")
        for table, col in columns:
            stmt = f'ALTER TABLE "{table}" ALTER COLUMN "{col}" TYPE TIMESTAMPTZ USING "{col}" AT TIME ZONE \'UTC\';'
            print(f"  → {stmt}")
            conn.execute(text(stmt))
        conn.commit()
        print(f"\n✓ Migrated {len(columns)} column(s) to TIMESTAMPTZ.")

    # --- Step 2: Verify ---
    result = conn.execute(text("""
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE data_type = 'timestamp without time zone'
          AND table_schema = 'public';
    """))
    remaining = result.fetchall()
    if remaining:
        print(f"\n⚠ {len(remaining)} column(s) still naive TIMESTAMP:")
        for table, col in remaining:
            print(f"    {table}.{col}")
    else:
        print("✓ Verification passed — zero naive TIMESTAMP columns remain.")

    # --- Step 3: Add otp_attempts column if missing ---
    result = conn.execute(text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'otp_attempts'
          AND table_schema = 'public';
    """))
    if result.fetchone():
        print("✓ users.otp_attempts column already exists.")
    else:
        conn.execute(text("ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0;"))
        conn.commit()
        print("✓ Added otp_attempts column to users table.")

print("\nDone.")
