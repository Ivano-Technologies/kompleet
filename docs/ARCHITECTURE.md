# KOMPLEET Platform — UI Architecture

## Overview

The KOMPLEET Platform UI has been rebuilt from the ground up on the `ui-rebuild-v2` branch. This document describes the design system, token architecture, and conventions that govern all frontend code.

## Design System

### Philosophy

- **Clean, modern, professional** — inspired by fintech leaders like Mono.co
- **No glassmorphism** — flat surfaces with subtle borders and shadows
- **Light mode primary, dark mode supported** — system-default detection with manual toggle
- **Semantic tokens only** — zero raw Tailwind color classes (gray-_, emerald-_) in dashboard pages

### Color Tokens

All colors are referenced via semantic tokens defined in `globals.css`:

| Token                                          | Light Mode  | Dark Mode   | Usage                  |
| ---------------------------------------------- | ----------- | ----------- | ---------------------- |
| `light-text-primary` / `dark-text-primary`     | Near-black  | Near-white  | Headings, primary text |
| `light-text-secondary` / `dark-text-secondary` | Medium gray | Light gray  | Body text, labels      |
| `light-text-tertiary` / `dark-text-tertiary`   | Light gray  | Dim gray    | Placeholders, captions |
| `light-surface` / `dark-surface`               | White       | Dark slate  | Cards, panels          |
| `light-background` / `dark-background`         | Off-white   | Near-black  | Page backgrounds       |
| `light-border` / `dark-border`                 | Light gray  | Dark border | Borders, dividers      |
| `primary-50` through `primary-900`             | Green scale | Green scale | Brand, CTAs, accents   |

### Typography

- **Headings**: DM Sans (bold, semi-bold)
- **Body**: DM Sans (regular, medium)
- **Monospace**: System monospace for code/data

### Component Conventions

- Cards: `p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface`
- Buttons: Use `btn-primary` or `btn-secondary` CSS classes
- Inputs: `rounded-lg` with semantic border/background tokens
- Icons: `lucide-react` exclusively — no heroicons, no react-icons

## Layout Architecture

### DashboardShell

Single shared layout component wrapping all authenticated pages:

- **Sidebar**: 10 navigation items with sub-menus, collapsible
- **TopBar**: Breadcrumbs, search, notifications, user menu
- **Content area**: Scrollable main content

### Route Groups

- `(dashboard)/*` — Authenticated pages wrapped in DashboardShell
- `(public)/*` — Marketing/info pages (about, pricing, help, etc.)
- Root pages — Landing, auth (login, signup, forgot-password, reset-password)
- `admin/*` — Admin-only pages (rules, sources)

## Theme System

### Implementation

- `ThemeContext.tsx` provides `theme`, `setTheme`, `toggleTheme`
- Supports `light`, `dark`, and `system` modes
- System mode detects OS preference via `prefers-color-scheme`
- Toggle available in Settings page

### Usage Pattern

```tsx
// In any component:
const { theme, setTheme } = useTheme();

// All styling uses dark: variant classes:
<div className="bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary">
```

## Backend Preservation

The UI rebuild preserves all:

- Supabase client/server authentication flows
- API route handlers (`src/app/api/*`)
- Server actions and data fetching
- Middleware (auth guards, redirects)
- Database queries and mutations
- Third-party integrations (Mono, etc.)

## File Structure

```
src/
├── app/
│   ├── (dashboard)/     # Authenticated pages
│   ├── (public)/        # Marketing pages
│   ├── admin/           # Admin pages
│   ├── api/             # API routes (preserved)
│   ├── login/           # Auth pages
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── globals.css      # Design tokens
│   ├── layout.tsx       # Root layout + ThemeProvider
│   └── page.tsx         # Landing page
├── components/
│   ├── layout/          # DashboardShell, Sidebar, TopBar
│   ├── landing/         # LandingNav, LandingFooter, AnimatedSection
│   ├── charts/          # Chart components
│   ├── dashboard/       # Dashboard-specific components
│   ├── records/         # Record management components
│   └── ui/              # Shared UI primitives
├── contexts/            # ThemeContext, AuthContext
├── lib/                 # Utilities, Supabase clients, auth helpers
└── middleware.ts        # Auth middleware
```

## CI Enforcement

The following rules are enforced:

1. **No raw Tailwind colors** in dashboard pages — use semantic tokens
2. **No `bg-white`** — use `bg-light-surface dark:bg-dark-surface`
3. **No heroicons/react-icons** — use `lucide-react`
4. **All pages must support dark mode** via `dark:` variant classes
