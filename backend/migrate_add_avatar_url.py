import os
from sqlalchemy import text
from app.db.database import engine

def run_migration():
    with engine.begin() as conn:
        print("Checking if avatar_url column exists...")
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' and column_name='avatar_url';
        """)).fetchone()
        
        if not result:
            print("Adding avatar_url column to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);"))
            print("Migration successful.")
        else:
            print("Column avatar_url already exists.")

if __name__ == "__main__":
    run_migration()
