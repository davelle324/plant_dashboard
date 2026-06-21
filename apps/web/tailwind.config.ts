import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10241d",
        moss: "#2f5d50",
        fern: "#7aa36d",
        soil: "#3d2c28",
        cream: "#f5f1e8"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(16, 36, 29, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

