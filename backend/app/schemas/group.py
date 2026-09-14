from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class GroupMemberOut(BaseModel):
    user_id: int
    username: str
    name: str
    avatar_url: Optional[str] = None
    role: str

    class Config:
        from_attributes = True

class GroupCreate(BaseModel):
    name: str
    bio: Optional[str] = None
    member_ids: List[int]

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class GroupOut(BaseModel):
    id: int
    name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: int
    created_at: datetime
    members: List[GroupMemberOut] = []

    class Config:
        from_attributes = True
