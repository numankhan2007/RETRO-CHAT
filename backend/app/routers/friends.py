from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.friend_request import FriendRequest
from app.models.friendship import Friendship
from app.models.block import Block
from app.schemas.friend import FriendRequestCreate, PendingRequestOut, FriendOut

router = APIRouter(prefix="/friends", tags=["friends"])

@router.post("/request", status_code=201)
def send_friend_request(payload: FriendRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.username == payload.username).first()
    if not target:
        raise HTTPException(404, "User not found")
    if target.id == current_user.id:
        raise HTTPException(400, "Cannot send a friend request to yourself")

    # Check for block
    block = db.query(Block).filter(
        ((Block.blocker_id == current_user.id) & (Block.blocked_id == target.id)) |
        ((Block.blocker_id == target.id) & (Block.blocked_id == current_user.id))
    ).first()
    if block:
        raise HTTPException(400, "You cannot send a friend request to this user")

    # Check BOTH directions
    existing = db.query(FriendRequest).filter(
        ((FriendRequest.sender_id == current_user.id) & (FriendRequest.receiver_id == target.id)) |
        ((FriendRequest.sender_id == target.id) & (FriendRequest.receiver_id == current_user.id))
    ).first()

    if existing:
        if existing.status == "pending":
            raise HTTPException(400, "A request already exists between you and this user")
        if existing.status == "accepted":
            raise HTTPException(400, "You are already friends")
        existing.sender_id, existing.receiver_id, existing.status = current_user.id, target.id, "pending"
        db.commit()
        return {"message": "Friend request sent"}

    db.add(FriendRequest(sender_id=current_user.id, receiver_id=target.id, status="pending"))
    db.commit()
    return {"message": "Friend request sent"}

@router.get("/requests", response_model=list[PendingRequestOut])
def list_incoming_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(FriendRequest).filter(
        FriendRequest.receiver_id == current_user.id, FriendRequest.status == "pending"
    ).all()
    return [PendingRequestOut(request_id=r.id, created_at=r.created_at) for r in requests]

@router.post("/requests/{request_id}/accept")
def accept_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(FriendRequest).filter(FriendRequest.id == request_id, FriendRequest.receiver_id == current_user.id).first()
    if not req or req.status != "pending":
        raise HTTPException(404, "Request not found")
    req.status = "accepted"
    a, b = sorted([req.sender_id, req.receiver_id])
    existing_friendship = db.query(Friendship).filter(Friendship.user_a_id == a, Friendship.user_b_id == b).first()
    if not existing_friendship:
        db.add(Friendship(user_a_id=a, user_b_id=b))
    db.commit()
    return {"message": "Friend request accepted"}

@router.post("/requests/{request_id}/decline")
def decline_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(FriendRequest).filter(FriendRequest.id == request_id, FriendRequest.receiver_id == current_user.id).first()
    if not req or req.status != "pending":
        raise HTTPException(404, "Request not found")
    req.status = "declined"
    db.commit()
    return {"message": "Friend request declined"}

@router.get("", response_model=list[FriendOut])
def list_friends(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    friendships = db.query(Friendship).filter(
        (Friendship.user_a_id == current_user.id) | (Friendship.user_b_id == current_user.id)
    ).all()
    
    if not friendships:
        return []

    # Bulk fetch all friend users to avoid N+1
    friend_ids = []
    for f in friendships:
        friend_ids.append(f.user_b_id if f.user_a_id == current_user.id else f.user_a_id)
    friend_users = {u.id: u for u in db.query(User).filter(User.id.in_(friend_ids)).all()}

    result = []
    for f in friendships:
        if f.user_a_id == current_user.id:
            friend_id = f.user_b_id
            is_starred = f.user_a_starred
            is_pinned = f.user_a_pinned
            is_muted = f.user_a_muted
        else:
            friend_id = f.user_a_id
            is_starred = f.user_b_starred
            is_pinned = f.user_b_pinned
            is_muted = f.user_b_muted
            
        friend_user = friend_users.get(friend_id)
        if friend_user:
            result.append(FriendOut(
                id=friend_user.id,
                username=friend_user.username,
                name=friend_user.name,
                avatar_url=friend_user.avatar_url,
                bio=friend_user.bio,
                is_starred=is_starred,
                is_pinned=is_pinned,
                is_muted=is_muted
            ))
    return result

from pydantic import BaseModel
class FriendPrefUpdate(BaseModel):
    is_starred: bool | None = None
    is_pinned: bool | None = None
    is_muted: bool | None = None

@router.patch("/{friend_id}/preferences")
def update_friend_preferences(friend_id: int, payload: FriendPrefUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.query(Friendship).filter(
        ((Friendship.user_a_id == current_user.id) & (Friendship.user_b_id == friend_id)) |
        ((Friendship.user_a_id == friend_id) & (Friendship.user_b_id == current_user.id))
    ).first()
    if not f:
        raise HTTPException(404, "Friendship not found")
        
    if f.user_a_id == current_user.id:
        if payload.is_starred is not None: f.user_a_starred = payload.is_starred
        if payload.is_pinned is not None: f.user_a_pinned = payload.is_pinned
        if payload.is_muted is not None: f.user_a_muted = payload.is_muted
    else:
        if payload.is_starred is not None: f.user_b_starred = payload.is_starred
        if payload.is_pinned is not None: f.user_b_pinned = payload.is_pinned
        if payload.is_muted is not None: f.user_b_muted = payload.is_muted
    
    db.commit()
    return {"message": "Preferences updated"}

@router.delete("/{friend_id}")
def delete_friend(friend_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.query(Friendship).filter(
        ((Friendship.user_a_id == current_user.id) & (Friendship.user_b_id == friend_id)) |
        ((Friendship.user_a_id == friend_id) & (Friendship.user_b_id == current_user.id))
    ).first()
    if not f:
        raise HTTPException(404, "Friendship not found")
        
    # Delete the friendship
    db.delete(f)
    
    # Also delete any pending or accepted friend requests between them
    reqs = db.query(FriendRequest).filter(
        ((FriendRequest.sender_id == current_user.id) & (FriendRequest.receiver_id == friend_id)) |
        ((FriendRequest.sender_id == friend_id) & (FriendRequest.receiver_id == current_user.id))
    ).all()
    for req in reqs:
        db.delete(req)
        
    db.commit()
    return {"message": "Friend deleted"}
