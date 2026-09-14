import os
from pathlib import Path

def rewrite_convo():
    filepath = Path('frontend/src/pages/ConversationPage.jsx')
    content = filepath.read_text()
    
    # 1. Add imports
    if "import { useAuth }" not in content:
        content = content.replace(
            'import { useChatSocket } from "../context/ChatSocketContext";',
            'import { useChatSocket } from "../context/ChatSocketContext";\nimport { useAuth } from "../context/AuthContext";\nimport { getGroup, getGroupMessages, sendGroupMessage, removeGroupMember } from "../services/chatService";'
        )

    # 2. Update state declarations
    content = content.replace(
        'const { friendId } = useParams();',
        'const { friendId, groupId } = useParams();\n  const isGroup = !!groupId;\n  const targetId = isGroup ? groupId : friendId;\n  const { user: currentUser } = useAuth();\n  const [group, setGroup] = useState(null);\n  const [membersMap, setMembersMap] = useState({});'
    )
    
    # 3. Update loadMoreMessages
    content = content.replace(
        'getMessages(friendId, cursor).then(res => {',
        'const req = isGroup ? getGroupMessages(targetId, cursor) : getMessages(targetId, cursor);\n    req.then(res => {'
    )
    
    # 4. Update getFriends effect
    content = content.replace(
        '''useEffect(() => {
    getFriends().then(res => {
      const f = res.data.find(x => String(x.id) === String(friendId));
      if (f) setFriend(f);
    });
  }, [friendId]);''',
        '''useEffect(() => {
    if (isGroup) {
      getGroup(targetId).then(res => {
        setGroup(res.data);
        const mmap = {};
        res.data.members.forEach(m => mmap[m.user_id] = m);
        setMembersMap(mmap);
      });
    } else {
      getFriends().then(res => {
        const f = res.data.find(x => String(x.id) === String(targetId));
        if (f) {
           setFriend(f);
           setMembersMap({ [f.id]: f });
        }
      });
    }
  }, [targetId, isGroup]);'''
    )

    # 5. Update initial load effect
    content = content.replace(
        '''useEffect(() => { 
    setHasMore(true);
    getMessages(friendId).then((res) => {
      setMessages(res.data);
      if (res.data.length < 50) setHasMore(false);
      markAsRead(friendId);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50);
    }); 
  }, [friendId]);''',
        '''useEffect(() => { 
    setHasMore(true);
    const req = isGroup ? getGroupMessages(targetId) : getMessages(targetId);
    req.then((res) => {
      setMessages(res.data);
      if (res.data.length < 50) setHasMore(false);
      if (!isGroup) markAsRead(targetId);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50);
    }); 
  }, [targetId, isGroup]);'''
    )

    # 6. Update websocket effect
    ws_old = '''const currentConvoId = messages.length > 0 ? messages[0].conversation_id : null;
    const isCurrentConvo = currentConvoId 
      ? String(lastMessage.conversation_id) === String(currentConvoId)
      : (lastMessage.message && String(lastMessage.message.sender_id) === String(friendId));'''
    
    ws_new = '''let isCurrentConvo = false;
    if (isGroup) {
       isCurrentConvo = String(lastMessage.group_id) === String(targetId);
    } else {
       const currentConvoId = messages.length > 0 ? messages[0].conversation_id : null;
       isCurrentConvo = currentConvoId 
         ? String(lastMessage.conversation_id) === String(currentConvoId)
         : (lastMessage.message && String(lastMessage.message.sender_id) === String(targetId));
    }'''
    content = content.replace(ws_old, ws_new)

    # ws friendId fix
    content = content.replace(
        'if (String(msg.sender_id) === String(friendId)) {',
        'if (String(msg.sender_id) !== String(currentUser?.id)) {'
    )
    content = content.replace(
        'markAsRead(friendId);',
        'if (!isGroup) markAsRead(targetId);'
    )
    
    # 7. Update handleSend
    content = content.replace(
        '''const res = await sendMessage(friendId, { 
          content, 
          message_type, 
          reply_to_id: replyingTo?.id || null 
        });''',
        '''const payload = { content, message_type, reply_to_id: replyingTo?.id || null };
        const res = await (isGroup ? sendGroupMessage(targetId, payload) : sendMessage(targetId, payload));'''
    )
    content = content.replace(
        'const res = await editMessage(friendId, editingMessage.id, content);',
        'const res = await editMessage(targetId, editingMessage.id, content);'
    )
    
    content = content.replace(
        'const res = await pinMessage(friendId, message.id);',
        'const res = await pinMessage(targetId, message.id);'
    )
    content = content.replace(
        'await deleteMessage(friendId, confirmDeleteMessage.id);',
        'await deleteMessage(targetId, confirmDeleteMessage.id);'
    )
    content = content.replace(
        'await updateFriendPreferences(friendId, { is_muted: true });',
        'await updateFriendPreferences(targetId, { is_muted: true });'
    )
    content = content.replace(
        'await blockUser(friendId);',
        'await blockUser(targetId);'
    )
    
    # 8. Render message bubble isMine calculation and sender
    content = content.replace(
        'const isMine = String(m.sender_id) !== String(friendId);',
        'const isMine = String(m.sender_id) === String(currentUser?.id);'
    )
    content = content.replace(
        '<MessageBubble',
        '<MessageBubble\n                sender={membersMap[m.sender_id]}'
    )
    content = content.replace(
        'String(replyMsg.sender_id) === String(friendId) ? friend?.name : "You"',
        'String(replyMsg.sender_id) === String(currentUser?.id) ? "You" : (membersMap[replyMsg.sender_id]?.name || "Unknown")'
    )
    content = content.replace(
        'String(m.sender_id) === String(friendId) ? friend?.name : "You"',
        'String(m.sender_id) === String(currentUser?.id) ? "You" : (membersMap[m.sender_id]?.name || "Unknown")'
    )
    content = content.replace(
        'String(replyingTo?.sender_id) === String(friendId) ? friend?.name : "yourself"',
        'String(replyingTo?.sender_id) === String(currentUser?.id) ? "yourself" : (membersMap[replyingTo?.sender_id]?.name || "Unknown")'
    )
    content = content.replace(
        'String(contextMenu.message.sender_id) !== String(friendId)',
        'String(contextMenu.message.sender_id) === String(currentUser?.id)'
    )
    
    # 9. Header render (friend vs group)
    header_old = '''{friend && (
        <div className="h-[72px] flex items-center justify-between bg-parchment-100 border-b border-accent-900 px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-3 text-accent-900 hover:bg-accent-900/10 rounded-full" onClick={() => navigate("/chats")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <Avatar username={friend.username} avatarUrl={friend.avatar_url} />
            <div>
              <h2 className="font-bold text-lg leading-tight">{friend.name}</h2>
              <p className="text-xs text-ink-muted mb-1">{friend.username}</p>
              {friend.bio && <p className="text-xs text-ink-muted/70">{friend.bio}</p>}
            </div>
          </div>'''
          
    header_new = '''{(friend || group) && (
        <div className="h-[72px] flex items-center justify-between bg-parchment-100 border-b border-accent-900 px-6 shrink-0">
          <div className="flex items-center gap-4 cursor-pointer hover:bg-accent-900/5 p-2 -ml-2 rounded" onClick={() => isGroup ? window.dispatchEvent(new CustomEvent('open-group-settings')) : null}>
            <button className="md:hidden p-2 -ml-3 text-accent-900 hover:bg-accent-900/10 rounded-full" onClick={(e) => { e.stopPropagation(); navigate("/chats"); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <Avatar username={isGroup ? group.name : friend.username} url={isGroup ? group.avatar_url : friend.avatar_url} isGroup={isGroup} />
            <div>
              <h2 className="font-bold text-lg leading-tight flex items-center gap-2">
                {isGroup ? group.name : friend.name}
                {isGroup && <span className="text-[10px] bg-accent-200 px-1 rounded uppercase tracking-widest border border-accent-800">Group</span>}
              </h2>
              <p className="text-xs text-ink-muted mb-1">{isGroup ? `${group.members?.length || 0} members` : friend.username}</p>
              {!isGroup && friend.bio && <p className="text-xs text-ink-muted/70">{friend.bio}</p>}
              {isGroup && group.bio && <p className="text-xs text-ink-muted/70 truncate max-w-[200px]">{group.bio}</p>}
            </div>
          </div>'''
          
    content = content.replace(header_old, header_new)

    filepath.write_text(content)

if __name__ == '__main__':
    rewrite_convo()
