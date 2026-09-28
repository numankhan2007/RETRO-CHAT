from pydantic import BaseModel, model_validator
from typing import Optional, List, Any
from datetime import datetime

class GroupMemberOut(BaseModel):
    user_id: int
    username: str
    name: str
    avatar_url: Optional[str] = None
    role: str

    @model_validator(mode="before")
    @classmethod
    def flatten_user(cls, data: Any):
        if hasattr(data, "user") and data.user:
            return {
                "user_id": data.user_id,
                "role": data.role,
                "username": data.user.username,
                "name": data.user.name,
                "avatar_url": data.user.avatar_url
            }
        return data

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
