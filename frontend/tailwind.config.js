/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#00FF94",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#00E5FF",
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#FF003C",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#1A1A1A",
          foreground: "#808080",
        },
        accent: {
          DEFAULT: "#D000FF",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        cyber: {
          black: "#030303",
          surface: "#0A0A0A",
          green: "#00FF94",
          cyan: "#00E5FF",
          purple: "#D000FF",
          red: "#FF003C",
          orange: "#FFA500",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        display: ["Rajdhani", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 255, 148, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 255, 148, 0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulse: "pulse 2s infinite",
        glow: "glow 2s infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
