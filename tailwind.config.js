/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // Primary action / success — "Modern SaaS Professional" green (#36B76B).
        brand: {
          50: "#ECF8F1",
          100: "#D4F1E0", // primary-light (used at 8–15% as backgrounds)
          200: "#A9E3C2",
          300: "#7DD5A3",
          400: "#57C788",
          500: "#4CC07D",
          600: "#36B76B", // primary action
          700: "#2E9E5C",
          800: "#26804B",
          900: "#1E6B3E",
        },
        // Secondary — warning / alternate metrics (#F4A13A).
        accent: {
          50: "#FEF4E8",
          100: "#FCE4C4",
          400: "#F7B968",
          500: "#F4A13A",
          600: "#E08C26",
        },
        // Neutral surfaces from the spec.
        ink: "#111827", // headings
        body: "#6B7280", // muted body
        subtle: "#9CA3AF", // captions
        line: "#E5E7EB", // standard border
        "line-light": "#F0F0F0",
        canvas: "#F9FAFB", // app background
        hover: "#F3F4F6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.05)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        growUp: {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out both",
        "slide-in-left": "slideInLeft 0.4s ease-out both",
        "slide-in-right": "slideInRight 0.4s ease-out both",
        "grow-up": "growUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
