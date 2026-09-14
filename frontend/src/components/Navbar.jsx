import { NavLink } from "react-router-dom";

import NotificationBell from "./NotificationBell";

const links = [
  { to: "/chats", label: "Chats" },
  { to: "/blog", label: "Blog" },
  { to: "/friends", label: "Friends" },
  { to: "/profile", label: "Profile" },
];

export default function Navbar() {
  return (
    <nav className="bg-accent-900 text-cream md:px-8 md:py-4 p-3 flex items-center justify-between fixed bottom-0 left-0 right-0 z-50 md:sticky md:top-0 border-t border-accent-800 md:border-none shadow-md">
      <div className="hidden md:flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
        <img src="/logo.svg" alt="Retro Chat Logo" className="w-10 h-10 object-contain" />
        <span className="font-display font-bold text-2xl tracking-wide">RETRO CHAT</span>
      </div>
      <div className="flex items-center w-full md:w-auto md:gap-12 justify-around md:justify-end">
        <div className="flex items-center gap-6 md:gap-8 justify-around w-full md:w-auto">
          <div className="hidden md:block">
            <NotificationBell />
          </div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `font-mono text-sm md:text-base transition-colors ${isActive ? "text-cream font-bold underline decoration-2 underline-offset-4" : "text-cream/70 hover:text-cream"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
