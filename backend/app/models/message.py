from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, func, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String(4000), nullable=False)
    message_type = Column(String(20), default="text")
    sent_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    reply_to_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    is_pinned = Column(Boolean, default=False)
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    reply_to = relationship("Message", remote_side=[id])
