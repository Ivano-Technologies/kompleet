/** @type {import('tailwindcss').Config} */
// UI Rebuild - Stitch Design System (No Glassmorphism)
// Updated: February 14, 2026 - Fixed spacing/borderRadius conflicts with Tailwind v4
//
// IMPORTANT: In Tailwind CSS v4, custom spacing keys like "sm", "md", "lg", "xl", "2xl"
// override the built-in sizing tokens used by max-w-*, p-*, gap-*, rounded-*, etc.
// This caused max-w-lg to resolve to 40px instead of 32rem, breaking all layouts.
// Custom spacing/radius keys have been renamed to avoid conflicts.
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
        // Primary Brand Color
        primary: {
          DEFAULT: '#408ee0',
          50: '#E8F3FC',
          100: '#D1E7F9',
          200: '#A3CEF3',
          300: '#75B6ED',
          400: '#479DE7',
          500: '#408ee0',
          600: '#2D7BC7',
          700: '#2461A0',
          800: '#1B4879',
          900: '#122F52',
          950: '#0A1C31',
        },
        
        // Light Theme Colors
        light: {
          background: '#FFFFFF',
          surface: '#F9FAFB',
          'surface-hover': '#F3F4F6',
          border: '#E5E7EB',
          'border-hover': '#D1D5DB',
          text: {
            primary: '#0F172A',
            secondary: '#475569',
            tertiary: '#94A3B8',
          },
        },
        
        // Dark Theme Colors
        dark: {
          background: '#050A08',
          surface: '#0C1410',
          'surface-hover': '#14211A',
          border: '#1A2E26',
          'border-hover': '#2A4A3A',
          text: {
            primary: '#E3F1FF',
            secondary: '#BAD8F5',
            tertiary: '#93C5EB',
          },
        },
        
        // Semantic Colors (Theme-Adaptive)
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
        // Typography Scale
        hero: ['72px', { lineHeight: '1.1', fontWeight: '900' }],
        'h1': ['48px', { lineHeight: '1.2', fontWeight: '800' }],
        'h2': ['32px', { lineHeight: '1.3', fontWeight: '700' }],
        'h3': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        small: ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      // Design-system spacing aliases — prefixed to avoid colliding with
      // Tailwind v4 built-in tokens (sm, md, lg, xl, 2xl).
      spacing: {
        'k-xs': '8px',
        'k-sm': '16px',
        'k-md': '24px',
        'k-lg': '40px',
        'k-xl': '64px',
        'k-2xl': '96px',
      },
      // Design-system radius aliases — prefixed for the same reason.
      borderRadius: {
        'k-sm': '4px',
        'k-md': '8px',
        'k-lg': '12px',
        'k-xl': '16px',
        'k-2xl': '24px',
      },
      boxShadow: {
        // Subtle Shadows (No Glassmorphism)
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'soft-lg': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
      },
      maxWidth: {
        container: '1200px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
}
