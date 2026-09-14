export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "px-4 py-2 rounded-md font-mono font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-accent-900 text-cream hover:bg-accent-800",
    secondary: "bg-transparent border border-accent-900 text-accent-900 hover:bg-parchment-050",
    ghost: "bg-transparent text-accent-800 hover:underline",
    danger: "bg-red-700 text-cream hover:bg-red-800",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
