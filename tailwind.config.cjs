/** @type {import('tailwindcss').Config} */
// UI Rebuild - Stitch Design System (No Glassmorphism)
// Updated: February 13, 2026
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
          DEFAULT: '#0A6847',
          50: '#E6F5F0',
          100: '#CCEBE1',
          200: '#99D7C3',
          300: '#66C3A5',
          400: '#33AF87',
          500: '#0A6847',
          600: '#085A3C',
          700: '#064B31',
          800: '#043C26',
          900: '#022D1B',
          950: '#011E12',
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
            primary: '#ECFDF5',
            secondary: '#A7F3D0',
            tertiary: '#6EE7B7',
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
      spacing: {
        // Consistent Spacing Scale
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '40px',
        xl: '64px',
        '2xl': '96px',
      },
      borderRadius: {
        // Soft, Modern Radius
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
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
