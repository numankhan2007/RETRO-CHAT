import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteAccount } from "../services/authService";
import Button from "../components/Button";
import Input from "../components/Input";

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText !== user.username) {
      setError("Username does not match");
      return;
    }

    setIsDeleting(true);
    setError("");
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-md md:max-w-3xl mx-auto flex flex-col gap-4 mt-8">
      <div className="flex items-center mb-2 border-b-2 border-accent-900 pb-2">
        <button onClick={() => navigate("/settings")} className="p-2 -ml-2 mr-2 hover:bg-accent-900/10 rounded-full text-accent-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-display font-bold text-2xl flex-1 text-center pr-8">Account</h1>
      </div>

      <div className="mt-4 border-2 border-red-600/30 bg-red-50/50 p-4 rounded-md">
        <h2 className="font-display font-bold text-red-600 text-lg mb-2">Danger Zone</h2>
        <p className="text-sm text-ink-muted mb-4 font-mono">
          Deleting your account is permanent. All your posts, comments, friends, and chat history will be completely erased. This action cannot be undone.
        </p>
        
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-ink">Type <span className="text-red-600 font-mono">{user?.username}</span> to confirm:</label>
          <Input 
            placeholder={user?.username}
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setError("");
            }}
          />
        </div>

        {error && <div className="text-red-600 text-xs mt-2 font-bold">{error}</div>}

        <Button 
          className="w-full mt-4 bg-red-600 border-red-800 text-white hover:bg-red-700" 
          disabled={confirmText !== user?.username || isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? "Deleting..." : "Delete Account Forever"}
        </Button>
      </div>
    </div>
  );
}
