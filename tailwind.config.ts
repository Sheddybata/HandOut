import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "trust-blue": "#662b62",
        "trust-blue-dark": "#552550",
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      borderRadius: {
        intermediate: "14px",
        "intermediate-lg": "16px",
      },
      spacing: {
        "touch-target": "48px",
      },
      minHeight: {
        "touch-target": "48px",
      },
      minWidth: {
        "touch-target": "48px",
      },
    },
  },
  plugins: [],
};
export default config;
