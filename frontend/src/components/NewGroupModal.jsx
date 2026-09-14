import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { createGroup } from "../services/chatService";
import Button from "./Button";
import Input from "./Input";
import Avatar from "./Avatar";

export default function NewGroupModal({ isOpen, onClose }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      api.get("/friends").then((res) => setFriends(res.data));
      setSelectedFriends([]);
      setGroupName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFriend = (id) => {
    if (selectedFriends.includes(id)) {
      setSelectedFriends(selectedFriends.filter((f) => f !== id));
    } else {
      setSelectedFriends([...selectedFriends, id]);
    }
  };

  const handleCreate = async () => {
    if (selectedFriends.length < 2) {
      alert("Please select at least 2 friends.");
      return;
    }
    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }

    setLoading(true);
    try {
      const res = await createGroup({
        name: groupName.trim(),
        member_ids: selectedFriends,
      });
      onClose();
      navigate(`/chats/group/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-parchment-100 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-accent-900 shrink-0">
          <h2 className="font-display font-bold text-xl">Create New Group</h2>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          <Input 
            label="Group Name" 
            placeholder="e.g. Retro Squad" 
            value={groupName} 
            onChange={(e) => setGroupName(e.target.value)} 
          />
          
          <div>
            <label className="block font-bold text-sm mb-2 text-ink">Select Friends (Min 2)</label>
            <div className="flex flex-col gap-2">
              {friends.length === 0 ? (
                <p className="text-ink-muted text-sm italic">You don't have any friends yet.</p>
              ) : (
                friends.map((friend) => (
                  <div 
                    key={friend.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border-2 transition-colors ${selectedFriends.includes(friend.id) ? 'border-accent-600 bg-accent-900/10' : 'border-transparent hover:bg-parchment-200'}`}
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <Avatar url={friend.avatar_url} username={friend.username} size="sm" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{friend.name}</p>
                      <p className="text-xs text-ink-muted">@{friend.username}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedFriends.includes(friend.id) ? 'bg-accent-600 border-accent-600' : 'border-accent-300'}`}>
                      {selectedFriends.includes(friend.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-accent-900 flex justify-end gap-2 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={loading || selectedFriends.length < 2 || !groupName.trim()}>
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </div>
    </div>
  );
}
