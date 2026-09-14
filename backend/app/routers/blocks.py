from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.block import Block
from app.models.friendship import Friendship
from app.models.friend_request import FriendRequest
from app.schemas.block import BlockOut

router = APIRouter(prefix="/blocks", tags=["blocks"])

class BlockCreate(BaseModel):
    user_id: int

@router.get("", response_model=list[BlockOut])
def get_blocks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    blocks = db.query(Block).filter(Block.blocker_id == current_user.id).order_by(Block.created_at.desc()).all()
    if not blocks:
        return []
    
    # Bulk fetch blocked users to avoid N+1
    blocked_ids = [b.blocked_id for b in blocks]
    blocked_users = {u.id: u for u in db.query(User).filter(User.id.in_(blocked_ids)).all()}
    
    out = []
    for b in blocks:
        blocked_user = blocked_users.get(b.blocked_id)
        out.append(BlockOut(
            id=b.id,
            blocker_id=b.blocker_id,
            blocked_id=b.blocked_id,
            blocked_username=blocked_user.username if blocked_user else "Unknown",
            blocked_name=blocked_user.name if blocked_user else "Unknown",
            created_at=b.created_at
        ))
    return out

@router.post("", response_model=BlockOut, status_code=201)
def block_user(payload: BlockCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.user_id == current_user.id:
        raise HTTPException(400, "Cannot block yourself")
        
    target = db.query(User).filter(User.id == payload.user_id).first()
    if not target:
        raise HTTPException(404, "User not found")
        
    existing = db.query(Block).filter(
        Block.blocker_id == current_user.id,
        Block.blocked_id == payload.user_id
    ).first()
    
    if not existing:
        # Create block
        block = Block(blocker_id=current_user.id, blocked_id=payload.user_id)
        db.add(block)
        
        # Remove friendship
        db.query(Friendship).filter(or_(
            and_(Friendship.user_a_id == current_user.id, Friendship.user_b_id == payload.user_id),
            and_(Friendship.user_a_id == payload.user_id, Friendship.user_b_id == current_user.id)
        )).delete()
        
        # Remove pending friend requests
        db.query(FriendRequest).filter(or_(
            and_(FriendRequest.sender_id == current_user.id, FriendRequest.receiver_id == payload.user_id),
            and_(FriendRequest.sender_id == payload.user_id, FriendRequest.receiver_id == current_user.id)
        )).delete()
        
        db.commit()
        db.refresh(block)
        existing = block
        
    return BlockOut(
        id=existing.id,
        blocker_id=existing.blocker_id,
        blocked_id=existing.blocked_id,
        blocked_username=target.username,
        blocked_name=target.name,
        created_at=existing.created_at
    )

@router.delete("/{blocked_id}", status_code=204)
def unblock_user(blocked_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    block = db.query(Block).filter(
        Block.blocker_id == current_user.id,
        Block.blocked_id == blocked_id
    ).first()
    if not block:
        raise HTTPException(404, "Block not found")
    db.delete(block)
    db.commit()
