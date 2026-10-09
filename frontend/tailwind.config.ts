import type { Config } from "tailwindcss";

// Paleta e tipografia extraídas do protótipo (docs/prototipos/prototipo.md).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F4F3EE",
        ink: "#14171A",
        accent: "#C6F432",
        muted: "#5B6168",
        line: "#DAD9D2",
        soft: "#BFC5C9",
        dark2: "#1F2429",
        danger: "#7A2E12",
        dangerbg: "#F3D9CF",
        good: "#3F6B00",
      },
      fontFamily: {
        display: ["Oswald", "Arial", "sans-serif"],
        sans: ["DM Sans", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
