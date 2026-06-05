import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#6F4E37",
          foreground: "#ffffff"
        },
        coffee: {
          DEFAULT: "#6F4E37",
          dark: "#3E2A1F",
          soft: "#F7F3EC"
        },
        eco: {
          DEFAULT: "#2F7D5A",
          soft: "#E8F5EE"
        },
        amber: {
          DEFAULT: "#F4B860",
          foreground: "#3E2A1F"
        },
        secondary: {
          DEFAULT: "#2F7D5A",
          foreground: "#ffffff"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff"
        },
        warning: {
          DEFAULT: "#d97706",
          foreground: "#ffffff"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        soft: "0 14px 35px rgba(62, 42, 31, 0.07)",
        premium: "0 22px 60px rgba(62, 42, 31, 0.12)"
      }
    }
  },
  plugins: [animate]
};

export default config;
