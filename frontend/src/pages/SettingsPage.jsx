import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateTheme } from "../services/themeService";
import Button from "../components/Button";

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md md:max-w-3xl mx-auto flex flex-col gap-4 mt-8 pb-12">
      <div className="flex items-center mb-2 border-b-2 border-accent-900 pb-2">
        <button onClick={() => navigate("/profile")} className="p-2 -ml-2 mr-2 hover:bg-accent-900/10 rounded-full text-accent-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-display font-bold text-2xl flex-1 text-center pr-8">Settings</h1>
      </div>

      {/* APPEARANCE */}
      <div>
        <label className="text-xs font-bold text-ink-muted">Appearance</label>
        <div className="mt-1 flex items-center justify-between p-3 bg-parchment-050 border border-line rounded-md">
          <span className="text-sm font-mono text-ink">Theme & Display</span>
          <Link to="/settings/appearance">
            <Button variant="secondary" size="sm">Manage</Button>
          </Link>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="mt-2">
        <label className="text-xs font-bold text-ink-muted">Notifications</label>
        <div className="mt-1 flex items-center justify-between p-3 bg-parchment-050 border border-line rounded-md">
          <span className="text-sm font-mono text-ink">Sounds & Alerts</span>
          <Link to="/settings/notifications">
            <Button variant="secondary" size="sm">Manage</Button>
          </Link>
        </div>
      </div>

      {/* PRIVACY */}
      <div className="mt-2">
        <label className="text-xs font-bold text-ink-muted">Privacy</label>
        <div className="mt-1 flex items-center justify-between p-3 bg-parchment-050 border border-line rounded-md">
          <span className="text-sm font-mono text-ink">Blocked Users</span>
          <Link to="/settings/blocked">
            <Button variant="secondary" size="sm">Manage</Button>
          </Link>
        </div>
      </div>

      {/* SUPPORT & ABOUT */}
      <div className="mt-2">
        <label className="text-xs font-bold text-ink-muted">Support & About</label>
        <div className="mt-1 flex flex-col bg-parchment-050 border border-line rounded-md divide-y divide-line">
          <div className="flex items-center justify-between p-3">
            <span className="text-sm font-mono text-ink">Help & Support</span>
            <Link to="/settings/help"><Button variant="secondary" size="sm">View</Button></Link>
          </div>
          <div className="flex items-center justify-between p-3">
            <span className="text-sm font-mono text-ink">About</span>
            <Link to="/settings/about"><Button variant="secondary" size="sm">View</Button></Link>
          </div>
          <div className="flex items-center justify-between p-3">
            <span className="text-sm font-mono text-ink">Terms & Policy</span>
            <Link to="/settings/terms"><Button variant="secondary" size="sm">View</Button></Link>
          </div>
        </div>
      </div>

      {/* ACCOUNT */}
      <div className="mt-2">
        <label className="text-xs font-bold text-ink-muted">Account</label>
        <div className="mt-1 flex items-center justify-between p-3 bg-parchment-050 border border-line rounded-md">
          <span className="text-sm font-mono text-ink">Account Management</span>
          <Link to="/settings/account">
            <Button variant="secondary" size="sm">Manage</Button>
          </Link>
        </div>
      </div>

      {/* APP VERSION & UPDATE */}
      <div className="mt-6 flex flex-col items-center justify-center gap-2">
        <button 
          onClick={() => window.location.reload(true)} 
          className="text-xs font-bold text-accent-700 hover:text-accent-900 bg-accent-900/10 px-4 py-2 rounded-full transition-colors"
        >
          Check for Updates
        </button>
        <span className="font-mono text-xs text-ink-muted mt-2">Retro Chat v1.0.0</span>
      </div>

    </div>
  );
}
