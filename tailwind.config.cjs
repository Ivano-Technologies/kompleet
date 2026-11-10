/** @type {import('tailwindcss').Config} */
// KOMPLEET Design System — Option C teal lock (Kezie 26 Sep 2026, IVA-72)

/** Space-separated RGB channels from globals.css. Keeps /opacity modifiers. */
function rgb(channelVar) {
  return `rgb(var(${channelVar}) / <alpha-value>)`;
}

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
        primary: {
          // DEFAULT follows --link so text-primary / text-button links switch
          // to teal-400 in dark. CTA fills use --primary-fill (teal #0F766E).
          // Sidebars stay navy via primary-navy / primary-deep.
          DEFAULT: rgb("--link"),
          fill: {
            DEFAULT: rgb("--primary-fill"),
            hover: rgb("--primary-fill-hover"),
          },
          navy: rgb("--primary"),
          deep: "#072A45",
          mid: "#1B6CA8",
        },
        link: rgb("--link"),
        accent: {
          DEFAULT: "#0D9488",
          hover: "#0F766E",
          foreground: "#FFFFFF",
        },
        charcoal: {
          DEFAULT: "#FFFFFF",
          dk: "#252E32",
        },

        // Theme surfaces follow :root / html.dark so bg-bg, bg-light-*, and
        // dark:bg-dark-* all read CSS variables instead of compiled hex.
        // Light channel values stay cream; dark channels stay brand navy.
        bg: rgb("--background"),
        surface: {
          DEFAULT: rgb("--surface"),
          2: rgb("--surface-2"),
        },
        border: {
          DEFAULT: rgb("--border"),
          hover: rgb("--border-hover"),
        },
        text: {
          1: rgb("--text-primary"),
          2: rgb("--text-secondary"),
          3: rgb("--text-tertiary"),
          4: rgb("--text-4"),
        },

        // Leftover light-* utilities (legal/help/dashboard) follow the same
        // switching channels as bg/surface/text.
        light: {
          background: rgb("--background"),
          surface: rgb("--surface"),
          border: rgb("--border"),
          text: {
            primary: rgb("--text-primary"),
            secondary: rgb("--text-secondary"),
            tertiary: rgb("--text-tertiary"),
          },
        },

        // Always-navy channels. dark: variants and code wells stay brand navy
        // even when a page is in light mode.
        dark: {
          bg: rgb("--dark-bg"),
          background: rgb("--dark-bg"),
          surface: {
            DEFAULT: rgb("--dark-surface"),
            2: rgb("--dark-surface-2"),
          },
          border: {
            DEFAULT: rgb("--dark-border"),
            hover: rgb("--dark-border-hover"),
          },
          text: {
            1: rgb("--dark-text-1"),
            primary: rgb("--dark-text-1"),
            2: rgb("--dark-text-2"),
            secondary: rgb("--dark-text-2"),
            3: rgb("--dark-text-3"),
            tertiary: rgb("--dark-text-3"),
            4: rgb("--dark-text-4"),
          },
        },

        success: {
          DEFAULT: "#1B7A4E",
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
        display: ["Clash Display", "var(--font-montserrat)", "sans-serif"],
        ceoruse: ["var(--font-ceoruse)", "Clash Display", "sans-serif"],
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        body: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
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
        primary: "0 8px 32px rgba(11,58,92,0.28)",
        accent: "0 1px 2px rgba(13,27,42,0.06)",
        "inner-subtle": "inset 0 1px 2px rgba(0,0,0,0.1)",
        "outer-soft":
          "0 4px 8px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)",
        "outer-deep":
          "0 10px 20px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.07)",
        pressed:
          "inset 0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};
