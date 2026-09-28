from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, func, Boolean, Index
from app.db.database import Base

class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (
        Index("ix_comments_post_pinned_created_at", "post_id", "is_pinned", "created_at"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String(2000), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="SET NULL"), nullable=True)
