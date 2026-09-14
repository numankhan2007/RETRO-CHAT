import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateTheme } from "../services/themeService";
import Button from "../components/Button";

const ACCENT_OPTIONS = ["default", "coral", "sage", "ocean", "sunset", "lavender", "cherry"];
const FONT_OPTIONS = ["default", "mono", "serif", "sans", "cursive", "pixel"];

export default function AppearanceSettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [accent, setAccent] = useState(user?.accent_color || "default");
  const [font, setFont] = useState(user?.font_choice || "default");
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', accent);
    document.documentElement.setAttribute('data-font', font);
    
    return () => {
      document.documentElement.setAttribute('data-theme', user?.accent_color || 'default');
      document.documentElement.setAttribute('data-font', user?.font_choice || 'default');
    };
  }, [accent, font, user]);

  const handleSave = async () => {
    setMessage("");
    try {
      const res = await updateTheme({ accent_color: accent, font_choice: font });
      setUser(res.data);
      setMessage("Appearance settings saved successfully.");
    } catch (err) {
      console.error("Failed to save settings", err);
      setMessage(err.response?.data?.detail || "Failed to save settings. Please try again.");
    }
  };

  return (
    <div className="max-w-md md:max-w-3xl mx-auto flex flex-col gap-4 mt-8">
      <div className="flex items-center mb-2 border-b-2 border-accent-900 pb-2">
        <button onClick={() => navigate("/settings")} className="p-2 -ml-2 mr-2 hover:bg-accent-900/10 rounded-full text-accent-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-display font-bold text-2xl flex-1 text-center pr-8">Appearance</h1>
      </div>

      {message && <div className="text-center text-sm font-bold text-accent-800 bg-accent-900/10 p-2 rounded">{message}</div>}

      <div>
        <label className="text-xs font-bold text-ink-muted">Accent Color</label>
        <select value={accent} onChange={(e) => setAccent(e.target.value)} className="block mt-1 px-3 py-2 rounded-md bg-parchment-050 border border-line text-sm font-mono w-full">
          {ACCENT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-ink-muted">Font</label>
        <select value={font} onChange={(e) => setFont(e.target.value)} className="block mt-1 px-3 py-2 rounded-md bg-parchment-050 border border-line text-sm font-mono w-full">
          {FONT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <Button onClick={handleSave} className="mt-4">Save Changes</Button>
    </div>
  );
}
