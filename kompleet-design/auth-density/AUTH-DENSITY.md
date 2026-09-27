# Kompleet — Auth density (fit form above fold)

**Status:** LOCKED 27 Sep 2026 WAT · Handed to Shipping  
**Ticket:** Absorb into **[IVA-90](https://linear.app/ivano-technologies/issue/IVA-90/remove-floating-report-a-bug-fab-from-kompleet-app-ui)** (same PR as Report a Bug FAB removal — PR #126). **Not** a sibling ticket.  
**Brand:** Option C — `/workspace/kompleet-design/wave1/OPTION-C-BRAND-SYSTEM.md`  
**Do not conflict with:** Homepage hero-with-login above-fold rules — `/workspace/kompleet-design/wave1/HERO-WITH-LOGIN.md` (marketing `/` only).  
**Comps:** `/workspace/kompleet-design/auth-density/comps/`  
**Never mix JUO.** Wordmark-only (Ceoruse). No logo mark.

---

## Problem

Dedicated auth pages (`/signup` densest) overflow common laptop viewports. Smoke shows signup **cut off after Business Email** — Password, primary CTA, Terms, and NDPR/SSL trust sit below the fold. Cause is vertical rhythm only: generous card padding (`p-8` / `md:p-12`), `h-[52px]` inputs + buttons, `space-y-5` field stack, large Clash titles, wordmark / trust margins.

**Goal:** Full form (including primary CTA + terms line) visible **without page scroll** on desktop/laptop targets below. Tighten padding, field height, title/subtitle spacing, and card margins only. **Keep Option C — do not redesign.**

---

## Scope (routes)

| Route | Notes |
|---|---|
| `/signup` | Densest — primary acceptance target |
| `/login` | Same density tokens |
| `/forgot-password` | Same tokens; shorter form — still apply |
| `/reset-password` | Same tokens (incl. success / set-new states) |
| `AuthLayout` (`src/components/layout/AuthLayout.tsx`) | Shared wrapper: card pad, page py, wordmark mb, max-w |
| Sister screens using AuthLayout | e.g. verify-email, post-signup success inside AuthLayout |

**Out of scope for this pack:** Homepage hero auth card (HERO-WITH-LOGIN already locks fold). FAB removal (IVA-90 primary ask — same PR, separate work). Field set / validation / Convex flows.

---

## Density token table (LOCKED)

Apply via Tailwind / shared classes on AuthLayout + auth page forms. Prefer one shared density set.

| Token | BEFORE (live) | AFTER (lock) | Tailwind hint |
|---|---|---|---|
| **Card max-width** | `440px` | **Unchanged** `440px` (~420–480 OK) | `max-w-[440px]` |
| **Card padding** | `p-8` / `md:p-12` (32 / 48) | **`p-5`–`p-6`** (20–24) all breakpoints desktop | `p-5 md:p-6` |
| **Page gutter** | `p-6 md:p-8` | Modest py; flex center | `px-4 py-4 md:px-6 md:py-5` · keep `min-h-dvh` / `min-h-screen` flex center |
| **Wordmark margin-bottom** | `mb-6` (24) | **`mb-3`** (12) | `mb-3` |
| **Header addon row mb** | `mb-4` | **`mb-2`–`mb-3`** | `mb-2` |
| **Title block mb** | `mb-6` | **`mb-3`–`mb-4`** | `mb-3` |
| **Eyebrow (CREATE ACCOUNT)** | `mb-2` · `text-xs` | Keep `text-xs`; **`mb-1`** | `mb-1` |
| **Title (Clash)** | `text-3xl` (~30) | **`text-2xl`–`text-[28px]`** (24–28) | `text-2xl` or `text-[26px]` |
| **Title mb** | `mb-2` | **`mb-1`** | `mb-1` |
| **Subtitle** | `text-sm` always | Prefer **1 line**; omit/hide on short viewports | `text-sm leading-snug` · optional `@media (max-height: 800px) { .auth-sub { display:none } }` |
| **Field stack gap** | `space-y-5` (20) | **`space-y-3`** (12) — max 14 | `space-y-3` |
| **Name row gap** | `gap-4` | **`gap-3`** | `gap-3` |
| **Label size** | `text-xs` uppercase bold | Unchanged | `text-xs font-bold uppercase tracking-wider` |
| **Label → input** | `mt-2` (8) | **`mt-1`** (4) | `mt-1` |
| **Input height** | `h-[52px]` | **`h-10`–`h-11`** (40–44) | `h-11` (44) preferred |
| **Input px** | `px-4` | `px-3` OK | `px-3` |
| **Primary button h** | `h-[52px]` | **`h-10`–`h-11`** (40–44) | `h-11` |
| **Button top margin** | `mt-6` (extra on top of space-y) | **`mt-3`** or rely on `space-y-3` only | drop redundant `mt-6`; use `mt-3` if needed |
| **Terms line mt** | `mt-5` | **`mt-3`** | `mt-3` · `text-xs` |
| **Trust strip** | `mt-6 border-t pt-5` + two chips | Tighter: **`mt-3 pt-3`**; prefer **one inline line** | `mt-3 border-t border-border pt-3` · `gap-3` · icons `h-3 w-3` |
| **Error banner** | `mb-6 p-3` | **`mb-3 p-2.5`** | keep meaning/colors |
| **Password strength** | bar + label `mt-2` | Keep when password non-empty; **compact** — bar only or `text-[11px]`; do not reserve empty height | |

### Layout shell

```
AuthLayout:
  outer: flex min-h-dvh (or min-h-screen) bg-bg
  form column: flex items-center justify-center px-4 py-4 md:px-6 md:py-5
  card: max-w-[440px] rounded-xl border border-border bg-surface shadow-1 p-5 md:p-6
  Prefer vertical center without forcing overflow (no min-height on card that exceeds viewport).
```

---

## Per-screen notes

### `/signup` (densest — ship first)

Order (unchanged): KOMPLEET wordmark · Already have account? · CREATE ACCOUNT / Sign up + subtitle · First+Last · Business Name · Business Email · Password · Create Free Account · Terms · NDPR/SSL trust.

Apply full token table. On viewports ≤800px tall:
- Collapse subtitle to 1 line or hide via `max-height` media.
- Trust: single inline row `NDPR Compliant · 256-bit SSL` (no large top padding).
- Password strength: only when typing; never push CTA off-fold at rest.

### `/login`

Welcome Back · Sign in · Business Email · Password · Forgot · Sign in CTA · Create account link. Same input/button/card tokens. Extra vertical space is fine — **do not** re-inflate padding to “fill” the card.

### `/forgot-password` · `/reset-password`

Same input/button/card tokens. Optional icon circle above title: shrink to `h-10 w-10` or omit on short viewports. Success states stay compact (`space-y-4`, title `text-2xl`).

### Sister AuthLayout screens

Inherit card/page/wordmark density from AuthLayout so verify-email / success do not reintroduce `md:p-12`.

---

## Optional tighteners (allowed)

1. Collapse subtitle to 1 line; hide under `@media (max-height: 800px)`.
2. Shrink trust to one inline line (icons + text, no stacked blocks).
3. Reduce wordmark `mb` to 12px (`mb-3`).
4. Drop redundant button `mt-6` when form already uses `space-y-3`.

---

## What NOT to change

- Field set / order / requiredness / Convex auth flows  
- Copy **meaning** (wording tweaks only if needed for 1-line subtitle — prefer keep)  
- Colors / Option C tokens (navy `#0B3A5C`, teal `#0D9488`, surfaces `#F4F1EB` / `#FFFDF8`, border `#DDD5C8`)  
- Typography families: Ceoruse wordmark · Clash titles · Montserrat UI  
- **No logo mark** · no JUO  
- Card max-width (~440)  
- Left illustration panel (`auth-panel`) art / brand  
- Homepage `/` hero auth (HERO-WITH-LOGIN)

---

## Acceptance checklist

| # | Check |
|---|---|
| 1 | **1440×900:** `/signup` — full form visible without page scroll: Password + **Create Free Account** + Terms (+ trust preferred) |
| 2 | **1366×768:** same as (1) — primary laptop target |
| 3 | **1280×800:** same as (1) |
| 4 | `/login`, `/forgot-password`, `/reset-password` use same density tokens; no page scroll for full form + CTA on those viewports |
| 5 | No redesign: Option C colors, Ceoruse wordmark-only, Clash + Montserrat, no logo mark |
| 6 | Homepage hero fold unchanged (HERO-WITH-LOGIN) |
| 7 | Ships in **IVA-90** PR with FAB removal — hold Preview Ready until **both** land |

---

## Relation

| Item | Relation |
|---|---|
| **IVA-90** FAB remove | **Same PR** — absorb auth density here. Hold Preview / CoS ping until FAB **and** density both land. |
| **HERO-WITH-LOGIN** | Sibling concern for marketing `/` only — do not conflict; dedicated auth routes are this pack. |

---

## Eng touchpoints (for Shipping)

1. `src/components/layout/AuthLayout.tsx` — card `p-*`, page `py-*`, wordmark `mb-*`  
2. `src/app/signup/page.tsx` — densest form tokens  
3. `src/app/login/page.tsx`  
4. `src/app/forgot-password/page.tsx`  
5. `src/app/reset-password/ResetPasswordClient.tsx` (+ any AuthLayout sisters)

Comps: `comps/signup-dense-1366.html` (+ PNG), `comps/login-dense.html` (+ PNG).
