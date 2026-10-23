/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#101615", // Deep Obsidian
        obsidian: {
          DEFAULT: "#101615",
          deep: "#0B0F0E",
          surface: "#141C1A",
          raised: "#182321",
          hover: "#1E2C2A",
          border: "#233330",
        },
        teal: {
          DEFAULT: "#082F32",
          deep: "#052022",
          subtle: "#0D3C40",
          light: "#124D52",
        },
        ivory: {
          DEFAULT: "#F0EEE5",
          pure: "#FAF8F2",
          muted: "#E5E2D6",
          dark: "#D4D0C2",
        },
        gold: {
          DEFAULT: "#B69A62",
          muted: "#967E4D",
          light: "#CCAE75",
          subtle: "rgba(182, 154, 98, 0.15)",
        },
        sage: {
          DEFAULT: "#A7B6A2",
          muted: "#8C9D87",
          light: "#C0CDC0",
          subtle: "rgba(167, 182, 162, 0.15)",
        },
        slate: {
          DEFAULT: "#89928D",
          muted: "#6F7873",
          light: "#A2ABA6",
        },
        surface: "#141C1A",
        "surface-raised": "#182321",
        "surface-hover": "#1E2C2A",
        "surface-ivory": "#F0EEE5",
        "surface-teal": "#082F32",
        border: "#233330",
        "border-subtle": "rgba(240, 238, 229, 0.08)",
        "border-gold": "rgba(182, 154, 98, 0.25)",
        "border-teal": "rgba(8, 47, 50, 0.6)",
        brand: {
          teal: "#082F32",
          obsidian: "#101615",
          ivory: "#F0EEE5",
          gold: "#B69A62",
          sage: "#A7B6A2",
          slate: "#89928D",
          // Aliases for compatibility
          violet: "#082F32",
          "violet-hover": "#0D4246",
          "violet-muted": "rgba(8, 47, 50, 0.25)",
          blue: "#A7B6A2",
          "blue-muted": "rgba(167, 182, 162, 0.15)",
          emerald: "#A7B6A2",
          "emerald-muted": "rgba(167, 182, 162, 0.15)",
          amber: "#B69A62",
          "amber-muted": "rgba(182, 154, 98, 0.15)",
          rose: "#9E5A5A",
          "rose-muted": "rgba(158, 90, 90, 0.15)",
        },
        text: {
          primary: "#F0EEE5", // Warm Ivory
          secondary: "#89928D", // Slate Gray
          tertiary: "#6E7772",
          muted: "#525A56",
          dark: "#101615",
          teal: "#082F32",
        },
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Manrope", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        heading: ["Manrope", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.4)",
        card: "0 8px 30px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(182, 154, 98, 0.08)",
        luxury: "0 20px 40px -15px rgba(8, 47, 50, 0.35), 0 0 0 1px rgba(182, 154, 98, 0.18)",
        gold: "0 0 25px -4px rgba(182, 154, 98, 0.2)",
        teal: "0 12px 35px -8px rgba(8, 47, 50, 0.5)",
      },
      animation: {
        "pulse-subtle": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
