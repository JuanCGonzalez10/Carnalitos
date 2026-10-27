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
        lime: {
          50: "#F7FFE0",
          100: "#EEFFB8",
          200: "#E2FF85",
          300: "#D6FF4D",
          400: "#C8F000",
          500: "#B7E400",
          600: "#98C000",
          700: "#6F8F00",
          800: "#4A5F00",
        },
        jungle: {
          50: "#EAF7F0",
          100: "#CDEEDD",
          200: "#9DDBBD",
          300: "#65C297",
          400: "#2F9F72",
          500: "#147A4D",
          600: "#0B5D3B",
          700: "#08482E",
          800: "#063A25",
          900: "#042A1B",
          950: "#02160E",
        },
        sun: {
          DEFAULT: "#F5D000",
          100: "#FFF8C2",
          200: "#FFEE7A",
          300: "#FCE23A",
          400: "#F5D000",
          500: "#D9B400",
        },
        ink: {
          DEFAULT: "#0A0A0A",
          950: "#070707",
          900: "#0A0A0A",
          800: "#121212",
          700: "#1B1B1B",
          600: "#262626",
          500: "#3A3A3A",
        },
        cream: {
          DEFAULT: "#F5F2E9",
          50: "#FCFBF7",
          100: "#F8F6EE",
          200: "#EFEBDD",
          300: "#E1DCCB",
          400: "#C9C3B1",
        },
        muted: "#77776D",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.24em",
      },
      maxWidth: {
        site: "86rem",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      animation: {
        "fade-up": "fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "ken-burns": "kenBurns 22s ease-in-out infinite alternate",
        marquee: "marquee 32s linear infinite",
        float: "float 5s ease-in-out infinite",
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
      },
    },
  },
  plugins: [],
};
export default config;
