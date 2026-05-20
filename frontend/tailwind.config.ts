import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        sidebar: "hsl(var(--sidebar))",
        input: "hsl(var(--input))",
        hover: "hsl(var(--hover))",
        "message-user": "hsl(var(--message-user))",
        "message-assistant": "hsl(var(--message-assistant))"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0, 0, 0, 0.35)"
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
