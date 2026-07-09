import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          foreground: "#FFFFFF",
        },
        cg: {
          primary: "#2563EB",
          primaryDark: "#1D4ED8",
          accent: "#5B9CFF",
          accentLight: "#93C5FD",
          accentBlue: "#7EB8E0",
          navy1: "#070B1F",
          navy2: "#0F1A45",
          dark: "#0F1419",
          darker: "#0A0E13",
          violet: "#8B7BFF",
          blue: "#1E3AE0",
          cyan: "#34E2E2",
          textSecondary: "#8B95A5",
          textTertiary: "#6B7280",
        },
        secondary: { DEFAULT: "#F4F5F7", foreground: "#0F1419" },
        destructive: { DEFAULT: "#EF4444", foreground: "#FFFFFF" },
        muted: { DEFAULT: "#F8FAFC", foreground: "#6B7280" },
        accent: { DEFAULT: "#EFF6FF", foreground: "#1D4ED8" },
        popover: { DEFAULT: "#FFFFFF", foreground: "#0F1419" },
        card: { DEFAULT: "#FFFFFF", foreground: "#0F1419" },
        success: { DEFAULT: "#16A34A", foreground: "#FFFFFF" },
        warning: { DEFAULT: "#F59E0B", foreground: "#FFFFFF" },
      },
      borderRadius: { lg: "8px", md: "6px", sm: "4px", xl: "12px" },
      backgroundImage: {
        "cg-hero": "linear-gradient(160deg, #0b1d4a 0%, #13306f 20%, #1E3A5F 38%, #2450a8 58%, #1E3A8A 78%, #0b1d4a 100%)",
        "cg-cta": "linear-gradient(160deg, #050d22 0%, #0b1d4a 22%, #13306f 45%, #1a2a6b 65%, #0b1d4a 85%, #050d22 100%)",
        "cg-button": "linear-gradient(135deg, #2563EB, #1D4ED8)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-1000px 0" }, "100%": { backgroundPosition: "1000px 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
