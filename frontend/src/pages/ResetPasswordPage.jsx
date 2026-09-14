import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { resetPassword } from "../services/authService";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier;
  const otp = location.state?.otp;

  useEffect(() => {
    if (!identifier || !otp) {
      navigate("/forgot-password");
    }
  }, [identifier, otp, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      await resetPassword({
        identifier: identifier,
        otp: otp,
        new_password: form.newPassword,
        confirm_password: form.confirmPassword
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-100 px-4">
        <div className="w-full max-w-sm bg-parchment-050 border border-line rounded-lg p-6 flex flex-col gap-4 text-center">
          <div className="text-4xl mb-2">✨</div>
          <h1 className="font-display font-bold text-2xl text-accent-800">Password Reset</h1>
          <p className="text-sm text-ink-muted">Your password has been successfully reset.</p>
          <p className="text-xs text-ink-muted mt-2">Redirecting to login...</p>
          <Link to="/login">
            <Button className="mt-4 w-full">Go to Login Now</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-parchment-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto bg-parchment-050 border border-line rounded-lg p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center mb-2">
          <img src="/logo.svg" alt="Retro Chat Logo" className="w-16 h-16 mb-2" />
          <h1 className="font-display font-bold text-2xl text-center">CREATE NEW PASSWORD</h1>
        </div>
        <p className="text-sm text-ink-muted text-center">Please choose a new strong password.</p>
        
        {error && <Alert type="error">{error}</Alert>}
        
        <Input 
          label="New Password" 
          type="password" 
          required 
          minLength={8}
          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$"
          title="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
          value={form.newPassword} 
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })} 
        />
        <Input 
          label="Confirm New Password" 
          type="password" 
          required 
          minLength={8}
          value={form.confirmPassword} 
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} 
        />
        
        <Button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}
