export default function Skeleton({ className = "", variant = "rect" }) {
  const base = "skeleton-shimmer";
  const variants = {
    rect: "rounded-md",
    circle: "rounded-full",
    text: "rounded h-4 w-full",
  };
  return <div className={`${base} ${variants[variant]} ${className}`}></div>;
}
