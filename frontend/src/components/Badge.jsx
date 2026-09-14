export default function Badge({ children, className = "" }) {
  return (
    <span className={`px-2 py-0.5 rounded-full bg-tile-sage/30 text-accent-900
      text-[10px] font-bold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}
