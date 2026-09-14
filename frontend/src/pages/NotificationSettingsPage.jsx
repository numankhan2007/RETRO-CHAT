import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem("retro_chat_sound_enabled") !== "false"
  );
  
  const [alertsEnabled, setAlertsEnabled] = useState(
    localStorage.getItem("retro_chat_alerts_enabled") === "true"
  );

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem("retro_chat_sound_enabled", newState);
    
    // Play a preview sound if turned on
    if (newState) {
      const audio = new Audio("/notification.mp3"); // Ensure this file exists in public/ or handle gracefully if not
      audio.play().catch(() => {});
    }
  };

  const toggleAlerts = async () => {
    if (!alertsEnabled) {
      // Request permission
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return;
      }
      
      if (Notification.permission === "granted") {
        setAlertsEnabled(true);
        localStorage.setItem("retro_chat_alerts_enabled", "true");
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setAlertsEnabled(true);
          localStorage.setItem("retro_chat_alerts_enabled", "true");
        }
      } else {
        alert("You have blocked notifications in your browser settings. Please enable them to use this feature.");
      }
    } else {
      setAlertsEnabled(false);
      localStorage.setItem("retro_chat_alerts_enabled", "false");
    }
  };

  return (
    <div className="max-w-md md:max-w-3xl mx-auto flex flex-col gap-4 mt-8">
      <div className="flex items-center mb-2 border-b-2 border-accent-900 pb-2">
        <button onClick={() => navigate("/settings")} className="p-2 -ml-2 mr-2 hover:bg-accent-900/10 rounded-full text-accent-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-display font-bold text-2xl flex-1 text-center pr-8">Notifications</h1>
      </div>

      <Card className="p-6 flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-center mb-2 gap-4">
            <div>
              <h3 className="font-bold text-ink">In-App Sounds</h3>
              <p className="text-xs font-mono text-ink-muted">Play a "ding" when a new message arrives.</p>
            </div>
            <button 
              onClick={toggleSound}
              className={`flex-shrink-0 w-12 h-6 rounded-full relative transition-colors ${soundEnabled ? 'bg-accent-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${soundEnabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
            </button>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-accent-900/20 pt-4">
          <div className="flex justify-between items-center mb-2 gap-4">
            <div>
              <h3 className="font-bold text-ink">Desktop Alerts</h3>
              <p className="text-xs font-mono text-ink-muted">Show a browser popup when you receive a message while the app is in the background.</p>
            </div>
            <button 
              onClick={toggleAlerts}
              className={`flex-shrink-0 w-12 h-6 rounded-full relative transition-colors ${alertsEnabled ? 'bg-accent-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${alertsEnabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
            </button>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-accent-900/10 rounded-md border border-accent-900/30">
          <p className="text-xs font-mono text-accent-900 text-center">
            Note: As Retro Chat is a web application, notifications will only be received when the app is open in a browser tab. Mobile background push notifications are not currently supported.
          </p>
        </div>
      </Card>
    </div>
  );
}
