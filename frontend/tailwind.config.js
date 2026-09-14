export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  safelist: [
    "bg-accent-800", "bg-accent-900",
    "text-accent-800", "text-accent-900",
    "border-accent-800", "border-accent-900",
    "hover:bg-accent-800", "hover:bg-accent-900",
  ],
  theme: {
    extend: {
      colors: {
        "accent-900": "rgb(var(--color-accent-900) / <alpha-value>)",
        "accent-800": "rgb(var(--color-accent-800) / <alpha-value>)",
        "accent-700": "rgb(var(--color-accent-700) / <alpha-value>)",
        "accent-500": "rgb(var(--color-accent-500) / <alpha-value>)",
        "accent-300": "rgb(var(--color-accent-300) / <alpha-value>)",
        "accent-200": "rgb(var(--color-accent-200) / <alpha-value>)",
        "accent-100": "rgb(var(--color-accent-100) / <alpha-value>)",
        "parchment-100": "rgb(var(--color-parchment-100) / <alpha-value>)",
        "parchment-050": "rgb(var(--color-parchment-050) / <alpha-value>)",
        "ink": "rgb(var(--color-ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--color-ink-muted) / <alpha-value>)",
        "cream": "rgb(var(--color-cream) / <alpha-value>)",
        "line": "rgb(var(--color-line) / <alpha-value>)",
        "tile-tan": "#D8C9A3",
        "tile-sage": "#8B9468",
        "tile-coral": "#C97B5C",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: { sm: "8px", md: "14px", lg: "18px" },
    },
  },
  plugins: [],
};
