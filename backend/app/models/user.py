from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    bio = Column(String(500))
    accent_color = Column(String(20), default="default")
    font_choice = Column(String(50), default="default")
    wallpaper_id = Column(String(50), default="none")
    avatar_url = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(TIMESTAMP(timezone=True), nullable=True)
    otp_attempts = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

