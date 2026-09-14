const TILE_STYLES = ["bg-tile-tan", "bg-tile-sage", "bg-tile-coral"];

function styleForUsername(username = "?") {
  return TILE_STYLES[username.charCodeAt(0) % TILE_STYLES.length];
}

export default function Avatar({ username, avatarUrl, url, size = "md", isGroup = false }) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-10 h-10 text-sm", lg: "w-24 h-24 text-3xl" };
  const actualUrl = url || avatarUrl;
  
  if (actualUrl) {
    return (
      <img
        src={actualUrl}
        alt={`${username}'s avatar`}
        loading="lazy"
        className={`${sizes[size]} rounded-md object-cover flex-shrink-0 bg-paper-300 border-2 border-line/10`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${styleForUsername(username)} rounded-md flex items-center
        justify-center font-display font-bold text-accent-900 flex-shrink-0`}
    >
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
