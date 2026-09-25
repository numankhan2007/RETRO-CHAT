import { useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import Button from "../components/Button";

export default function LandingPage() {
  const navigate = useNavigate();
  
  if (localStorage.getItem("token")) {
    return <Navigate to="/chats" replace />;
  }
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-parchment-100 px-4">
      <div className="max-w-2xl w-full mx-auto text-center flex flex-col items-center gap-6">
        <img src="/logo.svg" alt="Retro Chat Logo" className="w-32 h-32" />
        
        <div className="space-y-4 flex flex-col items-center">
          <h1 className="font-display font-black text-6xl tracking-tight text-ink drop-shadow-sm">
            RETRO CHAT
          </h1>
          <p className="font-mono text-lg text-ink-muted max-w-md mx-auto">
            Connect with friends, share your thoughts, and experience the nostalgic vibes of the web.
          </p>
        </div>
        
        <div className="pt-2">
          <Link to="/login">
            <Button className="px-8 py-3 text-lg">
              Start Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
