/** @type {import('tailwindcss').Config} */
// Force rebuild - February 8, 2026 05:08 UTC
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      colors: {
        // NextAuth-inspired pure black/white themes
        black: '#000000',
        white: '#FFFFFF',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'floating-logo': 'rgb(var(--floating-logo) / <alpha-value>)',
        
        // Nigerian green accent (replaces NextAuth cyan)
        primary: {
          DEFAULT: '#008751',
          hover: '#006B3F',
          'dark-hover': '#00A862',
        },
        
        // Semantic colors
        success: {
          light: '#22C55E',
          dark: '#4ADE80',
        },
        warning: {
          light: '#F59E0B',
          dark: '#FBBF24',
        },
        error: {
          light: '#EF4444',
          dark: '#F87171',
        },
        info: {
          light: '#3B82F6',
          dark: '#60A5FA',
        },
      },
      fontSize: {
        // NextAuth typography scale
        hero: ['72px', { lineHeight: '1.1', fontWeight: '900' }],
        'h1': ['48px', { lineHeight: '1.2', fontWeight: '800' }],
        'h2': ['32px', { lineHeight: '1.3', fontWeight: '700' }],
        'h3': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        small: ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        // NextAuth spacing scale
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '40px',
        xl: '64px',
        '2xl': '96px',
      },
      borderRadius: {
        // NextAuth button radius
        '3xl': '24px',
      },
      maxWidth: {
        // NextAuth container width
        container: '1200px',
      },
      transitionDuration: {
        // NextAuth transition speed
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
}
