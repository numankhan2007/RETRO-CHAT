import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp, resendOtp } from "../services/authService";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

const EMAIL_STORAGE_KEY = "retrochat_verification_email";

export default function VerifyOtpPage() {
  const { state } = useLocation();
  const [email] = useState(() => {
    const stateEmail = state?.email?.trim();
    if (stateEmail) return stateEmail;
    try { return sessionStorage.getItem(EMAIL_STORAGE_KEY) || ""; } catch { return ""; }
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) return;
    try { sessionStorage.setItem(EMAIL_STORAGE_KEY, email); } catch { /* storage may be unavailable */ }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Your email address is missing. Please return to registration and try again.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit verification code.");
      return;
    }
    try {
      await verifyOtp({ email, otp });
      try { sessionStorage.removeItem(EMAIL_STORAGE_KEY); } catch { /* ignore */ }
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed. Please try again.");
    }
  };

  const handleResend = async () => {
    setError("");
    if (!email) {
      setError("Your email address is missing. Please return to registration and try again.");
      return;
    }
    setResendStatus("sending");
    try {
      await resendOtp({ email });
      setResendStatus("sent");
      setOtp("");
      setTimeout(() => setResendStatus(""), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend code. Please try again.");
      setResendStatus("");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-parchment-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto bg-parchment-050 border border-line rounded-lg p-6 flex flex-col gap-4">
        <h1 className="font-display font-bold text-2xl text-center mb-2">Check Your Email</h1>
        <p className="text-sm text-ink-muted text-center">Enter the 6-digit code sent to {email || "your registered email"}</p>
        {error && <Alert type="error">{error}</Alert>}
        {resendStatus === "sent" && <Alert type="success">A new code has been sent to your email.</Alert>}
        <Input label="Verification Code" required maxLength={6} inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        <Button type="submit" disabled={!email || otp.length !== 6}>Verify</Button>
        <button type="button" onClick={handleResend} disabled={!email || resendStatus === "sending"} className="text-sm text-ink-muted hover:text-ink underline bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          {resendStatus === "sending" ? "Sending…" : "Didn't get a code? Resend"}
        </button>
      </form>
    </div>
  );
}
