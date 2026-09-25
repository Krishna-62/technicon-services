/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'system-ui', 'sans-serif'],
      },
      screens: {
        'desktop-xl': '1440px',
        'desktop-lg': '1180px',
        'tablet-lg': '860px',
        'mobile-sm': '390px',
      },
      colors: {
        border: "var(--border, #292E2A)",
        input: "var(--input, #292E2A)",
        ring: "var(--ring, #B8F23A)",
        background: "var(--background, #101312)",
        foreground: "var(--foreground, #F5F7F4)",
        tc: {
          bg: "#101312",
          sidebar: "#0B0D0D",
          card: "#171918",
          surface: "#1D211E",
          border: "#292E2A",
          text: "#F5F7F4",
          secondary: "#A5AEA8",
          muted: "#6D756F",
          accent: "#B8F23A",
          accentMuted: "#708D31",
          accentLight: "#D8F98D",
          warning: "#D9A441",
          danger: "#E25757",
          info: "#7E95FF",
        },
        primary: {
          DEFAULT: "#B8F23A",
          foreground: "#101312",
        },
        secondary: {
          DEFAULT: "#1D211E",
          foreground: "#F5F7F4",
        },
        destructive: {
          DEFAULT: "#E25757",
          foreground: "#F5F7F4",
        },
        muted: {
          DEFAULT: "#1D211E",
          foreground: "#A5AEA8",
        },
        accent: {
          DEFAULT: "#B8F23A",
          foreground: "#101312",
        },
        popover: {
          DEFAULT: "#1D211E",
          foreground: "#F5F7F4",
        },
        card: {
          DEFAULT: "#171918",
          foreground: "#F5F7F4",
        },
        sidebar: {
          DEFAULT: "#0B0D0D",
          foreground: "#F5F7F4",
          primary: "#B8F23A",
          "primary-foreground": "#101312",
          accent: "#1D211E",
          "accent-foreground": "#F5F7F4",
          border: "#292E2A",
          ring: "#B8F23A",
        },
      },
      borderRadius: {
        lg: "16px",
        md: "10px",
        sm: "8px",
      },
    },
  },
  plugins: [],
}
