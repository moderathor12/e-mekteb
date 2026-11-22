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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          500: "#4f46e5",
          600: "#4338ca",
          700: "#3730a3",
        },
        tscale: {
          positive: "#10b981",
          positiveLight: "#ecfdf5",
          positiveBorder: "#a7f3d0",
          negative: "#f59e0b",
          negativeLight: "#fffbeb",
          negativeBorder: "#fde68a",
          accent: "#2563eb",
        }
      },
    },
  },
  plugins: [],
};
export default config;
