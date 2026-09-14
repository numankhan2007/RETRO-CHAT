import os
from sqlalchemy import text
from app.db.database import engine, Base
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.message import Message

def run_migration():
    print("Creating groups and group_members tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    
    with engine.begin() as conn:
        print("Checking if group_id exists in messages table...")
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='messages' and column_name='group_id';
        """)).fetchone()
        
        if not result:
            print("Altering messages table to support group chats...")
            # make conversation_id nullable
            conn.execute(text("ALTER TABLE messages ALTER COLUMN conversation_id DROP NOT NULL;"))
            # add group_id
            conn.execute(text("ALTER TABLE messages ADD COLUMN group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE;"))
            conn.execute(text("CREATE INDEX ix_messages_group_id ON messages (group_id);"))
            print("Migration successful.")
        else:
            print("Column group_id already exists in messages.")

if __name__ == "__main__":
    run_migration()
