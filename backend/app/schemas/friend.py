from pydantic import BaseModel
from datetime import datetime

class FriendRequestCreate(BaseModel):
    username: str

class PendingRequestOut(BaseModel):
    """No sender identity here — this IS the privacy rule, expressed as
    a schema that structurally cannot include a username field."""
    request_id: int
    created_at: datetime

class FriendOut(BaseModel):
    id: int
    username: str
    name: str
    avatar_url: str | None = None
    bio: str | None = None
    is_starred: bool = False
    is_pinned: bool = False
    is_muted: bool = False

    class Config:
        from_attributes = True
