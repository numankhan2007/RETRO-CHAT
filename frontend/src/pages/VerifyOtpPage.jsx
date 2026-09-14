import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp, resendOtp } from "../services/authService";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function VerifyOtpPage() {
  const { state } = useLocation();
  const [email] = useState(state?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState(""); // "", "sending", "sent"
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await verifyOtp({ email, otp });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid code");
    }
  };

  const handleResend = async () => {
    setError("");
    setResendStatus("sending");
    try {
      await resendOtp({ email });
      setResendStatus("sent");
      setOtp("");
      setTimeout(() => setResendStatus(""), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend code");
      setResendStatus("");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-parchment-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto bg-parchment-050 border border-line rounded-lg p-6 flex flex-col gap-4">
        <h1 className="font-display font-bold text-2xl text-center mb-2">Check Your Email</h1>
        <p className="text-sm text-ink-muted text-center">Enter the 6-digit code sent to {email}</p>
        {error && <Alert type="error">{error}</Alert>}
        {resendStatus === "sent" && <Alert type="success">A new code has been sent to your email.</Alert>}
        <Input label="Verification Code" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
        <Button type="submit">Verify</Button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendStatus === "sending"}
          className="text-sm text-ink-muted hover:text-ink underline bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendStatus === "sending" ? "Sending…" : "Didn't get a code? Resend"}
        </button>
      </form>
    </div>
  );
}
