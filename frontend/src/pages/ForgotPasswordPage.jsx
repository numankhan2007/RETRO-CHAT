import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword({ identifier });
      navigate("/verify-reset-otp", { state: { identifier } });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-parchment-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto bg-parchment-050 border border-line rounded-lg p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center mb-2">
          <img src="/logo.svg" alt="Retro Chat Logo" className="w-16 h-16 mb-2" />
          <h1 className="font-display font-bold text-2xl text-center">RECOVER ACCOUNT</h1>
        </div>
        <p className="text-sm text-ink-muted text-center">Enter your email or username and we will send you an OTP to reset your password.</p>
        
        {error && <Alert type="error">{error}</Alert>}
        
        <Input 
          label="Email or Username" 
          required 
          value={identifier} 
          onChange={(e) => setIdentifier(e.target.value)} 
        />
        
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Code"}
        </Button>
        
        <Link to="/login" className="text-sm text-center text-accent-800 hover:underline mt-2">
          Remembered your password? Log in
        </Link>
      </form>
    </div>
  );
}
