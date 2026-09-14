import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStats, updateProfile } from "../services/authService";
import api from "../services/api";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Input from "../components/Input";
import NotificationBell from "../components/NotificationBell";
import ImageCropperModal from "../components/ImageCropperModal";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [stats, setStats] = useState({ posts_count: 0, friends_count: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", username: "", bio: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    getStats().then((res) => setStats(res.data));
    if (user) {
      setEditForm({ name: user.name || "", username: user.username || "", bio: user.bio || "" });
    }
  }, [user]);

  const handleSave = async () => {
    setError("");
    try {
      const res = await updateProfile(editForm);
      setUser(res.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    }
  };

  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => setSelectedImage(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedBlob) => {
    setSelectedImage(null);
    setIsUploading(true);
    setError("");

    try {
      // 1. Get Presigned URL
      const { data: presignedData } = await api.post("/users/me/avatar/presigned-url", {
        content_type: "image/webp",
      });

      // 2. Upload to R2 using PUT
      const uploadRes = await fetch(presignedData.upload_url, {
        method: "PUT",
        body: croppedBlob,
        headers: {
          "Content-Type": "image/webp",
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image to Cloudflare R2");
      }

      // 3. Confirm with Backend
      const { data: updatedUser } = await api.post("/users/me/avatar/complete", {
        object_key: presignedData.object_key,
      });

      setUser(updatedUser);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-md md:max-w-xl mx-auto flex flex-col gap-4 mt-8 px-4">
      <div className="flex items-center justify-between mb-2 border-b-2 border-accent-900 pb-2">
        <div className="w-8 md:hidden"></div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-center md:text-left md:flex-1">Profile</h1>
        <div className="md:hidden w-8 flex justify-end"><NotificationBell /></div>
      </div>
      
      <Card className="flex flex-col items-center p-6 relative mb-4">
        {selectedImage && (
          <ImageCropperModal
            imageSrc={selectedImage}
            onComplete={handleCropComplete}
            onCancel={() => {
              setSelectedImage(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        )}
        
        <div 
          className={`relative group mb-4 ${isEditing ? 'cursor-pointer' : ''}`} 
          onClick={() => isEditing && fileInputRef.current?.click()}
        >
          <Avatar username={user?.username || "Guest"} avatarUrl={user?.avatar_url} size="lg" className="shadow-md" />
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-xs font-bold">Upload</span>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold animate-pulse">Uploading...</span>
            </div>
          )}
        </div>
        
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
        
        {error && <div className="text-red-500 text-sm text-center mb-2 w-full">{error}</div>}

        {isEditing ? (
          <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
            <Input 
              placeholder="Name" 
              value={editForm.name} 
              onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
            />
            <Input 
              placeholder="Username" 
              maxLength={20}
              pattern="^[a-zA-Z0-9._]+$"
              title="Usernames can only contain letters, numbers, dots, and underscores."
              value={editForm.username} 
              onChange={(e) => setEditForm({...editForm, username: e.target.value})} 
            />
            <textarea 
              placeholder="Bio"
              className="w-full bg-parchment-100 border-2 border-accent-900 rounded-md p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none h-24 custom-scrollbar"
              value={editForm.bio}
              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
            />
            <div className="flex gap-2 mt-2">
              <Button className="flex-1" onClick={handleSave}>Save</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mt-3">
              <h2 className="font-display text-xl font-bold">{user?.name || "User"}</h2>
            </div>
            <p className="font-mono text-sm text-ink-muted mt-1">{user?.username || "user"}</p>
            <p className="mt-2 text-sm max-w-sm mx-auto text-center">{user?.bio || "No bio yet."}</p>
            
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 text-accent-800 hover:text-accent-900 focus:outline-none bg-accent-900/10 p-1.5 rounded-full transition-colors flex items-center justify-center"
              title="Edit Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
          </>
        )}
      </Card>

      <div className="flex justify-around bg-parchment-050 border-2 border-accent-900/20 p-4 rounded-xl shadow-sm mb-4">
        <div className="flex flex-col items-center flex-1">
          <span className="font-display font-bold text-xl md:text-2xl text-ink">{stats.posts_count}</span>
          <span className="font-mono text-xs text-ink-muted uppercase mt-1">Posts</span>
        </div>
        <div className="w-[2px] bg-accent-900/20 mx-2 rounded-full"></div>
        <div className="flex flex-col items-center flex-1">
          <span className="font-display font-bold text-xl md:text-2xl text-ink">{stats.friends_count}</span>
          <span className="font-mono text-xs text-ink-muted uppercase mt-1">Friends</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center">
        <Link to="/settings" className="w-full md:flex-1">
          <Button variant="secondary" className="w-full text-center justify-center">Settings</Button>
        </Link>
        <Button variant="ghost" className="w-full md:flex-1 text-center justify-center text-red-600 border border-red-600 md:mt-0 mt-2" onClick={logout}>Sign Out</Button>
      </div>
    </div>
  );
}
