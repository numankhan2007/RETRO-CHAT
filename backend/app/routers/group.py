from datetime import datetime
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from botocore.exceptions import ClientError

from app.core.deps import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.models.group import Group
from app.models.group_member import GroupMember
from app.schemas.group import GroupCreate, GroupUpdate, GroupOut, GroupMemberOut
from fastapi import Query
from app.schemas.user import AvatarUploadRequest, AvatarCompleteRequest
from app.schemas.chat import MessageCreate, MessageOut
from app.models.message import Message
from app.core.ws_manager import manager
from app.routers.users import get_s3_client
from app.services.friendship_service import are_friends

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post("", response_model=GroupOut, status_code=201)
def create_group(payload: GroupCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Enforce minimum 3 users (creator + at least 2 members)
    member_ids = set(payload.member_ids)
    member_ids.add(current_user.id)
    if len(member_ids) < 3:
        raise HTTPException(status_code=400, detail="A group must have at least 3 members.")
    
    # Verify all members exist
    users = db.query(User).filter(User.id.in_(member_ids)).all()
    if len(users) != len(member_ids):
        raise HTTPException(status_code=400, detail="One or more selected users do not exist.")

    group = Group(
        name=payload.name,
        bio=payload.bio,
        created_by=current_user.id
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    for uid in member_ids:
        role = "admin" if uid == current_user.id else "member"
        member = GroupMember(group_id=group.id, user_id=uid, role=role)
        db.add(member)
    
    db.commit()
    db.refresh(group)
    return group

@router.get("/{group_id}", response_model=GroupOut)
def get_group(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    is_member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
    return group

def _verify_admin(db: Session, group_id: int, user_id: int):
    member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id).first()
    if not member or member.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return member

@router.patch("/{group_id}", response_model=GroupOut)
def update_group(group_id: int, payload: GroupUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    _verify_admin(db, group_id, current_user.id)
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(group, field, value)
    
    db.commit()
    db.refresh(group)
    return group

@router.post("/{group_id}/members/{user_id}", response_model=GroupOut)
def add_member(group_id: int, user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    _verify_admin(db, group_id, current_user.id)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not are_friends(db, current_user.id, user_id):
        raise HTTPException(status_code=403, detail="You can only add friends to a group")
        
    existing = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
        
    member = GroupMember(group_id=group_id, user_id=user_id, role="member")
    db.add(member)
    db.commit()
    db.refresh(group)
    return group

@router.delete("/{group_id}/members/{user_id}")
def remove_member(group_id: int, user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # User can leave voluntarily, OR an admin can kick them
    if current_user.id != user_id:
        _verify_admin(db, group_id, current_user.id)
        
    member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    if member.role == "admin":
        other_admins = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.role == "admin", GroupMember.user_id != user_id).count()
        other_members = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id != user_id).count()
        if other_admins == 0 and other_members > 0:
            raise HTTPException(status_code=400, detail="Promote another member to admin before leaving")
        
    db.delete(member)
    db.commit()
    
    # If group is empty, delete it
    remaining = db.query(GroupMember).filter(GroupMember.group_id == group_id).count()
    if remaining == 0:
        db.delete(group)
        db.commit()
        return {"message": "Group deleted as it has no members"}
        
    return {"message": "Member removed"}

@router.patch("/{group_id}/members/{user_id}/role")
def update_role(group_id: int, user_id: int, role: str = Body(..., embed=True), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if role not in ["admin", "member"]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    _verify_admin(db, group_id, current_user.id)
    
    member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    if member.role == "admin" and role != "admin":
        other_admins = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.role == "admin", GroupMember.user_id != user_id).count()
        other_members = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id != user_id).count()
        if other_admins == 0 and other_members > 0:
            raise HTTPException(status_code=400, detail="Promote another member to admin before leaving")
        
    member.role = role
    db.commit()
    return {"message": f"User role updated to {role}"}

@router.post("/{group_id}/avatar/presigned-url")
def get_group_avatar_presigned_url(
    group_id: int,
    payload: AvatarUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_admin(db, group_id, current_user.id)
    
    s3_client = get_s3_client()
    if not s3_client:
        raise HTTPException(status_code=501, detail="R2 storage is not configured")
    if not settings.r2_bucket_name:
         raise HTTPException(status_code=501, detail="R2 bucket is not configured")

    object_key = f"groups/{group_id}/{uuid.uuid4().hex}.webp"

    try:
        url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.r2_bucket_name,
                "Key": object_key,
                "ContentType": payload.content_type,
            },
            ExpiresIn=300,
        )
        return {"upload_url": url, "object_key": object_key, "expires_in": 300}
    except ClientError as e:
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")

@router.post("/{group_id}/avatar/complete", response_model=GroupOut)
def complete_group_avatar_upload(
    group_id: int,
    payload: AvatarCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_admin(db, group_id, current_user.id)
    
    if not payload.object_key.startswith(f"groups/{group_id}/"):
        raise HTTPException(status_code=403, detail="Unauthorized object key")
    
    if not settings.r2_public_url:
        raise HTTPException(status_code=501, detail="R2 public URL is not configured")

    public_url = f"{settings.r2_public_url}/{payload.object_key}"
    
    group = db.query(Group).filter(Group.id == group_id).first()
    group.avatar_url = public_url
    db.commit()
    db.refresh(group)
    
    return group

@router.get("/{group_id}/messages", response_model=list[MessageOut])
def get_group_messages(group_id: int, cursor: Optional[datetime] = Query(None), limit: int = Query(50, le=100), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    is_member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    q = db.query(Message).filter(Message.group_id == group_id)
    if cursor:
        q = q.filter(Message.sent_at < cursor)
        
    messages = q.order_by(Message.sent_at.desc()).limit(limit).all()
    messages.reverse()
    return messages

@router.post("/{group_id}/messages", response_model=MessageOut, status_code=201)
async def send_group_message(group_id: int, payload: MessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    is_member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    message = Message(
        group_id=group_id,
        sender_id=current_user.id,
        content=payload.content,
        message_type=payload.message_type,
        reply_to_id=payload.reply_to_id
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    message_out = MessageOut.model_validate(message).model_dump(mode="json")
    ws_payload = {"type": "new_message", "group_id": group_id, "message": message_out}
    
    # Broadcast to all members
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
    for m in members:
        await manager.send_to_user(m.user_id, ws_payload)
        
    return MessageOut.model_validate(message)
