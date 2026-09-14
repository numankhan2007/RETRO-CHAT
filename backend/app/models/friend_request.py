from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, UniqueConstraint, func
from app.db.database import Base

class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending | accepted | declined
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    responded_at = Column(TIMESTAMP(timezone=True), nullable=True)

    __table_args__ = (UniqueConstraint("sender_id", "receiver_id", name="uq_friend_request"),)

