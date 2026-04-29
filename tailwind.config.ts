import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F19",
        surface: "#121826",
        primary: "#4F46E5",
        "primary-hover": "#6366F1",
        accent: "#22D3EE",
        text: "#FFFFFF",
        "text-secondary": "#9CA3AF",
        border: "#1F2937",
        success: "#22C55E",
        error: "#EF4444",
        disabled: "#374151",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(99,102,241,0.5)",
      },
    },
  },
  plugins: [],
} satisfies Config;
