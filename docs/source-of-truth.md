# KOMPLEET Platform: Design Source of Truth

**Document Purpose:** This is the single source of truth for all UI/UX design decisions in the KOMPLEET platform. All design work must comply with these specifications.

**Last Updated:** February 13, 2026  
**Status:** Non-Negotiable System Constraint

---

## 1. Design Philosophy

### Core Principles
1. **No Glassmorphism** - Absolutely no frosted glass effects, backdrop-filter, or blur
2. **Solid Surfaces** - All UI components use opaque, solid backgrounds
3. **Clean & Professional** - Premium fintech aesthetic for Nigerian market
4. **Theme-Adaptive** - Full Light + Dark mode support
5. **Mobile-First** - Responsive design with mobile as primary target

### Visual Identity
- **Brand Name:** KOMPLEET
- **Primary Color:** `#0A6847` (Nigerian Green)
- **Typography:** Inter (sans-serif), Fira Code (monospace)
- **Border Radius:** Soft, modern (8px-16px standard)
- **Shadows:** Subtle, no heavy drop shadows

---

## 2. Color System

### Primary Brand Color
```css
--primary-500: #0A6847 (Main brand color)
--primary-400: #33AF87
--primary-600: #085A3C
```

### Light Theme
```css
--light-background: #FFFFFF (Pure white)
--light-surface: #F9FAFB (Off-white for cards)
--light-surface-hover: #F3F4F6
--light-border: #E5E7EB
--light-border-hover: #D1D5DB
--light-text-primary: #0F172A (Near black)
--light-text-secondary: #475569 (Gray)
--light-text-tertiary: #94A3B8 (Light gray)
```

### Dark Theme
```css
--dark-background: #050A08 (Deep green-black)
--dark-surface: #0C1410 (Dark surface)
--dark-surface-hover: #14211A
--dark-border: #1A2E26
--dark-border-hover: #2A4A3A
--dark-text-primary: #ECFDF5 (Off-white)
--dark-text-secondary: #A7F3D0 (Light green)
--dark-text-tertiary: #6EE7B7 (Muted green)
```

### Semantic Colors
```css
--success-light: #22C55E
--success-dark: #4ADE80
--warning-light: #F59E0B
--warning-dark: #FBBF24
--error-light: #EF4444
--error-dark: #F87171
--info-light: #3B82F6
--info-dark: #60A5FA
```

---

## 3. Typography Scale

```css
--font-hero: 72px / 1.1 / 900 weight
--font-h1: 48px / 1.2 / 800 weight
--font-h2: 32px / 1.3 / 700 weight
--font-h3: 24px / 1.4 / 600 weight
--font-h4: 20px / 1.4 / 600 weight
--font-body: 16px / 1.5 / 400 weight
--font-small: 14px / 1.4 / 400 weight
--font-caption: 12px / 1.4 / 400 weight
```

---

## 4. Component Library

### Solid Card
```tsx
className="solid-card bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6 shadow-card"
```

### Solid Navigation
```tsx
className="solid-nav bg-white/95 dark:bg-dark-surface/95 border-b border-light-border dark:border-dark-border"
```

### Primary Button
```tsx
className="btn-primary bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg"
```

### Secondary Button
```tsx
className="btn-secondary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary"
```

### Input Field
```tsx
className="bg-light-surface dark:bg-dark-surface-hover border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary-500"
```

---

## 5. Page-Specific Specifications

### Landing Page (Light Mode)
- **Purpose:** Public marketing homepage
- **Theme:** Light mode only (default)
- **Must Include:**
  - Fixed top navigation with solid background
  - Hero section with CTA buttons
  - Social proof logos (FIRS, LIRS, NDPR, CAC)
  - Feature sections with solid cards
  - Metrics section
  - Testimonials
  - Final CTA banner
  - Footer with links

