import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBlocks, unblockUser } from "../services/blockService";
import Button from "../components/Button";
import ConfirmModal from "../components/ConfirmModal";

export default function BlockedUsersPage() {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [confirmUnblock, setConfirmUnblock] = useState(null);

  const fetchBlocks = async () => {
    try {
      const res = await getBlocks();
      setBlockedUsers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleUnblock = (b) => {
    setConfirmUnblock(b);
  };

  const executeUnblock = async () => {
    if (!confirmUnblock) return;
    await unblockUser(confirmUnblock.blocked_id);
    fetchBlocks();
    setConfirmUnblock(null);
  };

  return (
    <div className="max-w-md md:max-w-3xl mx-auto flex flex-col gap-4 mt-8">
      <div className="flex items-center mb-2 border-b-2 border-accent-900 pb-2">
        <button onClick={() => navigate("/settings")} className="p-2 -ml-2 mr-2 hover:bg-accent-900/10 rounded-full text-accent-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-display font-bold text-2xl flex-1 text-center pr-8">Blocked Users</h1>
      </div>

      {blockedUsers.length === 0 ? (
        <p className="text-center text-ink-muted text-sm italic mt-8">You haven't blocked anyone.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {blockedUsers.map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 bg-parchment-100 border border-line rounded">
              <span className="font-bold text-sm text-ink">{b.blocked_name} <span className="font-mono text-xs text-accent-800 opacity-80">{b.blocked_username}</span></span>
              <Button variant="secondary" size="sm" onClick={() => handleUnblock(b)}>Unblock</Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmUnblock}
        title="Unblock User"
        message={`Are you sure you want to unblock ${confirmUnblock?.blocked_name}?`}
        onConfirm={executeUnblock}
        onCancel={() => setConfirmUnblock(null)}
        confirmText="Unblock"
      />
    </div>
  );
}
