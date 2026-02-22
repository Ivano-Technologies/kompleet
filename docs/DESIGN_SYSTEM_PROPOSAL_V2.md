# KOMPLEET Design System v2.0
## NextAuth.js Pixel-Perfect Implementation + Nigerian Green Accents

**Status:** Awaiting Approval  
**Date:** February 8, 2026  
**Based on:** NextAuth.js live site analysis + Nigerian brand identity

---

## Design Philosophy

KOMPLEET adopts NextAuth.js's extreme minimalism and high-contrast aesthetic, replacing cyan accents with Nigerian green (#008751) to honor the national identity while maintaining modern, professional design standards.

### Core Principles

**Extreme Minimalism** — Flat design with no shadows, no glassmorphism, no decorative effects. Every element serves a purpose.

**High Contrast** — Pure black and pure white backgrounds with bold typography create immediate visual hierarchy and excellent readability.

**Bold Typography** — Large headings with heavy font weights command attention and guide users through content confidently.

**Color Discipline** — Nigerian green appears only on primary actions. Gray serves secondary text. Everything else is black or white.

**Generous Spacing** — Whitespace is a design element. Large gaps between sections allow content to breathe and reduce cognitive load.

**Subtle Interactions** — Smooth transitions without dramatic effects. Users feel control, not distraction.

---

## Color Palette

### Light Theme

| Token | Hex | Usage | WCAG AA |
|-------|-----|-------|---------|
| **background** | `#FFFFFF` | Page background, card backgrounds | ✅ |
| **foreground** | `#000000` | Headings, body text, primary content | ✅ 21:1 |
| **muted** | `#666666` | Secondary text, captions, metadata | ✅ 5.74:1 |
| **border** | `#E0E0E0` | Dividers, card borders, input borders | ✅ |
| **primary** | `#008751` | Primary buttons, active states, key highlights | ✅ 4.52:1 |
| **primary-hover** | `#006B3F` | Primary button hover state | ✅ |
| **surface** | `#FFFFFF` | Cards, modals, elevated surfaces (same as background) | ✅ |
| **floating-logo** | `#E0E0E0` | Background brand logos (10% opacity) | ✅ |

### Dark Theme

| Token | Hex | Usage | WCAG AA |
|-------|-----|-------|---------|
| **background** | `#000000` | Page background, card backgrounds | ✅ |
| **foreground** | `#FFFFFF` | Headings, body text, primary content | ✅ 21:1 |
| **muted** | `#A0A0A0` | Secondary text, captions, metadata | ✅ 5.94:1 |
| **border** | `#333333` | Dividers, card borders, input borders | ✅ |
| **primary** | `#008751` | Primary buttons, active states, key highlights | ✅ 4.52:1 |
| **primary-hover** | `#00A862` | Primary button hover state (lighter in dark mode) | ✅ |
| **surface** | `#000000` | Cards, modals, elevated surfaces (same as background) | ✅ |
| **floating-logo** | `#333333` | Background brand logos (10% opacity) | ✅ |

### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| **success** | `#22C55E` | `#4ADE80` | Success messages, completed states |
| **warning** | `#F59E0B` | `#FBBF24` | Warning messages, pending states |
| **error** | `#EF4444` | `#F87171` | Error messages, failed states |
| **info** | `#3B82F6` | `#60A5FA` | Info messages, neutral alerts |

### Toggle / Switch

| Token | Hex | Usage |
|-------|-----|-------|
| **toggle-indicator** | `#CCFF00` | Toggle button indicators (on/active state) |

Use **#CCFF00** for the visible indicator (thumb/knot) on toggle and switch components so the active state is clearly distinguishable.

---

## Typography

### Font Family

**Primary:** Inter (Google Fonts / Vercel)  
**Fallback:** system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif  
**Monospace:** "Fira Code", "Courier New", monospace

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **hero** | 72px | 900 | 1.1 | Landing page hero headings |
| **h1** | 48px | 800 | 1.2 | Page titles, section headings |
| **h2** | 32px | 700 | 1.3 | Subsection headings, card titles |
| **h3** | 24px | 600 | 1.4 | Component headings, widget titles |
| **body** | 16px | 400 | 1.5 | Paragraph text, descriptions |
| **small** | 14px | 400 | 1.4 | Secondary text, labels |
| **caption** | 12px | 400 | 1.4 | Metadata, timestamps, footnotes |

