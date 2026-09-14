import asyncio
from app.db.database import engine, Base
from app.models.message import Message
from app.models.post import Post
from app.models.comment import Comment

def main():
    print("Creating indexes...")
    # Base.metadata.create_all(bind=engine) will create missing indexes if we drop and recreate, but we don't want to drop.
    # Actually, SQLAlchemy 1.4/2.0 create_all DOES create missing indexes for existing tables!
    Base.metadata.create_all(bind=engine)
    print("Done")

if __name__ == "__main__":
    main()
