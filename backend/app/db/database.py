from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Connection URL format for PostgreSQL
DATABASE_URL = settings.database_url

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI dependency — yields a session, always closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
