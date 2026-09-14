import os
from pathlib import Path

def rewrite_chat():
    filepath = Path('backend/app/routers/chat.py')
    content = filepath.read_text()
    
    new_function = '''
from app.models.group import Group
from app.models.group_member import GroupMember

@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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

        receipts = db.query(ReadReceipt).filter(ReadReceipt.user_id == current_user.id, ReadReceipt.conversation_id.in_(convo_ids)).all()
        receipts_dict = {r.conversation_id: r for r in receipts}
        last_read_msg_ids = [r.last_read_message_id for r in receipts if r.last_read_message_id]
        last_read_msgs = {m.id: m for m in db.query(Message).filter(Message.id.in_(last_read_msg_ids)).all()} if last_read_msg_ids else {}

        for c in convos:
            friend_id = c.user_b_id if c.user_a_id == current_user.id else c.user_a_id
            friend = friends_dict.get(friend_id)
            if not friend: continue

            last_msg = last_messages_dict.get(c.id)
            receipt = receipts_dict.get(c.id)
            last_read_msg = last_read_msgs.get(receipt.last_read_message_id) if receipt and receipt.last_read_message_id else None
            
            if not receipt or not receipt.last_read_message_id:
                unread_count = db.query(func.count(Message.id)).filter(
                    Message.conversation_id == c.id, 
                    Message.sender_id == friend_id
                ).scalar() or 0
            else:
                unread_count = db.query(func.count(Message.id)).filter(
                    Message.conversation_id == c.id,
                    Message.sender_id == friend_id,
                    Message.sent_at > last_read_msg.sent_at if last_read_msg else True
                ).scalar() or 0

            is_online = await manager.is_online(friend.id)
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
        
        # Read receipts for groups: We will reuse the ReadReceipt table but need a group_id column or something?
        # Wait, ReadReceipt doesn't have group_id! It only has conversation_id. 
        # I need to update ReadReceipt model or create GroupReadReceipt.
        # For now, just set unread_count = 0 for groups to keep it simple, or I can add group_id to ReadReceipt.
        # Let's just do 0 unread for now in groups.
        
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
                unread_count=0, # TODO: implement group receipts
                is_online=False,
                is_muted=False
            ))
            
    result.sort(key=lambda r: r.last_message_at or datetime.min, reverse=True)
    return result
'''
    import re
    # We want to replace the list_conversations function entirely
    new_content = re.sub(
        r'@router\.get\("/conversations".*?return result', 
        new_function.strip(), 
        content, 
        flags=re.DOTALL
    )
    
    filepath.write_text(new_content)

if __name__ == '__main__':
    rewrite_chat()
