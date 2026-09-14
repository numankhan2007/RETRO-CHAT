"""
Initialize database tables using SQLAlchemy Base.metadata.
This uses the ORM definitions to generate tables.
Usage: python -m app.db.init_db
"""
from app.db.database import Base, engine
import app.models  # This imports the __all__ list to register the models with Base

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

if __name__ == "__main__":
    init_db()
