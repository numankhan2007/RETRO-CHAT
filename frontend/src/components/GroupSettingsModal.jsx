import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { updateGroup, addGroupMember, removeGroupMember, updateGroupMemberRole } from "../services/chatService";
import { getFriends } from "../services/friendsService";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import Input from "./Input";
import Avatar from "./Avatar";

export default function GroupSettingsModal({ isOpen, onClose, group, onUpdate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Group Info State
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  
  // Member Management State
  const [friends, setFriends] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const fileInputRef = useRef();

  const myRole = group?.members?.find(m => String(m.user_id) === String(user?.id))?.role;
  const isAdmin = myRole === "admin";

  useEffect(() => {
    if (isOpen && group) {
      setName(group.name);
      setBio(group.bio || "");
      getFriends().then(res => setFriends(res.data));
    }
  }, [isOpen, group]);

  if (!isOpen || !group) return null;

  const handleUpdateInfo = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await updateGroup(group.id, { name, bio });
      onUpdate(res.data);
      alert("Group info updated!");
    } catch (e) {
      alert("Failed to update group.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      // Get presigned URL
      const { data: { upload_url, object_key } } = await api.post(`/groups/${group.id}/avatar/presigned-url`, {
        filename: file.name,
        content_type: file.type
      });
      // Upload to R2
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });
      // Update group
      const res = await api.post(`/groups/${group.id}/avatar/complete`, { object_key });
      onUpdate(res.data);
    } catch (e) {
      alert("Failed to upload avatar.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (friendId) => {
    try {
      const res = await addGroupMember(group.id, friendId);
      onUpdate(res.data);
      setShowAddMember(false);
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      const res = await removeGroupMember(group.id, memberId);
      onUpdate(res.data);
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to remove member");
    }
  };

  const handleToggleRole = async (member) => {
    const newRole = member.role === "admin" ? "member" : "admin";
    if (!window.confirm(`Make ${member.name} ${newRole}?`)) return;
    try {
      const res = await updateGroupMemberRole(group.id, member.user_id, newRole);
      onUpdate(res.data);
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to change role");
    }
  };

  const nonMembers = friends.filter(f => !group.members.some(m => String(m.user_id) === String(f.id)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-parchment-100 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-accent-900 flex justify-between items-center shrink-0">
          <h2 className="font-display font-bold text-xl">Group Info</h2>
          <button onClick={onClose} className="text-2xl hover:text-accent-700">✕</button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar url={group.avatar_url} username={group.name} size="lg" isGroup={true} />
            {isAdmin && (
              <>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="text-xs text-accent-700 hover:underline font-bold"
                  disabled={loading}
                >
                  Change Avatar
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <Input 
              label="Group Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={!isAdmin || loading} 
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-ink">Bio</label>
              <textarea 
                className="w-full bg-parchment-050 border border-line rounded p-2 text-sm font-mono focus:border-accent-800 focus:outline-none"
                rows="2"
                value={bio}
                onChange={e => setBio(e.target.value)}
                disabled={!isAdmin || loading}
              ></textarea>
            </div>
            {isAdmin && (
              <Button size="sm" onClick={handleUpdateInfo} disabled={loading || group.name === name && (group.bio||"") === bio}>
                Save Info
              </Button>
            )}
          </div>
          
          <div className="border-t border-accent-900 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Members ({group.members.length})</h3>
              {isAdmin && !showAddMember && (
                <Button size="sm" variant="ghost" onClick={() => setShowAddMember(true)}>+ Add Member</Button>
              )}
            </div>
            
            {showAddMember && (
              <div className="bg-parchment-200 border border-accent-900/50 p-3 rounded mb-4">
                <h4 className="text-xs font-bold mb-2">Select Friend to Add</h4>
                <div className="max-h-40 overflow-y-auto flex flex-col gap-1 custom-scrollbar">
                  {nonMembers.length === 0 ? <p className="text-xs text-ink-muted">No friends available to add.</p> : null}
                  {nonMembers.map(f => (
                    <div key={f.id} className="flex justify-between items-center p-1 hover:bg-parchment-300 rounded cursor-pointer" onClick={() => handleAddMember(f.id)}>
                      <div className="flex items-center gap-2">
                        <Avatar url={f.avatar_url} username={f.username} size="sm" />
                        <span className="text-sm font-bold">{f.name}</span>
                      </div>
                      <span className="text-xl text-accent-700 font-bold">+</span>
                    </div>
                  ))}
                </div>
                <button className="text-xs text-coral-600 font-bold mt-2 hover:underline" onClick={() => setShowAddMember(false)}>Cancel</button>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {group.members.map(m => (
                <div key={m.user_id} className="flex items-center justify-between p-2 border border-line rounded bg-parchment-050">
                  <div className="flex items-center gap-3">
                    <Avatar url={m.avatar_url} username={m.username} size="sm" />
                    <div>
                      <p className="font-bold text-sm leading-tight flex items-center gap-2">
                        {m.name} {String(m.user_id) === String(user?.id) && <span className="text-xs font-normal text-ink-muted">(You)</span>}
                      </p>
                      <p className="text-xs text-ink-muted">@{m.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${m.role === 'admin' ? 'bg-accent-700 text-cream' : 'bg-parchment-300 text-ink'}`}>
                      {m.role}
                    </span>
                    
                    {isAdmin && String(m.user_id) !== String(user?.id) && (
                      <div className="relative group/menu">
                        <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-parchment-200">⋮</button>
                        <div className="absolute right-0 top-full mt-1 bg-parchment-100 border border-accent-900 rounded shadow-lg w-32 hidden group-hover/menu:block z-10">
                          <button 
                            className="w-full text-left px-3 py-2 text-xs hover:bg-accent-900/10"
                            onClick={() => handleToggleRole(m)}
                          >
                            {m.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                          </button>
                          <button 
                            className="w-full text-left px-3 py-2 text-xs text-coral-600 font-bold hover:bg-coral-500/10 border-t border-accent-900/20"
                            onClick={() => handleRemoveMember(m.user_id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
