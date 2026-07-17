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
          DEFAULT: "#7C3AED",
          dark: "#6D28D9",
          foreground: "#FFFFFF",
        },
        cg: {
          primary: "#7C3AED",
          primaryDark: "#6D28D9",
          accent: "#A78BFA",
          accentLight: "#DDD6FE",
          accentBlue: "#C4B5FD",
          navy1: "#1a0b2e",
          navy2: "#2d1450",
          dark: "#1a0b2e",
          darker: "#120a1f",
          violet: "#8B7BFF",
          blue: "#6D28D9",
          cyan: "#E9A6F0",
          textSecondary: "#8B95A5",
          textTertiary: "#6B7280",
        },
        secondary: { DEFAULT: "#F4F5F7", foreground: "#0F1419" },
        destructive: { DEFAULT: "#EF4444", foreground: "#FFFFFF" },
        muted: { DEFAULT: "#F8FAFC", foreground: "#6B7280" },
        accent: { DEFAULT: "#F5F3FF", foreground: "#6D28D9" },
        popover: { DEFAULT: "#FFFFFF", foreground: "#0F1419" },
        card: { DEFAULT: "#FFFFFF", foreground: "#0F1419" },
        success: { DEFAULT: "#16A34A", foreground: "#FFFFFF" },
        warning: { DEFAULT: "#F59E0B", foreground: "#FFFFFF" },
      },
      borderRadius: { lg: "8px", md: "6px", sm: "4px", xl: "12px" },
      backgroundImage: {
        "cg-hero": "linear-gradient(160deg, #1a0b2e 0%, #2d1450 20%, #4c1d95 38%, #5b21b6 58%, #4c1d95 78%, #1a0b2e 100%)",
        "cg-cta": "linear-gradient(160deg, #120a1f 0%, #1a0b2e 22%, #2d1450 45%, #3d1a6b 65%, #1a0b2e 85%, #120a1f 100%)",
        "cg-button": "linear-gradient(135deg, #7C3AED, #6D28D9)",
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
