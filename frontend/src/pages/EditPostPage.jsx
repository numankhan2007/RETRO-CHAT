import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPost, updatePost } from "../services/blogService";
import Input from "../components/Input";
import Button from "../components/Button";
import FormatToolbar from "../components/FormatToolbar";
import EmojiPicker from "../components/EmojiPicker";

export default function EditPostPage() {
  const { postId } = useParams();
  const [form, setForm] = useState({ title: "", content: "", visibility: "friends" });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const textAreaRef = useRef(null);

  useEffect(() => {
    getPost(postId).then(res => {
      setForm({ title: res.data.title, content: res.data.content, visibility: res.data.visibility });
      setIsLoading(false);
    }).catch(() => {
      navigate("/blog");
    });
  }, [postId, navigate]);

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    try {
      await updatePost(postId, { ...form, status });
      navigate(`/blog/${postId}`);
    } catch (err) {
      console.error("Failed to update post", err);
      alert(err.response?.data?.detail || "Failed to update post. Please try again.");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-bold text-2xl mb-4 border-b-2 border-accent-900 pb-2">Edit Post</h1>
      <form className="flex flex-col gap-4">
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-ink-muted">Content</label>
          <div className="flex items-center justify-between mb-1">
            <FormatToolbar textAreaRef={textAreaRef} value={form.content} onChange={(v) => setForm({ ...form, content: v })} />
            <EmojiPicker textAreaRef={textAreaRef} value={form.content} onChange={(v) => setForm({ ...form, content: v })} />
          </div>
          <textarea ref={textAreaRef} rows={10} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="px-3 py-2 rounded-md bg-parchment-050 border border-line text-sm font-mono focus:outline-none focus:border-accent-800" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-ink-muted">Visibility</label>
          <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            className="px-3 py-2 rounded-md bg-parchment-050 border border-line text-sm font-mono">
            <option value="public">Public</option>
            <option value="friends">Friends only</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate("/blog")}>Cancel</Button>
          <Button variant="secondary" type="button" onClick={(e) => handleSubmit(e, "draft")}>Save as Draft</Button>
          <Button type="button" onClick={(e) => handleSubmit(e, "published")}>Publish Updates</Button>
        </div>
      </form>
    </div>
  );
}
