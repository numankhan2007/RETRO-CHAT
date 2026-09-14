import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPost, getComments, addComment, deleteComment, pinComment } from "../services/blogService";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { renderFormattedText } from "../utils/textUtils";
import { useAuth } from "../context/AuthContext";
import { sendFriendRequest } from "../services/friendsService";
import ConfirmModal from "../components/ConfirmModal";

function CommentItem({ c, currentUser, isPostAuthor, onReply, onDelete, onPin, onUserClick }) {
  const isMine = currentUser?.id === c.author_id;

  return (
    <div className={`flex gap-3 px-2 py-3 ${c.is_pinned ? 'bg-accent-100/30 rounded-md' : ''}`}>
      <div className="shrink-0 pt-1">
        <Avatar username={c.author_username} avatarUrl={c.author_avatar_url} size="sm" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className="font-bold text-xs hover:underline cursor-pointer truncate"
            onClick={() => onUserClick(c.author_username, c.author_id)}
          >
            {c.author_username}
          </span>
          <span className="text-[10px] text-ink-muted font-mono whitespace-nowrap">
            {new Date(c.created_at).toLocaleDateString()}
          </span>
          {c.is_pinned && <span className="text-[10px] font-bold text-accent-700 ml-auto">📌 PINNED</span>}
        </div>
        <p className="text-sm mt-0.5 break-words whitespace-pre-wrap">{c.content}</p>
        
        <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-ink-muted font-mono">
          <button onClick={() => onReply(c)} className="hover:text-accent-800 transition-colors">Reply</button>
          
          {(isMine || isPostAuthor) && (
            <button onClick={() => onDelete(c)} className="hover:text-red-700 transition-colors">Delete</button>
          )}

          {isPostAuthor && (
            <button onClick={() => onPin(c)} className="hover:text-accent-800 transition-colors">
              {c.is_pinned ? "Unpin" : "Pin"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentThread({ topLevelComment, replies, currentUser, isPostAuthor, onReply, onDelete, onPin, onUserClick }) {
  const [showReplies, setShowReplies] = useState(false);

  const sharedProps = { currentUser, isPostAuthor, onReply, onDelete, onPin, onUserClick };

  return (
    <div className="mb-2 border-b border-line last:border-b-0 pb-2">
      <CommentItem c={topLevelComment} {...sharedProps} />
      
      {replies.length > 0 && (
        <div className="ml-11">
          {!showReplies ? (
            <button 
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-2 text-xs font-bold text-ink-muted hover:text-accent-800 transition-colors py-1 mt-1 font-mono"
            >
              <span className="w-6 h-[1px] bg-ink-muted/50"></span>
              View replies ({replies.length})
            </button>
          ) : (
            <div className="flex flex-col mt-2">
              {replies.map(r => (
                <CommentItem key={r.id} c={r} {...sharedProps} />
              ))}
              <button 
                onClick={() => setShowReplies(false)}
                className="flex items-center gap-2 text-xs font-bold text-ink-muted hover:text-accent-800 transition-colors py-1 mt-1 font-mono"
              >
                <span className="w-6 h-[1px] bg-ink-muted/50"></span>
                Hide replies
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmFriend, setConfirmFriend] = useState(null);

  useEffect(() => {
    getPost(postId).then((res) => setPost(res.data)).catch((err) => console.error("Failed to load post", err));
    getComments(postId).then((res) => setComments(res.data)).catch((err) => console.error("Failed to load comments", err));
  }, [postId]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const payload = { content: commentText };
      if (replyTo) {
        // If we reply to a reply, attach to its parent to keep flat threads
        payload.parent_id = replyTo.parent_id || replyTo.id;
      }
      
      const res = await addComment(postId, payload);
      setComments((prev) => {
        const newComments = [...prev, res.data];
        return newComments.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(a.created_at) - new Date(b.created_at);
        });
      });
      setCommentText("");
      setReplyTo(null);
    } catch (err) {
      console.error("Failed to add comment", err);
      alert(err.response?.data?.detail || "Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (c) => {
    setConfirmDelete(c);
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteComment(postId, confirmDelete.id);
      setComments((prev) => prev.filter((x) => x.id !== confirmDelete.id));
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handlePin = async (c) => {
    try {
      await pinComment(postId, c.id);
      setComments((prev) => {
        const mapped = prev.map(x => x.id === c.id ? { ...x, is_pinned: !x.is_pinned } : x);
        return mapped.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(a.created_at) - new Date(b.created_at);
        });
      });
    } catch (err) {
      console.error("Failed to pin", err);
      alert(err.response?.data?.detail || "Failed to pin comment");
    }
  };

  const handleUserClick = (targetUsername, targetUserId) => {
    if (user?.id === targetUserId) return;
    setConfirmFriend(targetUsername);
  };

  const executeAddFriend = async () => {
    if (!confirmFriend) return;
    try {
      await sendFriendRequest(confirmFriend);
    } catch (err) {
      console.error("Could not send friend request", err);
    } finally {
      setConfirmFriend(null);
    }
  };

  if (!post) return <p className="text-ink-muted text-sm px-4 mt-8">Loading...</p>;

  const isPostAuthor = user?.id === post.author_id;
  
  const topLevelComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  return (
    <div className="max-w-3xl md:max-w-4xl mx-auto mt-8 px-4 relative pb-12">
      <div className="flex items-center gap-4 mb-4 border-b-2 border-accent-900 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-accent-900/10 rounded-full text-accent-900 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Avatar username={post.author_username} avatarUrl={post.author_avatar_url} size="sm" />
          <span className="font-display font-bold text-sm md:text-base">{post.author_username}</span>
        </div>
        <Badge>{post.visibility}</Badge>
      </div>
      <h1 className="font-display font-bold text-2xl md:text-4xl mb-4">{post.title}</h1>
      <p className="text-sm md:text-base whitespace-pre-wrap break-words mb-8">{renderFormattedText(post.content)}</p>

      <h2 className="font-display font-bold text-xl mb-2 border-b-2 border-accent-900 pb-2 mt-8">Comments</h2>
      
      {topLevelComments.length === 0 ? (
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex flex-col items-center justify-center p-8 mt-2 border-2 border-dashed border-accent-300 bg-parchment-050 rounded-xl gap-2">
            <p className="text-ink-muted text-center font-mono text-sm">
              No comments yet. Be the first to reply!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col mb-4">
          {topLevelComments.map((c) => {
            const threadReplies = replies.filter(r => r.parent_id === c.id);
            return (
              <CommentThread 
                key={c.id} 
                topLevelComment={c} 
                replies={threadReplies} 
                currentUser={user}
                isPostAuthor={isPostAuthor}
                onReply={setReplyTo}
                onDelete={handleDelete}
                onPin={handlePin}
                onUserClick={handleUserClick}
              />
            );
          })}
        </div>
      )}
      
      {replyTo && (
        <div className="mb-2 flex items-center justify-between bg-parchment-050 p-2 rounded border border-line text-xs font-mono">
          <span>Replying to <span className="font-bold">@{replyTo.author_username}</span></span>
          <button type="button" onClick={() => setReplyTo(null)} className="text-red-700 font-bold hover:underline">Cancel</button>
        </div>
      )}
      
      <form onSubmit={handleComment} className="flex gap-2">
        <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..."
          className="flex-1 px-3 py-2 rounded-md bg-parchment-050 border border-line text-sm font-mono focus:outline-none focus:border-accent-800" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </form>

      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Delete"
      />

      <ConfirmModal
        isOpen={!!confirmFriend}
        title="Send Friend Request"
        message={`Do you want to send a friend request to ${confirmFriend}?`}
        onConfirm={executeAddFriend}
        onCancel={() => setConfirmFriend(null)}
        confirmText="Send Request"
      />
    </div>
  );
}
