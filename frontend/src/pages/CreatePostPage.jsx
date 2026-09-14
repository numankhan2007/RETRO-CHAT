import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../services/blogService";
import Input from "../components/Input";
import Button from "../components/Button";
import FormatToolbar from "../components/FormatToolbar";
import EmojiPicker from "../components/EmojiPicker";

export default function CreatePostPage() {
  const [form, setForm] = useState({ title: "", content: "", visibility: "friends" });
  const navigate = useNavigate();
  const textAreaRef = useRef(null);

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    try {
      const res = await createPost({ ...form, status });
      navigate(`/blog/${res.data.id}`);
    } catch (err) {
      console.error("Failed to create post", err);
      alert(err.response?.data?.detail || "Failed to create post. Please try again.");
    }
  };

  return (
    <form className="flex flex-col gap-4 max-w-2xl">
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
        <Button variant="secondary" type="button" onClick={(e) => handleSubmit(e, "draft")}>Save Draft</Button>
        <Button type="button" onClick={(e) => handleSubmit(e, "published")}>Publish</Button>
      </div>
    </form>
  );
}
