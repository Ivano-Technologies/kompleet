/** @type {import('tailwindcss').Config} */
// KOMPLEET Design System 2026 - Approved 27 Feb 2026
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // APPROVED BRAND PALETTE
        primary: {
          DEFAULT: "#0F4C75",
          deep: "#0A2F4E",
          mid: "#1B6CA8",
        },
        accent: {
          DEFAULT: "#C8F000",
          hover: "#B5D900",
        },
        charcoal: {
          DEFAULT: "#38464B",
          dk: "#252E32",
        },

        // APPROVED LIGHT THEME
        bg: "#EEF1F5",
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#F5F7FA",
        },
        border: {
          DEFAULT: "#E2E8F0",
          hover: "#CBD5E1",
        },
        text: {
          1: "#0D1B2A",
          2: "#334155",
          3: "#64748B",
          4: "#94A3B8",
        },

        // APPROVED DARK THEME
        dark: {
          bg: "#080F18",
          surface: {
            DEFAULT: "#0F1E2E",
            2: "#162438",
          },
          border: {
            DEFAULT: "#1A3050",
            hover: "#244060",
          },
          text: {
            1: "#F0F9FF",
            2: "#BAD8F5",
            3: "#7BA8CC",
            4: "#4A7A9B",
          },
        },

        // APPROVED SEMANTIC COLORS (UNCHANGED)
        success: {
          DEFAULT: "#16A34A",
          bg: "#F0FDF4",
          dark: "#4ADE80",
          darkBg: "#052e16",
        },
        warning: {
          DEFAULT: "#D97706",
          bg: "#FFFBEB",
          dark: "#FBBF24",
          darkBg: "#1c1400",
        },
        error: {
          DEFAULT: "#DC2626",
          bg: "#FEF2F2",
          dark: "#F87171",
          darkBg: "#1a0505",
        },
        info: {
          DEFAULT: "#2563EB",
          bg: "#EFF6FF",
          dark: "#60A5FA",
          darkBg: "#0c1a3a",
        },
      },
      fontFamily: {
        display: ["Clash Display", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
        24: "96px",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        1: "0 1px 3px rgba(13,27,42,0.08), 0 1px 2px rgba(13,27,42,0.05)",
        2: "0 4px 12px rgba(13,27,42,0.10), 0 2px 6px rgba(13,27,42,0.06)",
        3: "0 8px 24px rgba(13,27,42,0.12), 0 4px 12px rgba(13,27,42,0.07)",
        4: "0 16px 48px rgba(13,27,42,0.16), 0 8px 20px rgba(13,27,42,0.09)",
        5: "0 24px 64px rgba(13,27,42,0.20), 0 12px 28px rgba(13,27,42,0.11)",
        primary: "0 8px 32px rgba(15,76,117,0.40)",
        accent: "0 8px 24px rgba(200,240,0,0.35)",
      },
    },
  },
  plugins: [],
};
