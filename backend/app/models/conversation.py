from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, UniqueConstraint, CheckConstraint, func
from app.db.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_a_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_b_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_a_id", "user_b_id", name="uq_conversation"),
        CheckConstraint("user_a_id < user_b_id", name="chk_conversation_order"),
    )
