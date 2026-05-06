/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#06080f",
        midnight: "#0b1120",
        neon: "#4fd1ff",
        glow: "#6f89ff",
      },
      boxShadow: {
        neon: "0 0 30px rgba(79, 209, 255, 0.25)",
      },
      backgroundImage: {
        panel: "linear-gradient(140deg, rgba(17, 24, 39, 0.9), rgba(5, 10, 23, 0.85))",
      },
    },
  },
  plugins: [],
};
