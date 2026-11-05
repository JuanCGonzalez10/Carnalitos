import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "lime" es el amarillo de la marca (nombre heredado del proyecto base).
        lime: {
          50: "#FFFBEB",
          100: "#FFF3C4",
          200: "#FFE783",
          300: "#FFDA4D",
          400: "#FFCC29",
          500: "#EDB400",
          600: "#C99400",
          700: "#A07400",
          800: "#7A5800",
          900: "#5C4200",
        },
        // Verde de la huella del logo.
        jungle: {
          50: "#E9F9F1",
          100: "#CCF2E0",
          200: "#99E5C3",
          300: "#61D2A2",
          400: "#3AB882",
          500: "#22A06D",
          600: "#178254",
          700: "#126843",
          800: "#0E5236",
          900: "#0A3D28",
          950: "#052A1B",
        },
        sun: {
          DEFAULT: "#FFCC29",
          100: "#FFF3C4",
          200: "#FFE783",
          300: "#FFDA4D",
          400: "#FFCC29",
          500: "#EDB400",
        },
        // Café del contorno del logo.
        ink: {
          DEFAULT: "#3E2F2B",
          950: "#2A1E1A",
          900: "#33241F",
          800: "#3E2F2B",
          700: "#4A3933",
          600: "#5A463F",
          500: "#6E5850",
        },
        cream: {
          DEFAULT: "#FFF9EC",
          50: "#FFFDF7",
          100: "#FFF3DF",
          200: "#F8E8CD",
          300: "#EED9B9",
          400: "#DCC09B",
        },
        muted: "#7B6A61",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Trebuchet MS", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.24em",
      },
      maxWidth: {
        site: "86rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      animation: {
        "fade-up": "fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "ken-burns": "kenBurns 22s ease-in-out infinite alternate",
        marquee: "marquee 32s linear infinite",
        float: "float 5s ease-in-out infinite",
        wag: "wag 2.8s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        kenBurns: {
          "0%": { transform: "scale(1.03) translate3d(0,0,0)" },
          "100%": { transform: "scale(1.12) translate3d(-1.5%, -1%, 0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wag: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
