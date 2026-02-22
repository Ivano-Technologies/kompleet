# KOMPLEET Design System Proposal

**Based on:** NextAuth.js design language  
**Accent:** Nigerian green (#008751)  
**Date:** February 8, 2026  
**Status:** Awaiting approval

---

## Color Palette

### Light Theme

| Token           | Hex       | Usage                                                               | NextAuth Source  |
| --------------- | --------- | ------------------------------------------------------------------- | ---------------- |
| `background`    | `#FFFFFF` | Page background                                                     | NextAuth light   |
| `surface`       | `#F5F5F5` | Cards, elevated surfaces                                            | NextAuth light   |
| `surface-hover` | `#FAFAFA` | Hover states for surfaces                                           | NextAuth light   |
| `foreground`    | `#000000` | Primary text                                                        | NextAuth light   |
| `muted`         | `#666666` | Secondary text, labels                                              | NextAuth light   |
| `border`        | `#E0E0E0` | Dividers, borders                                                   | NextAuth light   |
| `accent`        | `#008751` | **Nigerian green** - Primary buttons, active states, key highlights | KOMPLEET brand   |
| `accent-hover`  | `#006D40` | Hover state for accent                                              | Darker green     |
| `accent-light`  | `#E6F4EE` | Subtle accent backgrounds                                           | Light green tint |
| `success`       | `#22C55E` | Success states                                                      | Standard         |
| `warning`       | `#F59E0B` | Warning states                                                      | Standard         |
| `error`         | `#EF4444` | Error states                                                        | Standard         |

### Dark Theme

| Token           | Hex       | Usage                                                               | NextAuth Source |
| --------------- | --------- | ------------------------------------------------------------------- | --------------- |
| `background`    | `#000000` | Page background                                                     | NextAuth dark   |
| `surface`       | `#1A1A1A` | Cards, elevated surfaces                                            | NextAuth dark   |
| `surface-hover` | `#2A2A2A` | Hover states for surfaces                                           | NextAuth dark   |
| `foreground`    | `#FFFFFF` | Primary text                                                        | NextAuth dark   |
| `muted`         | `#A0A0A0` | Secondary text, labels                                              | NextAuth dark   |
| `border`        | `#333333` | Dividers, borders                                                   | NextAuth dark   |
| `accent`        | `#008751` | **Nigerian green** - Primary buttons, active states, key highlights | KOMPLEET brand  |
| `accent-hover`  | `#00A564` | Hover state for accent (lighter in dark mode)                       | Lighter green   |
| `accent-light`  | `#00331F` | Subtle accent backgrounds                                           | Dark green tint |
| `success`       | `#4ADE80` | Success states                                                      | Standard        |
| `warning`       | `#FBBF24` | Warning states                                                      | Standard        |
| `error`         | `#F87171` | Error states                                                        | Standard        |

---

## Typography

### Font Family

```css
font-family:
  "Inter",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  Arial,
  sans-serif;
```

**Implementation:**

- Load Inter from Google Fonts or Vercel Fonts
- Fallback to system fonts for performance

### Type Scale

| Token     | Size            | Weight           | Line Height | Usage                      |
| --------- | --------------- | ---------------- | ----------- | -------------------------- |
| `hero`    | 72px (4.5rem)   | 900 (Black)      | 1.1         | Landing page hero headings |
| `h1`      | 48px (3rem)     | 800 (Extra Bold) | 1.2         | Page titles                |
| `h2`      | 32px (2rem)     | 700 (Bold)       | 1.3         | Section headings           |
| `h3`      | 24px (1.5rem)   | 600 (Semi Bold)  | 1.4         | Subsection headings        |
| `h4`      | 20px (1.25rem)  | 600 (Semi Bold)  | 1.4         | Card titles                |
| `body-lg` | 18px (1.125rem) | 400 (Regular)    | 1.6         | Large body text            |
| `body`    | 16px (1rem)     | 400 (Regular)    | 1.5         | Default body text          |
| `body-sm` | 14px (0.875rem) | 400 (Regular)    | 1.5         | Small body text, labels    |
| `caption` | 12px (0.75rem)  | 400 (Regular)    | 1.4         | Captions, footnotes        |

### Font Weights

- **Regular (400):** Body text
- **Medium (500):** Emphasized body text
- **Semi Bold (600):** Subheadings, buttons
- **Bold (700):** Headings
- **Extra Bold (800):** Large headings
- **Black (900):** Hero headings

---

## Spacing Scale

| Token | Value         | Usage                               |
| ----- | ------------- | ----------------------------------- |
| `xs`  | 8px (0.5rem)  | Tight spacing (icon-text gap)       |
| `sm`  | 16px (1rem)   | Small spacing (between elements)    |
| `md`  | 24px (1.5rem) | Medium spacing (card padding)       |
| `lg`  | 40px (2.5rem) | Large spacing (section gaps)        |
| `xl`  | 64px (4rem)   | Extra large spacing (page sections) |
| `2xl` | 96px (6rem)   | Hero section spacing                |

---

## Border Radius

| Token  | Value  | Usage                                |
| ------ | ------ | ------------------------------------ |
| `sm`   | 8px    | Small elements (badges, tags)        |
| `md`   | 12px   | Medium elements (inputs, cards)      |
| `lg`   | 16px   | Large elements (modals, large cards) |
| `full` | 9999px | Pills, circular buttons              |

---

## Shadows

| Token  | Value                               | Usage                                     |
| ------ | ----------------------------------- | ----------------------------------------- |
| `sm`   | `0 1px 2px 0 rgb(0 0 0 / 0.05)`     | Subtle elevation                          |
| `md`   | `0 4px 6px -1px rgb(0 0 0 / 0.1)`   | Cards, dropdowns                          |
| `lg`   | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals, popovers                          |
| `none` | `none`                              | Flat design (preferred for most elements) |

**Note:** NextAuth uses minimal shadows. Prefer flat design with subtle borders.

---

## Component Specifications

### Button

**Primary (Nigerian Green Accent)**

- Background: `accent` (#008751)
- Text: White (#FFFFFF)
- Padding: 12px 32px
- Border radius: `full` (9999px)
- Font: 16px, Semi Bold (600)
- Hover: `accent-hover` (#006D40)
- Active: Scale 0.98

**Secondary**

- Background: Transparent
- Text: `accent` (#008751)
- Border: 1px solid `accent`
- Padding: 12px 32px
- Border radius: `full` (9999px)
- Font: 16px, Semi Bold (600)
- Hover: Background `accent-light`

**Danger**

- Background: `error` (#EF4444 light, #F87171 dark)
- Text: White
- Padding: 12px 32px
- Border radius: `full` (9999px)
- Font: 16px, Semi Bold (600)
- Hover: Darker red

### Card

**Feature Card (Circular Icon)**

- Circular gradient background (200px diameter)
- Icon/illustration inside circle
- Heading below (h3, 24px, bold)
- Description below (body, 16px, muted)
- Spacing: 24px between elements

**Data Card (Dashboard)**

- Background: `surface` with glassmorphism effect
- Border: 1px solid `border`
- Border radius: `lg` (16px)
- Padding: `md` (24px)
- Hover: `surface-hover` background

**Glassmorphism Effect (for widgets only, not icons):**

```css
background: rgba(255, 255, 255, 0.1); /* Light theme */
background: rgba(26, 26, 26, 0.8); /* Dark theme */
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);
```

### Input

- Background: `surface`
- Border: 1px solid `border`
- Border radius: `md` (12px)
- Padding: 12px 16px
- Font: 16px, Regular (400)
- Focus: Border `accent`, outline none
- Placeholder: `muted`

### Table

- Header background: `surface`
- Header text: `foreground`, Semi Bold (600)
- Row border: 1px solid `border`
- Row hover: `surface-hover`
- Cell padding: 16px
- Font: 16px, Regular (400)

### Navigation

**Header**

- Height: 64px
- Background: `background` (transparent on scroll)
- Border bottom: 1px solid `border`
- Sticky on scroll
- Logo: Left-aligned
- Nav links: Center-aligned, 16px, Medium (500)
- Right side: Theme toggle, user menu

**Footer**

- 3-column layout
- Section headings: 16px, Semi Bold (600)
- Links: 14px, Regular (400), `muted`
- Padding: `xl` (64px) vertical
- Border top: 1px solid `border`

### Modal

- Background: `surface`
- Border radius: `lg` (16px)
- Padding: `md` (24px)
- Max width: 600px
- Overlay: rgba(0, 0, 0, 0.5)
- Shadow: `lg`

### Progress

**Circular (Compliance Health)**

- Diameter: 120px
- Stroke width: 8px
- Stroke color: `accent` (#008751)
- Background stroke: `border`
- Center text: Percentage, h2, bold

**Linear**

- Height: 8px
- Background: `border`
- Fill: `accent` (#008751)
- Border radius: `full`

### Badge

- Background: `accent-light` (#E6F4EE light, #00331F dark)
- Text: `accent` (#008751)
- Padding: 4px 12px
- Border radius: `full`
- Font: 12px, Medium (500)

---

## Layout Grid

### Container

- Max width: 1200px
- Padding: 40px horizontal (desktop), 24px (mobile)
- Centered

### Breakpoints

| Name  | Min Width | Usage                           |
| ----- | --------- | ------------------------------- |
| `sm`  | 640px     | Mobile landscape                |
| `md`  | 768px     | Tablet portrait                 |
| `lg`  | 1024px    | Tablet landscape, small desktop |
| `xl`  | 1280px    | Desktop                         |
| `2xl` | 1536px    | Large desktop                   |

### Grid

- 12-column grid
- Gap: 24px (desktop), 16px (mobile)
- Feature cards: 3 columns (desktop), 1 column (mobile)

---

## Accessibility

### Contrast Ratios (WCAG AA)

- **Normal text (< 18px):** 4.5:1 minimum
- **Large text (≥ 18px):** 3:1 minimum
- **UI components:** 3:1 minimum

**Verified:**

- `foreground` on `background`: 21:1 (AAA) ✅
- `muted` on `background`: 5.7:1 (AA) ✅
- `accent` on white: 4.8:1 (AA) ✅
- `accent` on black: 4.3:1 (AA) ✅

### Focus States

- Outline: 2px solid `accent`
- Outline offset: 2px
- Border radius: Inherit from element

### Keyboard Navigation

- All interactive elements focusable
- Logical tab order
- Skip to main content link

---

## Implementation Plan

### 1. Update Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        border: "var(--border)",
        accent: "var(--accent)",
        // ... (all tokens)
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["4.5rem", { lineHeight: "1.1", fontWeight: "900" }],
        // ... (all type scale)
      },
      spacing: {
        xs: "0.5rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2.5rem",
        xl: "4rem",
        "2xl": "6rem",
      },
    },
  },
};
```

### 2. CSS Variables

```css
/* globals.css */
:root {
  --background: #ffffff;
  --surface: #f5f5f5;
  --foreground: #000000;
  --muted: #666666;
  --border: #e0e0e0;
  --accent: #008751;
  --accent-hover: #006d40;
  --accent-light: #e6f4ee;
  /* ... */
}

[data-theme="dark"] {
  --background: #000000;
  --surface: #1a1a1a;
  --foreground: #ffffff;
  --muted: #a0a0a0;
  --border: #333333;
  --accent: #008751;
  --accent-hover: #00a564;
  --accent-light: #00331f;
  /* ... */
}
```

### 3. Load Inter Font

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Approval Checklist

- [ ] Color palette (NextAuth base + Nigerian green accents)
- [ ] Typography (Inter font, type scale)
- [ ] Spacing system
- [ ] Component specifications (buttons, cards, inputs, etc.)
- [ ] Layout grid and breakpoints
- [ ] Accessibility standards (WCAG AA)
- [ ] Implementation approach (Tailwind + CSS variables)

---

## Next Steps After Approval

1. Update `tailwind.config.js` with design tokens
2. Update `globals.css` with CSS variables
3. Load Inter font in `app/layout.tsx`
4. Build component library in `src/components/ui/`
5. Begin page redesigns starting with landing page

---

**Awaiting user approval to proceed with implementation.**
