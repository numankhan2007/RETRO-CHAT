from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Request, Body, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text

from app.core.deps import get_current_user, get_current_user_ws, get_db
from app.core.ws_manager import manager
from app.core.limiter import limiter
from app.services.friendship_service import are_friends
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.read_receipt import ReadReceipt
from app.models.friendship import Friendship
from app.models.block import Block
from app.schemas.chat import MessageCreate, MessageOut, ConversationOut

router = APIRouter(prefix="/chat", tags=["chat"])

def _get_or_create_conversation(db: Session, user_id_1: int, user_id_2: int) -> Conversation:
    a, b = sorted([user_id_1, user_id_2])
    convo = db.query(Conversation).filter(Conversation.user_a_id == a, Conversation.user_b_id == b).first()
    if not convo:
        convo = Conversation(user_a_id=a, user_b_id=b)
        db.add(convo)
        db.commit()
        db.refresh(convo)
    return convo

from app.models.group import Group
from app.models.group_member import GroupMember

@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = []
    
    # --- 1-ON-1 CONVERSATIONS ---
    convos = db.query(Conversation).filter(
        or_(Conversation.user_a_id == current_user.id, Conversation.user_b_id == current_user.id)
    ).all()
    
    if convos:
        friend_ids = [c.user_b_id if c.user_a_id == current_user.id else c.user_a_id for c in convos]
        friends_dict = {u.id: u for u in db.query(User).filter(User.id.in_(friend_ids)).all()}
        
        friendships = db.query(Friendship).filter(
            or_(Friendship.user_a_id == current_user.id, Friendship.user_b_id == current_user.id)
        ).all()
        friendships_dict = { (f.user_a_id, f.user_b_id): f for f in friendships }

        convo_ids = [c.id for c in convos]
        last_msgs_subq = db.query(Message.conversation_id, func.max(Message.sent_at).label("max_sent")).filter(Message.conversation_id.in_(convo_ids)).group_by(Message.conversation_id).subquery()
        last_messages = db.query(Message).join(last_msgs_subq, and_(Message.conversation_id == last_msgs_subq.c.conversation_id, Message.sent_at == last_msgs_subq.c.max_sent)).all()
        last_messages_dict = {m.conversation_id: m for m in last_messages}



        # Batched unread counts query
        unread_counts_dict = {}
        if convo_ids:
            unread_counts_query = text("""
                SELECT m.conversation_id, COUNT(m.id) as unread_count
                FROM messages m
                LEFT JOIN conversation_read_receipts r ON r.conversation_id = m.conversation_id AND r.user_id = :user_id
                LEFT JOIN messages rm ON rm.id = r.last_read_message_id
                WHERE m.conversation_id = ANY(:convo_ids)
                  AND m.sender_id != :user_id
                  AND (r.id IS NULL OR m.sent_at > rm.sent_at)
                GROUP BY m.conversation_id
            """)
            unread_counts_res = db.execute(unread_counts_query, {"user_id": current_user.id, "convo_ids": convo_ids}).fetchall()
            unread_counts_dict = {row[0]: row[1] for row in unread_counts_res}

        # Batched online status check using sync method
        online_statuses = manager.are_online_sync(list(friends_dict.keys()))

        for c in convos:
            friend_id = c.user_b_id if c.user_a_id == current_user.id else c.user_a_id
            friend = friends_dict.get(friend_id)
            if not friend: continue

            last_msg = last_messages_dict.get(c.id)
            unread_count = unread_counts_dict.get(c.id, 0)
            is_online = online_statuses.get(friend.id, False)

            a, b = sorted([current_user.id, friend_id])
            friendship = friendships_dict.get((a, b))
            is_muted = friendship.user_a_muted if friendship and friendship.user_a_id == current_user.id else (friendship.user_b_muted if friendship else False)

            result.append(ConversationOut(
                id=c.id,
                target_id=friend.id,
                is_group=False,
                name=friend.name,
                username=friend.username,
                avatar_url=friend.avatar_url,
                last_message=last_msg.content if last_msg else None,
                last_message_sender_id=last_msg.sender_id if last_msg else None,
                last_message_at=last_msg.sent_at if last_msg else None,
                unread_count=unread_count,
                is_online=is_online,
                is_muted=is_muted
            ))

    # --- GROUP CONVERSATIONS ---
    group_memberships = db.query(GroupMember).filter(GroupMember.user_id == current_user.id).all()
    if group_memberships:
        group_ids = [gm.group_id for gm in group_memberships]
        groups = db.query(Group).filter(Group.id.in_(group_ids)).all()
        groups_dict = {g.id: g for g in groups}
        
        group_last_msgs_subq = db.query(Message.group_id, func.max(Message.sent_at).label("max_sent")).filter(Message.group_id.in_(group_ids)).group_by(Message.group_id).subquery()
        group_last_messages = db.query(Message).join(group_last_msgs_subq, and_(Message.group_id == group_last_msgs_subq.c.group_id, Message.sent_at == group_last_msgs_subq.c.max_sent)).all()
        group_last_messages_dict = {m.group_id: m for m in group_last_messages}
        
        
        for gm in group_memberships:
            g = groups_dict.get(gm.group_id)
            if not g: continue
            
            last_msg = group_last_messages_dict.get(g.id)
            
            result.append(ConversationOut(
                id=g.id,
                target_id=g.id,
                is_group=True,
                name=g.name,
                username=None,
                avatar_url=g.avatar_url,
                last_message=last_msg.content if last_msg else None,
                last_message_sender_id=last_msg.sender_id if last_msg else None,
                last_message_at=last_msg.sent_at if last_msg else None,
                unread_count=0,
                is_online=False,
                is_muted=False
            ))
            
    result.sort(key=lambda r: r.last_message_at or datetime.min, reverse=True)
    return result

