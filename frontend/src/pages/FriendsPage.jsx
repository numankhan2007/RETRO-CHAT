import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getFriends, getIncomingRequests, acceptRequest, declineRequest, sendFriendRequest, removeFriend, updateFriendPreferences, searchUsers } from "../services/friendsService";
import { blockUser } from "../services/blockService";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Input from "../components/Input";
import NotificationBell from "../components/NotificationBell";
import Skeleton from "../components/Skeleton";
import ConfirmModal from "../components/ConfirmModal";

function FriendItem({ friend, onRefresh }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleStar = async () => {
    await updateFriendPreferences(friend.id, { is_starred: !friend.is_starred });
    setMenuOpen(false);
    onRefresh();
  };

  const handleTogglePin = async () => {
    await updateFriendPreferences(friend.id, { is_pinned: !friend.is_pinned });
    setMenuOpen(false);
    onRefresh();
  };

  const handleToggleMute = async () => {
    await updateFriendPreferences(friend.id, { is_muted: !friend.is_muted });
    setMenuOpen(false);
    onRefresh();
  };

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  const handleDelete = () => {
    setConfirmDelete(true);
  };

  const executeDelete = async () => {
    await removeFriend(friend.id);
    setMenuOpen(false);
    setConfirmDelete(false);
    onRefresh();
  };

  const handleBlock = () => {
    setConfirmBlock(true);
  };

  const executeBlock = async () => {
    await blockUser(friend.id);
    setMenuOpen(false);
    setConfirmBlock(false);
    onRefresh();
  };

  return (
    <Card className="flex items-center justify-between mb-2 p-3">
      <div className="flex items-center gap-3">
        <Avatar username={friend.username} avatarUrl={friend.avatar_url} size="sm" />
        <div className="flex flex-col flex-1 gap-1">
          <span className="font-bold text-sm">{friend.name}</span>
          {friend.bio && <span className="text-xs text-ink-muted line-clamp-1">{friend.bio}</span>}
        </div>
        <span className="text-sm font-bold flex items-center gap-2">
          {friend.is_muted && <span title="Muted">🔇</span>}
          {friend.is_pinned && <span title="Pinned">📌</span>}
          {friend.is_starred && <span title="Starred">⭐</span>}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => navigate(`/chats/${friend.id}`)}>
          Message
        </Button>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent-200 text-ink-muted transition-colors"
          >
            ⋮
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-parchment-050 border-2 border-accent-900 rounded shadow-md z-10 flex flex-col overflow-hidden">
              <button onClick={handleTogglePin} className="px-4 py-2 text-sm text-left hover:bg-accent-200 border-b-2 border-accent-200">
                {friend.is_pinned ? "Unpin" : "Pin"} Friend
              </button>
              <button onClick={handleToggleStar} className="px-4 py-2 text-sm text-left hover:bg-accent-200 border-b-2 border-accent-200">
                {friend.is_starred ? "Unstar" : "Star"} Friend
              </button>
              <button onClick={handleToggleMute} className="px-4 py-2 text-sm text-left hover:bg-accent-200 border-b-2 border-accent-200">
                {friend.is_muted ? "Unmute" : "Mute"} Chat
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm text-left text-red-600 hover:bg-red-100 font-bold border-b-2 border-accent-200">
                Remove Friend
              </button>
              <button onClick={handleBlock} className="px-4 py-2 text-sm text-left text-red-600 hover:bg-red-100 font-bold">
                Block User
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmDelete}
        title="Remove Friend"
        message={`Are you sure you want to remove ${friend.name}?`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(false)}
        confirmText="Remove"
      />
      
      <ConfirmModal
        isOpen={confirmBlock}
        title="Block User"
        message={`Are you sure you want to block ${friend.name}? This will remove them from your friends and chats.`}
        onConfirm={executeBlock}
        onCancel={() => setConfirmBlock(false)}
        confirmText="Block"
      />
    </Card>
  );
}

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.trim().length > 0) {
        searchUsers(username).then(res => {
          setSearchResults(res.data);
          setShowResults(true);
        });
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [username]);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      getFriends().then((res) => {
        const sorted = res.data.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          if (a.is_starred && !b.is_starred) return -1;
          if (!a.is_starred && b.is_starred) return 1;
          return a.username.localeCompare(b.username);
        });
        setFriends(sorted);
      }),
      getIncomingRequests().then((res) => setRequests(res.data))
    ]).finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const handleAdd = async (e, targetUsername = username) => {
    if (e) e.preventDefault();
    setMessage("");
    try {
      await sendFriendRequest(targetUsername);
      setMessage(`Request sent to ${targetUsername}`);
      setUsername("");
      setShowResults(false);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not send request");
    }
  };

  return (
    <div className="max-w-md md:max-w-5xl mx-auto px-4 mt-8 flex flex-col gap-6 w-full">
      <div>
        <div className="flex items-center justify-between mb-2 border-b-2 border-accent-900 pb-2">
          <h1 className="font-display font-bold text-2xl">Add a Friend</h1>
          <div className="md:hidden"><NotificationBell /></div>
        </div>
        <form onSubmit={(e) => handleAdd(e)} className="relative" ref={searchRef}>
          <div className="relative flex items-center w-full">
            <div className="absolute left-4 text-accent-800/60">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input 
              type="text"
              placeholder="Search for friends by username..." 
              value={username} 
              onChange={(e) => { setUsername(e.target.value); setShowResults(true); }}
              onFocus={() => { if(username.length > 0) setShowResults(true); }}
              className="w-full pl-12 pr-32 py-3 bg-parchment-050 border-2 border-accent-900/20 hover:border-accent-900/50 focus:border-accent-900 rounded-full font-mono text-sm focus:outline-none transition-colors shadow-sm text-ink"
            />
            <button 
              type="submit" 
              disabled={!username.trim()}
              className="absolute right-2 px-4 py-1.5 bg-accent-900 text-parchment-050 rounded-full font-bold text-sm hover:bg-accent-800 disabled:opacity-50 transition-colors"
            >
              Add Friend
            </button>
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-parchment-050 border-2 border-accent-900/20 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleAdd(null, user.username)}
                  className="w-full text-left p-3 hover:bg-accent-900/10 border-b border-line flex items-center justify-between transition-colors last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar username={user.username} avatarUrl={user.avatar_url} size="sm" />
                    <div>
                      <div className="font-bold text-sm text-ink">{user.name}</div>
                      <div className="text-xs text-ink-muted">{user.username}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent-800 bg-accent-200 px-3 py-1 rounded-full">Send Request</span>
                </button>
              ))}
            </div>
          )}
          {showResults && searchResults.length === 0 && username.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-parchment-050 border-2 border-accent-900/20 rounded-xl shadow-lg z-50 p-4 text-center text-sm text-ink-muted">
              No users found matching "<span className="font-bold">{username}</span>"
            </div>
          )}
        </form>
        {message && <p className="text-xs text-accent-800 mt-2 ml-4 font-bold">{message}</p>}
      </div>

      {requests.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-2xl mb-2 border-b-2 border-accent-900 pb-2">Friend Requests</h2>
          {requests.map((r) => (
            <Card key={r.request_id} className="flex items-center justify-between mb-2 p-3">
              <span className="text-sm font-bold">New friend request</span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => acceptRequest(r.request_id).then(refresh).catch((err) => alert(err.response?.data?.detail || "Failed to accept request"))}>Accept</Button>
                <Button variant="ghost" onClick={() => declineRequest(r.request_id).then(refresh).catch((err) => alert(err.response?.data?.detail || "Failed to decline request"))}>Decline</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-display font-bold text-xl mb-4 border-b border-accent-900/20 pb-2">Your Friends</h2>
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="flex items-center gap-4">
                <Skeleton variant="circle" className="w-12 h-12 shrink-0" />
                <div className="flex flex-col flex-1 gap-2">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-16 h-3" />
                </div>
              </Card>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 mt-4 border-2 border-dashed border-accent-300 bg-parchment-050 rounded-xl gap-4">
            <p className="text-ink-muted text-center font-mono text-sm max-w-xs">
              You haven't added any friends yet. Use the form above to send a request!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {friends.map((f) => (
              <FriendItem key={f.id} friend={f} onRefresh={refresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
