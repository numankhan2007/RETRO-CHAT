import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getMe } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function LoginPage() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/chats", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(form);
      localStorage.setItem("token", res.data.access_token);
      const me = await getMe();
      loginUser(res.data.access_token, me.data);
      navigate("/chats");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-parchment-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto bg-parchment-050 border border-line rounded-lg p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center mb-2">
          <img src="/logo.svg" alt="Retro Chat Logo" className="w-16 h-16 mb-2" />
          <h1 className="font-display font-bold text-2xl text-center">RETRO CHAT</h1>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <Input label="Email or Username" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
        <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit">Log In</Button>
        <div className="flex flex-col gap-2 mt-2">
          <Link to="/forgot-password" className="text-sm text-center text-ink-muted hover:text-accent-800 hover:underline">Forgot your password?</Link>
          <Link to="/register" className="text-sm text-center text-accent-800 hover:underline">New here? Create an account</Link>
        </div>
      </form>
    </div>
  );
}
