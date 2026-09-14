import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage, markAsRead, pinMessage, deleteMessage, editMessage } from "../services/chatService";
import { getFriends, updateFriendPreferences } from "../services/friendsService";
import { blockUser } from "../services/blockService";
import { useChatSocket } from "../context/ChatSocketContext";
import { renderFormattedText, stripFormatting } from "../utils/textUtils";
import MessageBubble from "../components/MessageBubble";
import EmojiPicker from "../components/EmojiPicker";
import FormatToolbar from "../components/FormatToolbar";
import SlashCommandMenu from "../components/SlashCommandMenu";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import ConfirmModal from "../components/ConfirmModal";

export default function ConversationPage() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState(null);
  const [text, setText] = useState("");
  const [showFormat, setShowFormat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const { lastMessage } = useChatSocket();
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const formatRef = useRef(null);
  const messageRefs = useRef({});
  const observer = useRef();
  
  const topMessageElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMessages();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  const loadMoreMessages = () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const cursor = messages[0].sent_at;
    getMessages(friendId, cursor).then(res => {
      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prev => [...res.data, ...prev]);
        if (res.data.length < 50) setHasMore(false);
      }
    }).finally(() => setLoadingMore(false));
  };

  useEffect(() => {
    getFriends().then(res => {
      const f = res.data.find(x => String(x.id) === String(friendId));
      if (f) setFriend(f);
    });
  }, [friendId]);

  useEffect(() => { 
    setHasMore(true);
    getMessages(friendId).then((res) => {
      setMessages(res.data);
      if (res.data.length < 50) setHasMore(false);
      markAsRead(friendId);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50);
    }); 
  }, [friendId]);

  useEffect(() => {
    if (!lastMessage) return;
    
    // Determine the current conversation ID if possible
    const currentConvoId = messages.length > 0 ? messages[0].conversation_id : null;
    const isCurrentConvo = currentConvoId 
      ? String(lastMessage.conversation_id) === String(currentConvoId)
      : (lastMessage.message && String(lastMessage.message.sender_id) === String(friendId));

    if (!isCurrentConvo) return;

    if (lastMessage.type === "new_message" || lastMessage.type === "update_message") {
      const msg = lastMessage.message;
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === msg.id);
        if (exists) {
          return prev.map((m) => m.id === msg.id ? msg : m);
        }
        return [...prev, msg];
      });
      if (String(msg.sender_id) === String(friendId)) {
        markAsRead(friendId);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } else if (lastMessage.type === "delete_message") {
      setMessages((prev) => prev.filter((m) => m.id !== lastMessage.id));
    }
  }, [lastMessage, friendId, messages]);

  // Only auto-scroll on new message received or sent, not on older messages loaded
  useEffect(() => {
    // If the user is already near the bottom, scroll down when a new message arrives.
    // For simplicity, we just scroll down when the last message changes
    // Wait, the previous implementation scrolled down whenever `messages` changed,
    // which breaks reverse infinite scrolling because it forces you to the bottom
    // when you load older messages!
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formatRef.current && !formatRef.current.contains(e.target)) {
        setShowFormat(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async (content, message_type = "text") => {
    if (!content.trim()) return;
    try {
      if (editingMessage) {
        const res = await editMessage(friendId, editingMessage.id, content);
        setMessages((prev) => prev.map((m) => (m.id === res.data.id ? res.data : m)));
        setEditingMessage(null);
      } else {
        const res = await sendMessage(friendId, { 
          content, 
          message_type, 
          reply_to_id: replyingTo?.id || null 
        });
        setMessages((prev) => [...prev, res.data]);
        setReplyingTo(null);
      }
      setText("");
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e) {
      console.error("Failed to send message", e);
      alert("Failed to send message. Please try again.");
    }
  };

  const handlePin = async (message) => {
    try {
      const res = await pinMessage(friendId, message.id);
      // Wait, we don't need to manually update state here because the websocket will echo it back.
      // Actually we are doing it manually for instant feedback:
      setMessages((prev) => prev.map((m) => (m.id === message.id ? res.data : m)));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to pin message");
    }
  };

  const scrollToMessage = (id) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(id);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  };

  const handleDeleteClick = (message) => {
    setConfirmDeleteMessage(message);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteMessage) return;
    try {
      await deleteMessage(friendId, confirmDeleteMessage.id);
      setMessages((prev) => prev.map((m) => (m.id === confirmDeleteMessage.id ? { ...m, content: "", is_deleted: true, is_pinned: false } : m)));
    } catch (err) {
      console.error(err);
    }
    setConfirmDeleteMessage(null);
  };

  const applySlashCommand = (syntax) => {
    setText(syntax);
    inputRef.current?.focus();
  };

  const handleMute = async () => {
    setShowMenu(false);
    try {
      await updateFriendPreferences(friendId, { is_muted: true });
      alert("Chat muted!");
    } catch (e) {
      console.error("Failed to mute", e);
    }
  };

  const handleBlock = () => {
    setShowMenu(false);
    setConfirmBlock(true);
  };

  const executeBlock = async () => {
    try {
      await blockUser(friendId);
      navigate("/chats");
    } catch (e) {
      console.error("Failed to block", e);
    } finally {
      setConfirmBlock(false);
    }
  };

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleClear = () => {
    setShowMenu(false);
    alert("Clear chat functionality is coming soon!");
  };

  return (
    <div className="flex flex-col h-full relative bg-parchment-050">
      {friend && (
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
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="w-8 h-8 flex items-center justify-center hover:bg-accent-900/10 rounded-full text-xl font-bold"
              title="Options"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-parchment-100 border border-accent-900 rounded shadow-lg z-50 py-1 font-mono text-sm">
                <button onClick={handleMute} className="w-full text-left px-4 py-2 hover:bg-accent-900/10">
                  Mute Chat
                </button>
                <button onClick={handleClear} className="w-full text-left px-4 py-2 hover:bg-accent-900/10">
                  Clear Chat
                </button>
                <button onClick={handleBlock} className="w-full text-left px-4 py-2 hover:bg-coral-500/10 text-coral-600 font-bold border-t border-accent-900/20">
                  Block User
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {(() => {
        const pinnedMessages = messages.filter(m => m.is_pinned);
        const latestPinned = pinnedMessages.length > 0 ? pinnedMessages[pinnedMessages.length - 1] : null;
        if (!latestPinned) return null;
        
        return (
          <div className="bg-accent-900/10 border-b border-accent-900/20 px-6 py-2 flex items-center justify-between shrink-0">
            <div 
              className="flex flex-col cursor-pointer flex-1 mr-4 overflow-hidden"
              onClick={() => scrollToMessage(latestPinned.id)}
            >
              <span className="text-xs font-bold text-accent-800 mb-0.5 flex items-center gap-1">📌 Pinned Message</span>
              <span className="text-sm text-ink truncate">{stripFormatting(latestPinned.content)}</span>
            </div>
            {pinnedMessages.length > 1 && (
              <button 
                onClick={() => setShowPinnedModal(true)}
                className="bg-accent-900 text-cream px-3 py-1 text-xs font-bold rounded shadow-sm hover:bg-accent-800 shrink-0 transition-colors"
              >
                All {pinnedMessages.length}
              </button>
            )}
          </div>
        );
      })()}

      {showPinnedModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowPinnedModal(false)}>
          <div className="bg-parchment-050 border-2 border-accent-900 rounded shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-accent-900 text-cream px-4 py-2 font-bold flex justify-between items-center border-b border-accent-800">
              <span>📌 Pinned Messages</span>
              <button onClick={() => setShowPinnedModal(false)} className="hover:text-cream/70 text-lg">✕</button>
            </div>
            <div className="overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {messages.filter(m => m.is_pinned).map(m => (
                <div 
                  key={m.id} 
                  className="bg-parchment-100 border border-accent-900/30 p-3 rounded cursor-pointer hover:bg-accent-200 transition-colors"
                  onClick={() => {
                    setShowPinnedModal(false);
                    scrollToMessage(m.id);
                  }}
                >
                  <span className="text-[10px] text-ink-muted block mb-1">
                    {String(m.sender_id) === String(friendId) ? friend?.name : "You"} • {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <p className="text-sm text-ink break-words whitespace-pre-wrap">{stripFormatting(m.content)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar flex flex-col">
        {messages.map((m, index) => {
          const isMine = String(m.sender_id) !== String(friendId);
          const replyMsg = m.reply_to_id ? messages.find(msg => msg.id === m.reply_to_id) : null;
          const replyToMessage = replyMsg ? {
            senderName: String(replyMsg.sender_id) === String(friendId) ? friend?.name : "You",
            content: replyMsg.content
          } : null;

          const isFirstMessage = index === 0;

          return (
            <div 
              key={m.id}
              ref={node => {
                messageRefs.current[m.id] = node;
                if (isFirstMessage) topMessageElementRef(node);
              }}
              className={`transition-colors duration-1000 ${highlightedMsgId === m.id ? 'bg-accent-900/20 -mx-4 px-4 py-2 rounded' : ''}`}
            >
              <MessageBubble
                content={m.content}
                isMine={isMine}
                timestamp={new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                onReply={() => !m.is_deleted && setReplyingTo(m)}
                replyToMessage={replyToMessage}
                isPinned={m.is_pinned}
                isEdited={m.is_edited}
                isDeleted={m.is_deleted}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, message: m });
                }}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-col bg-parchment-100 shrink-0 relative">
        {(replyingTo || editingMessage) && (
          <div className="flex items-center justify-between bg-parchment-050 border-t border-accent-900 px-4 py-2 text-sm text-ink-muted">
            <div className="truncate pr-4 border-l-2 border-accent-800 pl-2">
              <span className="font-bold text-ink text-xs block mb-0.5">
                {editingMessage ? "Editing Message" : `Replying to ${String(replyingTo?.sender_id) === String(friendId) ? friend?.name : "yourself"}`}
              </span>
              <span className="truncate block">{renderFormattedText((editingMessage || replyingTo).content)}</span>
            </div>
            <button 
              onClick={() => {
                setReplyingTo(null);
                if (editingMessage) {
                  setEditingMessage(null);
                  setText("");
                }
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-accent-900/10 text-ink font-bold shrink-0"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSend(text); }} className="flex gap-2 items-center p-4 border-t border-accent-900 relative">
        <EmojiPicker textAreaRef={inputRef} value={text} onChange={setText} dropUp={true} />
        
        <div className="relative inline-block" ref={formatRef}>
          <button 
            type="button" 
            onClick={() => setShowFormat(!showFormat)} 
            className="px-2 py-1 text-xs hover:bg-accent-800 hover:text-cream rounded border border-line bg-parchment-100"
          >
            Tags
          </button>
          {showFormat && (
            <div className="absolute bottom-full left-0 mb-1 z-50 shadow-lg">
              <FormatToolbar textAreaRef={inputRef} value={text} onChange={setText} />
            </div>
          )}
        </div>

        {text === "/" && <SlashCommandMenu onSelect={applySlashCommand} />}
        <input
          ref={inputRef}
          value={text} onChange={(e) => setText(e.target.value)} placeholder="Write something... (Type / for formatting)"
          className="flex-1 px-3 py-2 rounded-full bg-parchment-050 border border-line text-sm font-mono focus:outline-none focus:border-accent-800"
        />
        <Button type="submit">Send</Button>
      </form>
      </div>

      {contextMenu && (() => {
        const isMineMenu = String(contextMenu.message.sender_id) !== String(friendId);
        return (
          <div 
            className="fixed z-[100] bg-parchment-050 border border-accent-900 rounded shadow-md w-32 overflow-hidden"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {!isMineMenu && !contextMenu.message.is_deleted && (
              <button 
                className="w-full text-left px-4 py-2 text-sm font-mono text-ink hover:bg-accent-900/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyingTo(contextMenu.message);
                  setContextMenu(null);
                }}
              >
                Reply
              </button>
            )}
            {isMineMenu && !contextMenu.message.is_deleted && (
              <button 
                className="w-full text-left px-4 py-2 text-sm font-mono text-ink hover:bg-accent-900/10 border-b border-accent-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingMessage(contextMenu.message);
                  setText(contextMenu.message.content);
                  setReplyingTo(null);
                  setContextMenu(null);
                }}
              >
                Edit
              </button>
            )}
            {!contextMenu.message.is_deleted && (
              <button 
                className="w-full text-left px-4 py-2 text-sm font-mono text-ink hover:bg-accent-900/10 border-b border-accent-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePin(contextMenu.message);
                  setContextMenu(null);
                }}
              >
                {contextMenu.message.is_pinned ? "Unpin" : "Pin"}
              </button>
            )}
            {isMineMenu && !contextMenu.message.is_deleted && (
              <button 
                className="w-full text-left px-4 py-2 text-sm font-mono text-red-600 hover:bg-red-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(contextMenu.message);
                  setContextMenu(null);
                }}
              >
                Delete
              </button>
            )}
            {contextMenu.message.is_deleted && (
              <div className="px-4 py-2 text-xs font-mono text-ink-muted italic">
                Message Deleted
              </div>
            )}
          </div>
        );
      })()}

      <ConfirmModal 
        isOpen={!!confirmDeleteMessage}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteMessage(null)}
      />

      <ConfirmModal
        isOpen={confirmBlock}
        title="Block User"
        message={`Are you sure you want to block ${friend?.name}?`}
        onConfirm={executeBlock}
        onCancel={() => setConfirmBlock(false)}
        confirmText="Block"
      />
    </div>
  );
}
