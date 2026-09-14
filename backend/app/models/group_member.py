from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.database import Base

class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="member") # "admin" or "member"
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    group = relationship("Group", back_populates="members")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_member"),
    )
