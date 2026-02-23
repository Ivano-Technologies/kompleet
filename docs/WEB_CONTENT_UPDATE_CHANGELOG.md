# Web Content Update Changelog

**Date:** February 2026  
**Scope:** Homepage and site-wide content updates (Kompleet branding)

## Summary

Nigeria-optimized content updates for the Kompleet web app: hero copy, Why KOMPLEET section, brand migration (Techivano → Kompleet), and SEO metadata.

## Changes

### Hero Section
- **Headline:** Updated to "Track every naira, stay compliant, and avoid surprises."
- **Subheadline:** "Track your spending in real-time, handle invoices, and tax-ready reports."
- Removed previous "Control Your Money. Grow Your Business." headline.

### Why KOMPLEET Section
- **Heading:** "Nigeria-first. Built for Nigerian Businesses."
- **Intro:** "Designed from the ground up for Nigerian SMEs, NRS/JTB compliance, and local business needs."
- Added `aria-labelledby` for accessibility.

### Brand Migration (Techivano → Kompleet)
- **Email addresses:** Updated to `@kompleet.ng` domain:
  - hello@kompleet.ng
  - support@kompleet.ng
  - press@kompleet.ng
  - careers@kompleet.ng
  - privacy@kompleet.ng
  - legal@kompleet.ng
- **Website URL:** techivano.com → kompleet.ng (in terms page)

### SEO Metadata
- **Title:** Kompleet — Track Every Naira & Stay Compliant in Nigeria
- **Description:** Track spending, send invoices, export tax-ready reports for Nigerian SMEs.
- **Keywords:** expense tracking Nigeria, SME finance Nigeria, tax compliance Nigeria, cash flow Nigeria, Kompleet app
- **Open Graph:** Added title, description, url, siteName, locale, type
- **Twitter Card:** Added summary_large_image with title and description

### Accessibility (WCAG AA)
- Hero CTAs: `aria-label="Start free 14-day trial"`, `aria-label="Watch 60-second product demo"`
- Why KOMPLEET section: `aria-labelledby="why-kompleet-heading"`

### Files Modified
- `src/app/page.tsx` — Hero, Why KOMPLEET, accessibility
- `src/app/layout.tsx` — SEO metadata, OG tags, Twitter card
- `.env.example` — Added `NEXT_PUBLIC_SITE_URL` for OG canonical URL
- `src/app/(public)/press/page.tsx` — Email addresses
- `src/app/(public)/contact/page.tsx` — Email addresses
- `src/app/(public)/careers/page.tsx` — Email addresses
- `src/app/(public)/privacy/page.tsx` — Email addresses
- `src/app/(public)/cookies/page.tsx` — Email addresses
- `src/app/(public)/terms/page.tsx` — Email addresses, website URL

## QA Checklist
- [ ] Visual QA on desktop + mobile
- [ ] Broken links check
- [ ] Copy verified against spec
- [ ] No legacy Techivano references
- [ ] Lighthouse / Core Web Vitals
- [ ] Light/dark mode parity

## Prerequisites for Deployment
- Ensure `hello@kompleet.ng`, `support@kompleet.ng`, `press@kompleet.ng`, `careers@kompleet.ng`, `privacy@kompleet.ng`, `legal@kompleet.ng` are configured and receiving mail.
- Set `NEXT_PUBLIC_SITE_URL=https://kompleet.ng` (or production URL) for correct OG URLs.