### Sign Up (Dark Mode)
- **Purpose:** User registration flow
- **Theme:** Dark mode only
- **Must Include:**
  - Signup form (First name, Last name, Email, Password)
  - Password strength indicator with real-time feedback
  - Password visibility toggle
  - Primary CTA button
  - Link to login
  - NDPR / Security trust badges
  - Solid dark surfaces (no glass)

### Login (Dark Mode)
- **Purpose:** User authentication
- **Theme:** Dark mode
- **Must Include:**
  - Email + password fields
  - Login CTA
  - Forgot password link
  - Signup link
  - Solid cards (no glassmorphism)

### Forgot Password (Light + Dark)
- **Purpose:** Password recovery
- **Theme:** Both light and dark variants
- **Must Include:**
  - Email input
  - Submit CTA
  - Back to login link
  - Solid surfaces

### Main Dashboard (Dark Mode)
- **Purpose:** Primary logged-in home screen
- **Theme:** Dark mode with theme toggle
- **Must Include:**
  - Solid sidebar navigation
  - KPI cards (solid backgrounds)
  - Charts (placeholder or real)
  - Activity feed
  - High contrast
  - No blur or transparency

### Transactions Management (Dark Mode)
- **Purpose:** Manage inflow/outflow
- **Theme:** Dark mode
- **Must Include:**
  - KPI summary cards
  - Filters (date, category, amount)
  - Search bar
  - Paginated table
  - Tax insights panel
  - Solid surfaces

### Reports Dashboard (Dark Mode)
- **Purpose:** Analytics and reporting
- **Theme:** Dark mode
- **Must Include:**
  - KPI cards
  - Charts (line, bar)
  - Filters
  - Transaction tables
  - Reusable data table component
  - Solid surfaces

---

## 6. Routing Structure

### Public Routes
```
/ (Landing)
/pricing
/help
/contact
/about
/careers
/press
/cookies
/api-docs
/privacy
/terms
```

### Auth Routes
```
/login
/signup
/forgot-password
/reset-password
```

### Protected Routes (Dashboard)
```
/dashboard
/transactions
/invoices
/reports
/settings
/calculators
/profile
```

---

## 7. Forbidden Design Patterns

### ❌ NEVER USE:
1. `backdrop-filter: blur()`
2. `background: rgba(255, 255, 255, 0.05)` (transparent backgrounds)
3. Frosted glass effects
4. Heavy blur effects
5. Glassmorphism of any kind
6. Overly transparent surfaces

### ✅ ALWAYS USE:
1. Solid, opaque backgrounds
2. Clean borders with defined colors
3. Soft shadows (0-4px blur)
4. High contrast text
5. Theme-adaptive colors
6. Consistent spacing

---

## 8. Compliance Requirements

### Nigerian Market Specifics
- Display compliance with FIRS, LIRS, NDPR, CAC
- Use Naira symbol (₦) for currency
- Support multi-currency (NGN, USD)
- Tax automation features prominent
- Professional, trustworthy aesthetic

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios (4.5:1 minimum)
- Focus indicators on all interactive elements

---

## 9. Animation & Transitions

### Standard Transitions
```css
transition: all 200ms ease;
```

### Hover Effects
- **Lift:** `transform: translateY(-2px)`
- **Scale:** `transform: scale(1.02)`
- **Shadow:** Increase shadow on hover

### Loading States
- Disable buttons during submission
- Show loading spinner or text
- Maintain button size (no layout shift)

---

## 10. Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile-First Approach
- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly targets (44px minimum)
- Collapsible navigation on mobile

---

## 11. Design Tokens (Tailwind Config)

All design tokens are defined in `tailwind.config.cjs`:
- Primary color scale (50-950)
- Light/Dark theme colors
- Typography scale
- Spacing scale
- Border radius scale
- Shadow utilities

---

## 12. Version Control

- **Branch:** `ui-rebuild-stitch`
- **Commit Pattern:** "Sprint X: [Page] - [Changes]"
- **No Breaking Changes:** Backend logic must remain intact
- **Atomic Commits:** One logical change per commit

---

**This document is the single source of truth. Any deviation must be approved and documented.**
