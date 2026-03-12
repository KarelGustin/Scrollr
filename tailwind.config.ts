import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        surface: "#18181b",
        card: "#27272a",
        border: "rgba(255,255,255,0.08)",
        text: "#fafafa",
        muted: "#71717a",
        accent: "#c8ff00",
        "accent-fg": "#000000",
        destructive: "#ef4444",
      },
      borderRadius: {
        DEFAULT: "12px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Syne", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 300ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
