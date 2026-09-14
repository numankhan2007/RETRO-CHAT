import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyResetOtp } from "../services/authService";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function VerifyResetOtpPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier;

  useEffect(() => {
    if (!identifier) {
      navigate("/forgot-password");
    }
  }, [identifier, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await verifyResetOtp({ identifier, otp });
      navigate("/reset-password", { state: { identifier, otp } });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-parchment-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto bg-parchment-050 border border-line rounded-lg p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center mb-2">
          <img src="/logo.svg" alt="Retro Chat Logo" className="w-16 h-16 mb-2" />
          <h1 className="font-display font-bold text-2xl text-center">VERIFY OTP</h1>
        </div>
        <p className="text-sm text-ink-muted text-center">Enter the 6-digit code sent to your email to verify your identity.</p>
        
        {error && <Alert type="error">{error}</Alert>}
        
        <Input 
          label="6-Digit OTP Code" 
          required 
          maxLength={6}
          value={otp} 
          onChange={(e) => setOtp(e.target.value)} 
        />
        
        <Button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify Code"}
        </Button>
        
        <Link to="/login" className="text-sm text-center text-accent-800 hover:underline mt-2">
          Cancel and go back to login
        </Link>
      </form>
    </div>
  );
}
