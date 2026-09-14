import { useState } from "react";
import { Link } from "react-router-dom";
import Card from "./Card";
import Avatar from "./Avatar";
import Badge from "./Badge";
import Button from "./Button";
import { useAuth } from "../context/AuthContext";
import { likePost, unlikePost, savePost, unsavePost, deletePost } from "../services/blogService";
import { renderFormattedText } from "../utils/textUtils";
import ConfirmModal from "./ConfirmModal";

export default function PostCard({ post: initialPost, onDelete }) {
  const [post, setPost] = useState(initialPost);
  const { user } = useAuth();
  const isAuthor = user?.username === post.author_username;

  const toggleLike = async (e) => {
    e.preventDefault();
    if (post.is_liked) {
      await unlikePost(post.id);
      setPost({ ...post, is_liked: false, likes_count: post.likes_count - 1 });
    } else {
      await likePost(post.id);
      setPost({ ...post, is_liked: true, likes_count: post.likes_count + 1 });
    }
  };

  const toggleSave = async (e) => {
    e.preventDefault();
    if (post.is_saved) {
      await unsavePost(post.id);
      setPost({ ...post, is_saved: false });
    } else {
      await savePost(post.id);
      setPost({ ...post, is_saved: true });
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e) => {
    e.preventDefault();
    setConfirmDelete(true);
  };

  const executeDelete = async () => {
    await deletePost(post.id);
    if (onDelete) onDelete();
    setConfirmDelete(false);
  };

  return (
    <Card className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Avatar username={post.author_username} avatarUrl={post.author_avatar_url} size="sm" />
        <div className="flex flex-col flex-1">
          <span className="text-sm font-bold">{post.author_username}</span>
          <span className="text-xs text-ink-muted">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        {isAuthor && (
          <div className="flex gap-2 mr-2">
            <Link to={`/blog/${post.id}/edit`} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="text-xs px-2 py-1 h-auto">Edit</Button>
            </Link>
            <Button variant="ghost" onClick={handleDelete} className="text-xs px-2 py-1 h-auto text-red-600">Delete</Button>
          </div>
        )}
        <Badge>{post.visibility}</Badge>
      </div>
      <Link to={`/blog/${post.id}`}>
        <h3 className="font-display font-bold text-lg mb-1">{post.title}</h3>
        <p className="text-sm text-ink-muted line-clamp-3 mb-3 whitespace-pre-wrap break-words">{renderFormattedText(post.content)}</p>
      </Link>
      
      <div className="flex gap-4 border-t-2 border-line pt-2">
        <button onClick={toggleLike} className={`text-sm font-bold flex items-center gap-1 ${post.is_liked ? "text-coral-500" : "text-ink-muted"}`}>
          ♥ {post.likes_count}
        </button>
        <div className="text-sm font-bold text-ink-muted flex items-center gap-1">
          💬 {post.comments_count}
        </div>
        <button onClick={toggleSave} className={`ml-auto text-sm font-bold flex items-center gap-1 ${post.is_saved ? "text-accent-800" : "text-ink-muted"}`}>
          {post.is_saved ? "★ Saved" : "☆ Save"}
        </button>
      </div>

      <ConfirmModal 
        isOpen={confirmDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(false)}
        confirmText="Delete"
      />
    </Card>
  );
}
