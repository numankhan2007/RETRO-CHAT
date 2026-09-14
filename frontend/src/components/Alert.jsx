export default function Alert({ type = "error", children }) {
  const styles = {
    error: "bg-tile-coral/20 border-tile-coral",
    success: "bg-accent-800/20 border-accent-800",
  };
  return (
    <div className={`border rounded-md px-3 py-2 text-sm text-ink ${styles[type]}`}>
      {children}
    </div>
  );
}
