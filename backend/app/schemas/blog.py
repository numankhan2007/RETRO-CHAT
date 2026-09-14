from pydantic import BaseModel, Field
from datetime import datetime

class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    visibility: str = "friends"
    status: str = "published"

class PostOut(BaseModel):
    id: int
    author_id: int
    author_username: str
    author_avatar_url: str | None = None
    title: str
    content: str
    visibility: str
    status: str
    created_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    is_saved: bool = False

class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    parent_id: int | None = None

class CommentOut(BaseModel):
    id: int
    post_id: int
    author_id: int
    author_username: str
    author_avatar_url: str | None = None
    content: str
    created_at: datetime
    is_pinned: bool = False
    parent_id: int | None = None
