import { useState } from "react";

export default function Input({ label, error, type, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1 w-full relative">
      {label && <label className="text-xs font-bold text-ink-muted">{label}</label>}
      <div className="relative flex w-full">
        <input
          type={currentType}
          className={`px-3 py-2 w-full rounded-md bg-parchment-050 border font-mono text-sm text-ink
            focus:outline-none focus:border-accent-800
            ${error ? "border-tile-coral" : "border-line"}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-accent-800 hover:text-accent-900"
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-tile-coral">{error}</span>}
    </div>
  );
}
