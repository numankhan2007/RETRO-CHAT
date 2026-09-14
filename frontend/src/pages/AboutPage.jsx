import { useNavigate } from "react-router-dom";
import Card from "../components/Card";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md md:max-w-3xl mx-auto flex flex-col gap-4 mt-8">
      <div className="flex items-center mb-2 border-b-2 border-accent-900 pb-2">
        <button onClick={() => navigate("/settings")} className="p-2 -ml-2 mr-2 hover:bg-accent-900/10 rounded-full text-accent-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-display font-bold text-2xl flex-1 text-center pr-8">About</h1>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.svg" alt="Retro Chat Logo" className="w-16 h-16 object-contain mb-3" />
          <h2 className="font-display font-bold text-2xl text-ink">Retro Chat</h2>
          <span className="font-mono text-xs text-ink-muted">v1.0.0</span>
        </div>

        <div className="space-y-4 font-mono text-sm text-ink leading-relaxed">
          <p>
            Welcome to Retro Chat! This platform was built to bring back the golden age of messaging—a time before algorithms, read receipts, and infinite scrolling feeds.
          </p>
          <p>
            Our philosophy is simple: chronological posts, pure chronological chat, and a clean interface that respects your time and privacy.
          </p>
          <p>
            There are no algorithms deciding what you see. We do not use engagement hacking, unread counts to induce anxiety, or streaks. 
          </p>
          <p className="text-center font-bold mt-8 text-accent-900">
            Enjoy your stay!
          </p>
        </div>
      </Card>
    </div>
  );
}
