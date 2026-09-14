from pydantic import BaseModel, Field
from datetime import datetime

class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    message_type: str = "text"
    reply_to_id: int | None = None

class MessageOut(BaseModel):
    id: int
    conversation_id: int | None = None
    group_id: int | None = None
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
    id: int # conversation.id or group.id
    target_id: int # friend_id or group_id
    is_group: bool = False
    name: str # friend_name or group_name
    username: str | None = None # friend_username or None for groups
    avatar_url: str | None = None
    last_message: str | None = None
    last_message_sender_id: int | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
    is_online: bool = False
    is_muted: bool = False

    class Config:
        from_attributes = True
