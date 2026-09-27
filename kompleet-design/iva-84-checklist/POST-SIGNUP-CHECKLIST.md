**Status:** LOCKED by Kezie (UX plan approved via CoS; Design defaults) · 27 Sep 2026 WAT · Handed to Shipping

**Status:** Design draft · Pending Kezie lock · Do NOT mark LOCKED · 27 Sep 2026 WAT

# IVA-84 — Post-signup “Set up your business” checklist

**Status:** Design defaults proposed · Pending Kezie lock · Ready for Shipping once approved  
**Ticket:** [IVA-84](https://linear.app/ivano-technologies/issue/IVA-84/post-signup-set-up-your-business-checklist)  
**Owner:** Design (Coco) → Shippie implement · CoS smokes  
**Date:** 27 Sep 2026 WAT  
**Brand:** Option C — `/workspace/kompleet-design/wave1/OPTION-C-BRAND-SYSTEM.md`  
**Shell:** Settings via `SettingsModal` — `/workspace/kompleet-design/wave2/APP-SHELL.md`  
**Depends / aligns:** LOCKED IVA-82 — `/workspace/kompleet-design/iva-82-profiles/BUSINESS-CLIENT-PROFILES.md`  
**Related (out of scope):** Logo mark (Kezie deferred 27 Sep) · JUO · IVA-81 UBA import · rebuilding signup wizard

---

## 0. Problem → fix

| Today | After IVA-84 |
|---|---|
| New tenant lands on dashboard with empty Business profile; invoice FROM falls back to KOMPLEET + IVA-82 nudges only | Soft first-login checklist card nudges setup of IVA-82 Business profile fields before first invoice |
| Ticket text mentions logo | **Logo omitted** from checklist (deferred) — optional “Coming later” note only |

---

## 1. Tokens (Option C — do not invent)

Same as IVA-82 / Option C:

| Token | Hex | Notes |
|---|---|---|
| `bg` / `surface` / `surface-2` | `#F4F1EB` / `#FFFDF8` / `#EBE6DC` | Page / cards / muted |
| `border` / `border-hover` | `#DDD5C8` / `#C9BFAE` | |
| `primary` | `#0B3A5C` | Titles, secondary links, focus rings |
| `accent` / `accent-hover` | `#0D9488` / `#0F766E` | Primary CTA + active only |
| `success` | `#1B7A4E` | Completed check items — never teal |
| `warning` / `error` | `#D97706` / `#DC2626` | Incomplete / hard errors |
| `info` | `#2563EB` | Soft dashboard banner (preferred over warning) |
| `text-1`–`text-3` | `#0D1B2A` / `#3D4A55` / `#6B7280` | |

**Type:** Ceoruse wordmark · Clash Display page titles · Montserrat body/UI.  
**No logo mark** — wordmark-only.  
**Radius:** buttons `md` 10 · cards `xl` 16. No teal glow. No JUO.

---

## 2. Design defaults (pending Kezie lock)

State clearly for approval; Eng ships these unless Kezie overrides.

1. **Surface = dashboard checklist card** (not a hard modal gate). First login after signup (and any session where checklist not permanently dismissed) shows the card above the DropZone / main dashboard content.
2. **Soft / dismissible.** Primary dismiss control: **I’ll do this later**. Never hard-gate the whole app. User can navigate Books / Invoices / Tax freely.
3. **Checklist items match IVA-82 Business profile fields** — **no logo item**:
   1. Legal name  
   2. Business address (line 1 + city)  
   3. Contact (email and/or phone)  
   4. Tax IDs (TIN and/or VAT) — optional  
4. **Progress** = `N of 4` where N = count of items with their “done” rule (§3). Example copy: `2 of 4 complete`.
5. **Primary CTA** = **Set up business** → opens `SettingsModal` → **Business** tab. Writes land in the same Business profile as IVA-82 (single SoT). Optional: inline mini-form on the card that writes the same keys — Design default = open Settings (reuse IVA-82 form; fewer duplicate UIs).
6. **Dismiss “I’ll do this later”** → hide checklist card for the session (or until next login — Eng: persist `checklistDismissedAt` on user/tenant). **Reappear as soft info banner** on dashboard until `legalName` is set.
7. **Permanent dismiss (complete)** when IVA-82 complete-profile rule is met: `legalName` + `addressLine1` + `city` all non-empty. Email / phone / TIN / VAT **not** required for permanent dismiss. Hide card + banner forever once complete.
8. **Logo:** **omit** from checklist. Optional footer note on card: `Logo upload coming later` (same voice as IVA-82 `biz.logo.deferred`). Do **not** count logo toward progress.
9. **Invoice Issue / Send** still follows IVA-82 gates (block without `legalName`; address incomplete = nudge). Checklist does not add new hard gates.
10. **Seed:** if signup already collected legal name / address / email, map → Business profile and pre-check matching checklist items (same as IVA-82 §8). Never seed Plot 42 / support@ivanotechnologies fixtures.

---

## 3. Checklist item → field mapping

| # | Checklist label | Done when | Required for permanent dismiss |
|---|---|---|---|
| 1 | Legal name | `legalName` non-empty | **Yes** |
| 2 | Business address | `addressLine1` **and** `city` non-empty | **Yes** |
| 3 | Contact | `email` **or** `phone` non-empty | No (recommended) |
| 4 | Tax IDs | `tin` **or** `vatNumber` non-empty | No (optional) |

**Progress formula:** `doneCount / 4` using the four rows above.  
**Permanent complete:** rows 1 + 2 done (IVA-82 complete profile). Card + soft banner never return.

**Logo:** not a row. Deferred note only.

---

## 4. Surfaces & states

### 4.1 First-login / incomplete — Checklist card (dashboard)

```
┌ Set up your business ─────────────────── 2 of 4 ── × ┐
│  Add your details so invoices show the right sender. │
│                                                      │
│  ✓  Legal name                         Done          │
│  ○  Business address                   Add           │
│  ○  Contact (email or phone)           Add           │
│  ○  Tax IDs (TIN / VAT) — optional     Add           │
│                                                      │
│  ℹ Logo upload coming later                          │
│                                                      │
│      [ I’ll do this later ]    [ Set up business ]   │
│                                 (teal primary)       │
└──────────────────────────────────────────────────────┘
```

- Placement: top of dashboard content, above DropZone / KPIs. Full width of main column; card `xl` 16.
- Progress pill: right of title; muted `surface-2` chip, `text-2`.
- Done row: forest `success` check · label strikethrough optional · “Done” muted.
- Pending row: empty circle `border` · “Add” as navy text link → same CTA as primary (opens Settings → Business).
- Optional tax row: trailing “optional” in `text-3`.
- Logo note: `surface-2` info strip — **not** a checklist row; no checkbox.
- **×** (header) = same as “I’ll do this later” (soft dismiss).
- Primary teal: **Set up business**. Secondary ghost: **I’ll do this later**.

### 4.2 Soft banner (after dismiss, legalName empty)

Info (`#2563EB`) soft banner — same voice as IVA-82 incomplete nudge:

```
ℹ  Set up your business · Add a legal name so invoices show your sender.
   [ Open Settings ]                                        [ Dismiss ]
```

- Show on dashboard (and optionally invoice editor already covered by IVA-82).
- **Dismiss** on banner = hide for session; return next login until `legalName` set.
- Once `legalName` set but address incomplete: **do not** resurrect the full checklist card; rely on IVA-82 invoice nudge + optional slim banner “Finish your address in Settings” (Design default: **omit** slim address banner on dashboard — invoice nudge is enough). Soft banner on dashboard only while `legalName` empty.

### 4.3 Complete — no card

When `legalName` + `addressLine1` + `city` set → remove checklist card and soft banner permanently. Optional one-time toast: `Business profile ready — it’ll show on invoices you send.` (nice-to-have; Eng optional).

Comp `checklist-complete.html` shows the **moment of completion** (all core items checked, progress 4 of 4 or 2+/4 with core done) for handoff clarity — production may skip this frame and just hide the card.

### 4.4 CTA target

| Action | Result |
|---|---|
| Set up business / Add / Open Settings | `SettingsModal` open → tab **Business** (IVA-82 §4) |
| I’ll do this later / × | Soft dismiss → §4.2 banner if no `legalName` |
| Save in Settings | IVA-82 validation; recompute checklist progress live when modal closes / profile updates |

No new Settings section. No new primary nav route.

---

## 5. Persistence (Eng hints)

| Flag / derived | Meaning |
|---|---|
| Business profile fields | SoT — same as IVA-82 |
| `checklistSoftDismissed` (bool or timestamp) | User chose “I’ll do this later”; hide card until next login or until fields change |
| Derived `isChecklistComplete` | `legalName && addressLine1 && city` |
| Derived `showChecklistCard` | `!isChecklistComplete && !checklistSoftDismissed` (or first-login force-show once) |
| Derived `showSoftBanner` | `!legalName && checklistSoftDismissed` (dashboard) |

Prefer derived state from profile over a separate “checklist progress” table.

---

## 6. Copy keys

| Key | String |
|---|---|
| `setup.title` | Set up your business |
| `setup.sub` | Add your details so invoices show the right sender. |
| `setup.progress` | {n} of 4 complete |
| `setup.item.legalName` | Legal name |
| `setup.item.address` | Business address |
| `setup.item.contact` | Contact (email or phone) |
| `setup.item.tax` | Tax IDs (TIN / VAT) |
| `setup.item.tax.hint` | optional |
| `setup.item.done` | Done |
| `setup.item.add` | Add |
| `setup.logo.deferred` | Logo upload coming later |
| `setup.cta.primary` | Set up business |
| `setup.cta.later` | I’ll do this later |
| `setup.banner.title` | Set up your business |
| `setup.banner.sub` | Add a legal name so invoices show your sender. |
| `setup.banner.cta` | Open Settings |
| `setup.banner.dismiss` | Dismiss |
| `setup.toast.complete` | Business profile ready — it’ll show on invoices you send. |

Voice: direct; no “AI will fill your profile”; no JUO.

Reuse IVA-82 field labels inside Settings (`biz.*`). Do not duplicate Settings form copy here.

---

## 7. Comps

| File | Shows |
|---|---|
| `comps/checklist-card.html` (+ `.png`) | Dashboard · checklist card mid-progress (e.g. 1 of 4) · DropZone behind |
| `comps/checklist-complete.html` (+ `.png`) | Optional · card with core items done / ready to dismiss permanently |

---

## 8. Acceptance criteria (IVA-84)

1. First-login (incomplete profile) shows soft dashboard checklist card — **not** a hard modal gate of the whole app.  
2. Checklist has exactly four items: Legal name · Business address · Contact · Tax IDs — **no logo row**. Optional deferred logo note OK.  
3. Progress shows `N of 4` from §3 done rules.  
4. Primary CTA opens SettingsModal → Business (IVA-82 fields / SoT).  
5. “I’ll do this later” / × soft-dismisses card; soft info banner returns on dashboard until `legalName` set.  
6. Permanent hide when `legalName` + `addressLine1` + `city` present (email optional).  
7. Does not weaken or replace IVA-82 Issue/Send gates.  
8. Option C tokens; Ceoruse wordmark; no JUO; no logo mark.  
9. Comps under `iva-84-checklist/comps/`.  
10. Spec status remains **Pending Kezie lock** until Kezie marks LOCKED.

---

## 9. Out of scope

- Logo upload / letterhead (deferred — Kezie 27 Sep)  
- Rebuilding signup / onboarding wizard IA  
- New Settings tabs beyond IVA-82 Business  
- Hard-blocking app navigation until checklist complete  
- Client checklist / “add your first client” (separate if ever needed)  
- JUO campaign · IVA-81 UBA import  
- Changing IVA-82 field model or invoice FROM/BILL TO rules  

---

## 10. Eng touchpoints (hints, not tickets)

- Dashboard: conditional checklist card + soft banner derived from Business profile + dismiss flag.  
- CTA → existing SettingsModal Business tab (IVA-82).  
- On profile save: recompute complete; if complete, clear card + banner permanently.  
- Map signup fields → profile when present (shared with IVA-82 §8).  

*Handoff: `shipping-handoff-iva84.txt`.*
