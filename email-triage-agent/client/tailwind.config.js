/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
      keyframes: {
        rise: {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 420ms ease-out both",
      },
    },
  },
  plugins: [],
};
