from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, func, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    bio = Column(String(500), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="group", cascade="all, delete-orphan")
    creator = relationship("User")
