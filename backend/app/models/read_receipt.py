from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, func, UniqueConstraint
from app.db.database import Base

class ReadReceipt(Base):
    __tablename__ = "conversation_read_receipts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    last_read_message_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_read_receipt"),
    )
