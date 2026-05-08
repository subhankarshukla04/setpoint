import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Dark base
        bg: "#0E0E0C",
        fg: "#F2F0EA",
        muted: "#7A7872",
        steel: "#A8A8A4",

        // Surfaces
        card: "#15140F",
        card2: "#100F0C",
        line: "#1F1D17",
        line2: "#2A2820",

        // Brand signal (kept old token names as aliases so refs don't break)
        mark: "#D9FF00",      // acid yellow — the loud one (was: accent)
        accent: "#D9FF00",
        flag: "#FF3B1F",      // alarm red (was: bad)
        bad: "#FF3B1F",
        caution: "#F5B100",   // amber (was: warn)
        warn: "#F5B100",
        paper: "#F2F0EA",
        ink: "#0E0E0C",
      },
      letterSpacing: {
        tightish: "-0.01em",
        tighter2: "-0.02em",
        tighter3: "-0.035em",
        industrial: "0.14em",
        wide2: "0.22em",
      },
      keyframes: {
        bootstamp: {
          "0%":   { opacity: "0", transform: "translateY(8px) scale(0.985)" },
          "10%":  { opacity: "1", transform: "translateY(0) scale(1)" },
          "85%":  { opacity: "1" },
          "100%": { opacity: "0" },
        },
        receiptIn: {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "8%":   { opacity: "1", transform: "translateY(0)" },
          "92%":  { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-4px)" },
        },
        markPulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
      },
      animation: {
        bootstamp: "bootstamp 1500ms ease-out forwards",
        receipt:   "receiptIn 2200ms ease-out forwards",
        pulse2:    "markPulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
