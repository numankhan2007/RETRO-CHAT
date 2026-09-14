export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-parchment-050 border border-line rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}