@router.get("/conversations/{friend_id}/messages", response_model=list[MessageOut])
def get_messages(friend_id: int, cursor: Optional[datetime] = Query(None), limit: int = Query(50, le=100), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not are_friends(db, current_user.id, friend_id):
        raise HTTPException(403, "You can only view conversations with friends")
    convo = _get_or_create_conversation(db, current_user.id, friend_id)
    
    q = db.query(Message).filter(Message.conversation_id == convo.id)
    if cursor:
        q = q.filter(Message.sent_at < cursor)
    
    messages = q.order_by(Message.sent_at.desc()).limit(limit).all()
    messages.reverse()
    return messages

@router.post("/conversations/{friend_id}/messages", response_model=MessageOut, status_code=201)
@limiter.limit("60/minute")
def send_message(request: Request, friend_id: int, payload: MessageCreate, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not are_friends(db, current_user.id, friend_id):
        raise HTTPException(403, "You can only message friends")

    convo = _get_or_create_conversation(db, current_user.id, friend_id)
    message = Message(conversation_id=convo.id, sender_id=current_user.id,
                       content=payload.content, message_type=payload.message_type,
                       reply_to_id=payload.reply_to_id)
    db.add(message)
    db.commit()
    db.refresh(message)

    message_out = MessageOut.model_validate(message).model_dump(mode="json")
    ws_payload = {"type": "new_message", "conversation_id": convo.id, "message": message_out}
    background_tasks.add_task(manager.send_to_user, friend_id, ws_payload)
    background_tasks.add_task(manager.send_to_user, current_user.id, ws_payload)
    return MessageOut.model_validate(message)

@router.patch("/conversations/{friend_id}/messages/{message_id}/pin", response_model=MessageOut)
def pin_message(friend_id: int, message_id: int, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not are_friends(db, current_user.id, friend_id):
        raise HTTPException(403, "You can only interact with friends")
    
    convo = _get_or_create_conversation(db, current_user.id, friend_id)
    message = db.query(Message).filter(Message.id == message_id, Message.conversation_id == convo.id).first()
    if not message:
        raise HTTPException(404, "Message not found")
    if not message.is_pinned:
        pinned_count = db.query(Message).filter(Message.conversation_id == convo.id, Message.is_pinned == True).count()
        if pinned_count >= 4:
            raise HTTPException(400, "Maximum of 4 pinned messages allowed")
        message.is_pinned = True
    else:
        message.is_pinned = False

    db.commit()
    db.refresh(message)
    
    message_out = MessageOut.model_validate(message).model_dump(mode="json")
    ws_payload = {"type": "update_message", "conversation_id": convo.id, "message": message_out}
    background_tasks.add_task(manager.send_to_user, friend_id, ws_payload)
    background_tasks.add_task(manager.send_to_user, current_user.id, ws_payload)
    return MessageOut.model_validate(message)

@router.delete("/conversations/{friend_id}/messages/{message_id}")
def delete_message(friend_id: int, message_id: int, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not are_friends(db, current_user.id, friend_id):
        raise HTTPException(403, "You can only interact with friends")
        
    convo = _get_or_create_conversation(db, current_user.id, friend_id)
    message = db.query(Message).filter(Message.id == message_id, Message.conversation_id == convo.id).first()
    if not message:
        raise HTTPException(404, "Message not found")
        
    if message.sender_id != current_user.id:
        raise HTTPException(403, "You can only delete your own messages")
        
    message.content = ""
    message.is_deleted = True
    message.is_pinned = False
    db.commit()
    db.refresh(message)
    
    # Notify update (not deletion) so it updates the UI to show deleted state
    message_out = MessageOut.model_validate(message).model_dump(mode="json")
    ws_payload = {"type": "update_message", "conversation_id": convo.id, "message": message_out}
    background_tasks.add_task(manager.send_to_user, friend_id, ws_payload)
    background_tasks.add_task(manager.send_to_user, current_user.id, ws_payload)
    return {"message": "Deleted successfully"}

@router.put("/conversations/{friend_id}/messages/{message_id}", response_model=MessageOut)
def edit_message(
    friend_id: int, 
    message_id: int, 
    background_tasks: BackgroundTasks,
    content: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not are_friends(db, current_user.id, friend_id):
        raise HTTPException(403, "You can only interact with friends")
        
    convo = _get_or_create_conversation(db, current_user.id, friend_id)
    message = db.query(Message).filter(Message.id == message_id, Message.conversation_id == convo.id).first()
    if not message:
        raise HTTPException(404, "Message not found")
        
    if message.sender_id != current_user.id:
        raise HTTPException(403, "You can only edit your own messages")
        
    if message.is_deleted:
        raise HTTPException(400, "Cannot edit a deleted message")

    message.content = content
    message.is_edited = True
    db.commit()
    db.refresh(message)
    
    message_out = MessageOut.model_validate(message).model_dump(mode="json")
    ws_payload = {"type": "update_message", "conversation_id": convo.id, "message": message_out}
    background_tasks.add_task(manager.send_to_user, friend_id, ws_payload)
    background_tasks.add_task(manager.send_to_user, current_user.id, ws_payload)
    return MessageOut.model_validate(message)

@router.post("/conversations/{friend_id}/read", status_code=204)
def mark_as_read(friend_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    convo = _get_or_create_conversation(db, current_user.id, friend_id)
    last_msg = db.query(Message).filter(Message.conversation_id == convo.id).order_by(Message.sent_at.desc()).first()
    if not last_msg:
        return
    
    receipt = db.query(ReadReceipt).filter(ReadReceipt.conversation_id == convo.id, ReadReceipt.user_id == current_user.id).first()
    if receipt:
        receipt.last_read_message_id = last_msg.id
    else:
        receipt = ReadReceipt(conversation_id=convo.id, user_id=current_user.id, last_read_message_id=last_msg.id)
        db.add(receipt)
    db.commit()

@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket):
    user = await get_current_user_ws(websocket)
    if user is None:
        await websocket.close(code=1008)
        return
    await manager.connect(user.id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(user.id, websocket)
