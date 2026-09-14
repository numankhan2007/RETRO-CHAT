from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationOut(BaseModel):
    id: int
    user_id: int
    actor_id: int
    actor_username: str
    actor_name: str
    post_id: Optional[int]
    post_title: Optional[str]
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
