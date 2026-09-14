import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getConversations } from "../services/chatService";
import { stripFormatting } from "../utils/textUtils";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import NotificationBell from "../components/NotificationBell";
import Skeleton from "../components/Skeleton";

export default function ChatsListPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { friendId } = useParams();
  useEffect(() => { 
    getConversations()
      .then((res) => setConversations(res.data))
      .finally(() => setLoading(false));
  }, []);

  const renderLastMessage = (c) => {
    if (c.unread_count > 1) return `${c.unread_count}+ new msg`;
    if (c.last_message === null || c.last_message === undefined) return "No messages yet";
    
    let prefix = "";
    if (c.last_message_sender_id && String(c.last_message_sender_id) !== String(c.friend_id)) {
      prefix = "You: ";
    }
    
    if (c.last_message === "") return `${prefix}🚫 This message was deleted`;
    return `${prefix}${stripFormatting(c.last_message)}`;
  };

  return (
    <div className="flex flex-col h-full bg-parchment-100">
      <div className="h-[72px] flex items-center justify-between px-6 border-b border-accent-900 shrink-0">
        <h1 className="font-display font-bold text-xl">Chats</h1>
        <div className="md:hidden">
          <NotificationBell />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col gap-2">
        {loading && (
          <>
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="flex items-center gap-3">
                <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
                <div className="flex flex-col flex-1 gap-2">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-full h-3 max-w-[200px]" />
                </div>
              </Card>
            ))}
          </>
        )}
        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 mt-4 border-2 border-dashed border-accent-300 bg-parchment-050 rounded-xl gap-4">
            <p className="text-ink-muted text-center font-mono text-sm max-w-xs">
              No conversations yet. Add a friend to start chatting!
            </p>
            <Link to="/friends">
              <Button variant="primary">Find Friends</Button>
            </Link>
          </div>
        )}
        {!loading && conversations.map((c) => (
          <Link key={c.id} to={`/chats/${c.friend_id}`}>
            <Card className={`flex items-center gap-3 hover:border-accent-800 relative ${String(friendId) === String(c.friend_id) ? 'bg-accent-900/10 border-accent-800' : ''}`}>
              <div className="relative">
                <Avatar username={c.friend_username} />
                {c.is_online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-parchment-100 rounded-full"></span>
                )}
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="font-bold text-sm flex items-center gap-2">
                  {c.friend_name}
                  {c.is_muted && <span title="Muted" className="text-xs">🔇</span>}
                </span>
                <span className={`text-xs truncate ${c.unread_count > 0 ? "text-ink font-bold" : "text-ink-muted"}`}>
                  {renderLastMessage(c)}
                </span>
              </div>
              {c.unread_count > 0 && (
                <span className="bg-coral-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                  {c.unread_count > 4 ? "4+" : c.unread_count}
                </span>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
