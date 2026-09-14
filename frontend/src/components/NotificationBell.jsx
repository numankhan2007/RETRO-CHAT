import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getIncomingRequests } from "../services/friendsService";
import { getConversations, markAsRead } from "../services/chatService";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/notificationService";
import { useChatSocket } from "../context/ChatSocketContext";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [unreadConversations, setUnreadConversations] = useState([]);
  const [blogNotifications, setBlogNotifications] = useState([]);
  const { lastMessage } = useChatSocket();
  const bellRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const [reqRes, convRes, notifRes] = await Promise.all([
        getIncomingRequests(),
        getConversations(),
        getNotifications()
      ]);
      setRequests(reqRes.data);
      setUnreadConversations(convRes.data.filter(c => c.unread_count > 0 && !c.is_muted));
      setBlogNotifications(notifRes.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for friend requests
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (lastMessage && lastMessage.type === "new_message") {
      // Re-fetch to get accurate unread counts when a message arrives
      fetchNotifications();
    }
  }, [lastMessage]);

  const handleClose = async () => {
    setOpen(false);
    let needsRefetch = false;
    
    // If there are unread messages, mark them as read
    if (unreadConversations.length > 0) {
      try {
        await Promise.all(unreadConversations.map(c => markAsRead(c.friend_id)));
        needsRefetch = true;
      } catch (e) {
        console.error("Failed to mark conversations read", e);
      }
    }
    
    // If there are unread blog notifications, mark them as read
    if (blogNotifications.length > 0) {
      try {
        await markAllNotificationsRead();
        needsRefetch = true;
      } catch (e) {
        console.error("Failed to mark blog notifications read", e);
      }
    }

    if (needsRefetch) {
      fetchNotifications();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        if (open) {
          handleClose();
        } else {
          setOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, unreadConversations, blogNotifications]);

  const handleNotificationClick = async (notif) => {
    setOpen(false);
    try {
      await markNotificationRead(notif.id);
      fetchNotifications();
      if (notif.post_id) {
        navigate(`/blog/${notif.post_id}`);
      }
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  const totalNotifications = requests.length + unreadConversations.length + blogNotifications.length;

  if (!user) return null;

  return (
    <div className="relative" ref={bellRef}>
      <button 
        onClick={() => {
          if (open) handleClose();
          else setOpen(true);
        }}
        className="relative p-2 rounded hover:bg-accent-800 text-cream transition-colors flex items-center justify-center"
      >
        <span className="text-xl">🔔</span>
        {totalNotifications > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-accent-900">
            {totalNotifications > 9 ? "9+" : totalNotifications}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-parchment-050 border-2 border-accent-900 rounded shadow-lg z-50 overflow-hidden flex flex-col">
          <div className="bg-accent-900 text-cream px-3 py-2 font-bold text-sm border-b border-accent-800 flex justify-between items-center">
            <span>Notifications</span>
            <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="hover:text-cream/70 px-1" title="Close">✕</button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {totalNotifications === 0 ? (
              <div className="p-4 text-center text-ink-muted text-sm italic font-mono">
                No new notifications
              </div>
            ) : (
              <div className="flex flex-col">
                {requests.map(req => (
                  <button 
                    key={`req-${req.request_id}`}
                    onClick={() => { handleClose(); navigate("/friends"); }}
                    className="p-3 text-left border-b border-line hover:bg-accent-200 transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">👋</span>
                    <div>
                      <p className="text-sm font-bold text-ink">New friend request</p>
                      <p className="text-xs text-ink-muted">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}

                {unreadConversations.map(conv => (
                  <button
                    key={`conv-${conv.id}`}
                    onClick={() => { handleClose(); navigate(`/chats/${conv.friend_id}`); }}
                    className="p-3 text-left border-b border-line hover:bg-accent-200 transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">💬</span>
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {conv.unread_count} new message{conv.unread_count > 1 ? 's' : ''} from {conv.friend_name || conv.friend_username}
                      </p>
                    </div>
                  </button>
                ))}

                {blogNotifications.map(notif => (
                  <button
                    key={`notif-${notif.id}`}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-3 text-left border-b border-line hover:bg-accent-200 transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">{notif.type === 'blog_like' ? '❤️' : '📝'}</span>
                    <div>
                      <p className="text-sm text-ink">
                        <span className="font-bold">{notif.actor_name || notif.actor_username}</span> 
                        {notif.type === 'blog_like' ? ' liked your post' : ' commented on your post'}
                      </p>
                      <p className="text-xs text-ink-muted">{new Date(notif.created_at).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