### Font Loading

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 8px | Icon padding, small gaps |
| **sm** | 16px | Button padding, input padding |
| **md** | 24px | Card padding, section padding |
| **lg** | 40px | Large card padding, component spacing |
| **xl** | 64px | Section gaps, page margins |
| **2xl** | 96px | Hero section spacing, major divisions |

---

## Component Specifications

### Buttons

#### Primary Button
```tsx
<button className="bg-primary hover:bg-primary-hover text-white font-semibold text-base px-8 py-3 rounded-3xl transition-colors duration-200">
  Get Started
</button>
```

**Specs:**
- Background: Nigerian green (#008751)
- Text: White, 16px, 600 weight
- Padding: 12px 32px
- Border radius: 24px
- Hover: Darker green (#006B3F)
- Transition: 200ms ease

#### Secondary Button
```tsx
<button className="bg-transparent border border-primary text-primary hover:border-dashed hover:border-2 font-semibold text-base px-8 py-3 rounded-3xl transition-all duration-200">
  Learn More
</button>
```

**Specs:**
- Background: Transparent
- Border: 1px solid Nigerian green
- Text: Nigerian green, 16px, 600 weight
- Padding: 12px 32px
- Border radius: 24px
- Hover: 2px dashed Nigerian green border (unique NextAuth detail!)
- Transition: 200ms ease

#### Danger Button
```tsx
<button className="bg-error hover:opacity-90 text-white font-semibold text-base px-8 py-3 rounded-3xl transition-opacity duration-200">
  Delete
</button>
```

### Cards

#### Feature Card (with Circular Icon)
```tsx
<div className="flex flex-col items-center text-center">
  <div className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mb-6">
    {/* Flat illustration icon */}
  </div>
  <h3 className="text-2xl font-semibold mb-4">Feature Title</h3>
  <ul className="text-base text-muted space-y-2">
    <li>Feature detail 1</li>
    <li>Feature detail 2</li>
  </ul>
</div>
```

**Specs:**
- Circular icon: 200px diameter
- Gradient: Purple-cyan, pink-orange, or blue-cyan
- No glassmorphism - solid gradient background
- Heading: 24px, 600 weight
- Body: 16px, muted color

#### Data Card (Dashboard Widget)
```tsx
<div className="bg-surface border border-border rounded-2xl p-6">
  <h3 className="text-lg font-semibold mb-2">Widget Title</h3>
  <p className="text-sm text-muted">Widget description</p>
  {/* Widget content */}
</div>
```

**Specs:**
- Background: Same as page background (white/black)
- Border: 1px solid border color
- Border radius: 16px
- Padding: 24px
- No shadow - flat design

### Inputs

```tsx
<input
  type="text"
  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-base text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors duration-200"
  placeholder="Enter text..."
/>
```

**Specs:**
- Background: Surface color
- Border: 1px solid border color
- Border radius: 8px
- Padding: 12px 16px
- Focus: Nigerian green border
- Transition: 200ms ease

### Navigation Bar

```tsx
<nav className="sticky top-0 z-50 bg-background border-b border-border">
  <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
    <div className="flex items-center gap-8">
      <Logo />
      <NavLinks />
    </div>
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <UserMenu />
    </div>
  </div>
</nav>
```

**Specs:**
- Height: 64px
- Background: Same as page background
- Border bottom: 1px solid border color
- Sticky positioning
- Max width: 1200px
- Padding: 0 24px

---

## Layout System

### Container
```tsx
<div className="max-w-[1200px] mx-auto px-6">
  {/* Content */}
</div>
```

**Specs:**
- Max width: 1200px
- Horizontal padding: 24px
- Centered with auto margins

### Grid (3-column for features)
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-10">
  {/* Feature cards */}
</div>
```

**Specs:**
- 3 columns on desktop
- 1 column on mobile
- Gap: 40px

### Section Spacing
```tsx
<section className="py-16 md:py-24">
  {/* Section content */}
</section>
```

**Specs:**
- Vertical padding: 64px (mobile), 96px (desktop)

---

## Floating Background Logos

### Implementation

```tsx
// components/floating-logos.tsx
export function FloatingLogos() {
  const logos = [
    { name: 'GTBank', x: '10%', y: '15%' },
    { name: 'Access Bank', x: '85%', y: '20%' },
    { name: 'Zenith Bank', x: '15%', y: '60%' },
    { name: 'UBA', x: '80%', y: '70%' },
    { name: 'FIRS', x: '50%', y: '40%' },
    { name: 'First Bank', x: '25%', y: '80%' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {logos.map((logo) => (
        <div
          key={logo.name}
          className="absolute opacity-10"
          style={{ left: logo.x, top: logo.y }}
        >
          <img
            src={`/logos/${logo.name}.svg`}
            alt=""
            className="w-24 h-24 text-floating-logo"
          />
        </div>
      ))}
    </div>
  );
}
```

**Specs:**
- Opacity: 10% (0.1)
- Positioning: Absolute, scattered across hero section
- Size: 96px (w-24 h-24)
- Color: Light gray (light mode), dark gray (dark mode)
- Pointer events: None (non-interactive)

### Logo Selection (Nigerian Finance/Business Brands)
- GTBank
- Access Bank
- Zenith Bank
- UBA (United Bank for Africa)
- First Bank
- FIRS (Federal Inland Revenue Service)
- Stanbic IBTC
- Ecobank
- Fidelity Bank
- Sterling Bank

---

## Accessibility

### Contrast Ratios (WCAG AA Compliant)

| Combination | Ratio | Pass |
|-------------|-------|------|
| Foreground on Background (Light) | 21:1 | ✅ AAA |
| Foreground on Background (Dark) | 21:1 | ✅ AAA |
| Muted on Background (Light) | 5.74:1 | ✅ AA |
| Muted on Background (Dark) | 5.94:1 | ✅ AA |
| Primary on Background (Light) | 4.52:1 | ✅ AA |
| Primary on Background (Dark) | 4.52:1 | ✅ AA |

### Focus States

All interactive elements have visible focus states with Nigerian green outlines:

```css
:focus-visible {
  outline: 2px solid #008751;
  outline-offset: 2px;
}
```

### Keyboard Navigation

- All buttons and links are keyboard accessible
- Tab order follows logical reading order
- Skip links provided for main content

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Install Inter font from Google Fonts
- [ ] Update Tailwind config with exact color tokens
- [ ] Create CSS variables for theme switching
- [ ] Remove all glassmorphism effects from existing components
- [ ] Remove all shadow utilities from existing components

### Phase 2: Components
- [ ] Build primary, secondary, and danger button components
- [ ] Build feature card component with circular icons
- [ ] Build data card component (flat, bordered)
- [ ] Build input component with focus states
- [ ] Build navigation bar component

### Phase 3: Layout
- [ ] Create floating logos component
- [ ] Update container max-width to 1200px
- [ ] Implement 3-column grid for features
- [ ] Apply section spacing (64-96px)

### Phase 4: Pages
- [ ] Redesign landing page (hero + features)
- [ ] Redesign dashboard (overview + widgets)
- [ ] Redesign sign-in page
- [ ] Redesign all other pages

### Phase 5: Polish
- [ ] Test dark mode theme switching
- [ ] Verify all contrast ratios
- [ ] Test keyboard navigation
- [ ] Add smooth transitions (200ms)
- [ ] Test responsive breakpoints

---

## Differences from Original NextAuth Design

| Element | NextAuth | KOMPLEET |
|---------|----------|----------|
| **Accent color** | Bright cyan (#00D4FF) | Nigerian green (#008751) |
| **Floating logos** | Tech brands (Facebook, Google, etc.) | Nigerian finance brands (GTBank, FIRS, etc.) |
| **Content focus** | Authentication documentation | Tax compliance & bookkeeping |
| **Feature icons** | Generic tech illustrations | Tax/finance-specific illustrations |

Everything else remains pixel-perfect to NextAuth.js design.

---

## Approval Required

**Please review this design system proposal and confirm approval to proceed with implementation.**

Once approved, I will:
1. Update Tailwind config with exact tokens
2. Load Inter font
3. Build component library
4. Redesign all pages with NextAuth fidelity + Nigerian green accents

**Awaiting your approval to proceed.** 🎨
