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
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "morph": {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "counter-notification": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "15%": { transform: "translateY(0)", opacity: "1" },
          "85%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-8px)", opacity: "0" },
        },
        "swipe-hint": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.5" },
          "50%": { transform: "translateY(-16px)", opacity: "1" },
        },
        "cursor-move": {
          "0%": { transform: "translate(0, 0)", opacity: "0" },
          "10%": { opacity: "1" },
          "30%": { transform: "translate(60px, 30px)" },
          "50%": { transform: "translate(60px, 30px)" },
          "70%": { transform: "translate(120px, -10px)" },
          "90%": { opacity: "1" },
          "100%": { transform: "translate(120px, -10px)", opacity: "0" },
        },
        "typing": {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "progress-fill": {
          "0%": { width: "0%" },
          "80%": { width: "100%" },
          "100%": { width: "100%" },
        },
        "drop-in": {
          "0%": { transform: "translateY(-20px) scale(0.9)", opacity: "0" },
          "60%": { transform: "translateY(4px) scale(1.02)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "swipe-card": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "40%": { transform: "translateY(-100%)", opacity: "0" },
          "41%": { transform: "translateY(100%)", opacity: "0" },
          "70%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "click-ring": {
          "0%": { transform: "scale(0)", opacity: "0.8" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "counter-tick": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "20%": { transform: "translateY(0)", opacity: "1" },
          "80%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-100%)", opacity: "0" },
        },
        "bar-grow": {
          "0%": { height: "0%" },
          "100%": { height: "var(--bar-height)" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.6)", opacity: "1" },
        },
        "hand-swipe": {
          "0%": { transform: "translateY(40px)", opacity: "0" },
          "15%": { transform: "translateY(0px)", opacity: "1" },
          "45%": { transform: "translateY(-80px)", opacity: "1" },
          "55%": { transform: "translateY(-80px)", opacity: "0" },
          "100%": { transform: "translateY(40px)", opacity: "0" },
        },
      },
      animation: {
        "slide-up": "slide-up 300ms ease-out",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "scale-in": "scale-in 0.6s ease-out forwards",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "morph": "morph 8s ease-in-out infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "counter-notification": "counter-notification 3s ease-in-out forwards",
        "swipe-hint": "swipe-hint 2s ease-in-out infinite",
        "cursor-move": "cursor-move 4s ease-in-out infinite",
        "typing": "typing 2s steps(20, end) infinite alternate",
        "blink": "blink 1s step-end infinite",
        "progress-fill": "progress-fill 3s ease-in-out infinite",
        "drop-in": "drop-in 0.6s ease-out forwards",
        "swipe-card": "swipe-card 4s ease-in-out infinite",
        "click-ring": "click-ring 0.6s ease-out forwards",
        "counter-tick": "counter-tick 3s ease-in-out infinite",
        "bar-grow": "bar-grow 1.5s ease-out forwards",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "hand-swipe": "hand-swipe 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
