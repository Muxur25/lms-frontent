/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border-1)",
        input: "var(--border-2)",
        ring: "var(--blue-500)",
        background: "var(--bg-1)",
        foreground: "var(--text-primary)",
        primary: {
          DEFAULT: "var(--blue-600)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--red-500)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--surface-1)",
          foreground: "var(--text-secondary)",
        },
        accent: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--bg-2)",
          foreground: "var(--text-primary)",
        },
        card: {
          DEFAULT: "var(--bg-2)",
          foreground: "var(--text-primary)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
    },
  },
  plugins: [],
}
