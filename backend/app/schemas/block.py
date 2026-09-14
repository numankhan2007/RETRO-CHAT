from pydantic import BaseModel
from datetime import datetime

class BlockOut(BaseModel):
    id: int
    blocker_id: int
    blocked_id: int
    blocked_username: str
    blocked_name: str
    created_at: datetime

    class Config:
        from_attributes = True
