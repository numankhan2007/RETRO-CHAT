from pydantic import BaseModel, Field
from datetime import datetime

class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    message_type: str = "text"
    reply_to_id: int | None = None

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    message_type: str
    sent_at: datetime
    reply_to_id: int | None = None
    is_pinned: bool = False
    is_edited: bool = False
    is_deleted: bool = False

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: int
    friend_id: int
    friend_username: str
    friend_name: str
    friend_avatar_url: str | None = None
    last_message: str | None = None
    last_message_sender_id: int | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
    is_online: bool = False
    is_muted: bool = False

    class Config:
        from_attributes = True
