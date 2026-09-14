from sqlalchemy import Column, Integer, Boolean, TIMESTAMP, ForeignKey, UniqueConstraint, CheckConstraint, func
from app.db.database import Base

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_a_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_b_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_a_starred = Column(Boolean, default=False)
    user_b_starred = Column(Boolean, default=False)
    user_a_pinned = Column(Boolean, default=False)
    user_b_pinned = Column(Boolean, default=False)
    user_a_muted = Column(Boolean, default=False)
    user_b_muted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_a_id", "user_b_id", name="uq_friendship"),
        CheckConstraint("user_a_id < user_b_id", name="chk_friendship_order"),
    )
