import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", name: "", username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/chats", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await register({
        email: form.email,
        name: form.name,
        username: form.username,
        password: form.password,
        confirm_password: form.confirmPassword
      });
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-parchment-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto bg-parchment-050 border border-line rounded-lg p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center mb-2">
          <img src="/logo.svg" alt="Retro Chat Logo" className="w-16 h-16 mb-2" />
          <h1 className="font-display font-bold text-2xl text-center">JOIN RETRO CHAT</h1>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input 
          label="Username" 
          required 
          maxLength={20}
          pattern="^[a-zA-Z0-9._]+$"
          title="Usernames can only contain letters, numbers, dots, and underscores."
          value={form.username} 
          onChange={(e) => setForm({ ...form, username: e.target.value })} 
        />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input 
          label="Password" 
          type="password" 
          required 
          minLength={8} 
          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$"
          title="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
          value={form.password} 
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
        />
        <Input label="Confirm Password" type="password" required minLength={8} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        <Button type="submit">Register</Button>
        <Link to="/login" className="text-sm text-center text-accent-800 hover:underline">Already have an account? Go back to login</Link>
      </form>
    </div>
  );
}
