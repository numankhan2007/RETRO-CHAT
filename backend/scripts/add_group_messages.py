import os
from pathlib import Path

def add_group_messages():
    filepath = Path('backend/app/routers/group.py')
    content = filepath.read_text()
    
    new_endpoints = '''
from app.schemas.chat import MessageCreate, MessageOut
from app.models.message import Message
from app.core.ws_manager import manager

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
'''
    
    if "def get_group_messages" not in content:
        # Add imports at top
        content = content.replace(
            "from app.schemas.user import AvatarUploadRequest, AvatarCompleteRequest",
            "from fastapi import Query\nfrom app.schemas.user import AvatarUploadRequest, AvatarCompleteRequest\nfrom app.schemas.chat import MessageCreate, MessageOut\nfrom app.models.message import Message\nfrom app.core.ws_manager import manager"
        )
        
        # We don't want to duplicate the imports in the injected string, just the endpoints
        endpoints_only = new_endpoints.split("@router.get")[1]
        endpoints_only = "@router.get" + endpoints_only
        
        filepath.write_text(content + "\n" + endpoints_only)

if __name__ == '__main__':
    add_group_messages()
