import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"] },
      colors: {
        bg: "#0a0a0a", fg: "#fafafa", muted: "#737373", line: "#262626",
        card: "#171717", accent: "#22c55e", warn: "#eab308", bad: "#ef4444",
      },
    },
  },
  plugins: [],
};
export default config;
