**Status:** LOCKED by Kezie (UX plan approved via CoS; Design defaults) · 27 Sep 2026 WAT · Handed to Shipping

**Status:** Design draft · Pending Kezie lock · 27 Sep 2026 WAT · Design (Coco)

# IVA-85 — Review triage: banner → actionable exception list (Shipping-ready)

**Ticket:** [IVA-85](https://linear.app/ivano-technologies/issue/IVA-85/review-triage-banner-actionable-exception-list) (High)  
**Extends (do not rewrite happy path):**  
- `/workspace/kompleet-design/wave3/IMPORT-AUTO.md` (IVA-77) — AUTO drop → books; Review = exceptions  
- `/workspace/kompleet-design/wave2/DASHBOARD-DROPZONE.md` (IVA-76) — Dashboard banner host  
- `/workspace/kompleet-design/wave2/APP-SHELL.md` (IVA-80) — Review demoted from sidebar  
- `/workspace/kompleet-design/wave2/WORKFLOW-SIMPLIFICATION.md` — pick-and-drop; Review = exceptions  
**Brand:** Option C — `/workspace/kompleet-design/wave1/OPTION-C-BRAND-SYSTEM.md`  
**Surfaces:** Dashboard · Books (`/transactions`) — same banner + triage sheet  

**Problem:** Banner “{N} need a quick check” today points at a sequential Review wizard / dead-end page. Users who land there stall. Review must be an **exception triage** with one clear action per row — not a graveyard.

**Design owns:** banner → sheet IA, row anatomy, reason chips, primary actions, empty/mobile rules, comps, copy keys.  
**Eng owns:** queue query (uncategorised / duplicate-suspect / low-confidence), action APIs (categorise / confirm / ignore + undo), count for banner.  
**Never mix JUO.** No logo mark. Keep AUTO happy path unchanged.

---

## 1. Tokens (reuse Option C)

| Token | Hex / value | Use |
|---|---|---|
| `warning` | `#D97706` | Banner left bar, icon, chip outline for caution |
| `warning-soft` | `rgba(217,119,6,0.10)` | Banner fill (`bg-warning/10`) |
| `warning-border` | `rgba(217,119,6,0.35)` | Banner border |
| `primary` | `#0B3A5C` | Sheet title, secondary buttons, focus rings |
| `accent` | `#0D9488` | **One** primary CTA fill per row / sheet footer only |
| `surface` | `#FFFDF8` | Sheet panel, row cards, toast |
| `bg` | `#F4F1EB` | Page behind sheet |
| `surface-2` | `#EBE6DC` | Chip fill (neutral), hover row |
| `border` | `#DDD5C8` | Sheet / row borders |
| `text-1` / `text-2` / `text-3` | `#0D1B2A` / `#3D4A55` / `#6B7280` | Title / body / meta |
| `success` | `#1B7A4E` | Money-in amounts only (not action colour) |
| `error` | `#DC2626` | Not used on triage (failures stay IVA-83) |

**Type:** Montserrat — banner 13/14 · sheet title 18 semibold · row merchant 14 semibold · meta 12 · CTA 13 semibold.  
**Radius:** banner `rounded-xl` (16) · sheet desktop `rounded-2xl` (20) · rows `rounded-xl` · chips `rounded-full` · buttons `rounded-md` (10).  
**Icon:** Lucide `AlertTriangle` (banner) · reason chips text-only or tiny Lucide — **never emoji**.

---

## 2. Product rule (lock)

> **Banner opens triage. Triage is a list with actions. Review is not a destination page you “finish.”**

| Today (anti-pattern) | Ship (IVA-85) |
|---|---|
| Banner CTA **Review** → `/transactions/review` sequential wizard | Banner click → **triage sheet/panel** over current page |
| Card-by-card skip/apply loop | Flat list · one primary action visible per row |
| Review as implied mandatory post-import | Exception path only; happy path stays on Books |
| Sidebar child “Review” | Still **absent** (Wave 2 lock) |

**Deep link:** Keep `/transactions/review` as optional URL that **renders the same triage UI** (list + sheet chrome), not the old wizard. Prefer opening sheet from Dashboard/Books with `?triage=open` or local state — Eng choice; UX is sheet-first.

**Duplicates:** Duplicate-suspect rows may appear **in this triage list** (reason chip). Dedicated Duplicates resolve page can remain for bulk merge later — do not force a second banner hop for every suspect. Optional second banner line “{D} possible duplicates · Resolve” (IMPORT-AUTO) may still deep-link duplicates page; triage list also includes `Duplicate suspect` rows when Eng feeds them.

---

## 3. Banner (Dashboard + Books)

### Placement
- **Dashboard:** below TopBar / above DropZone hero or slim strip (same slot as IMPORT-AUTO / DASHBOARD-DROPZONE exception banner).
- **Books:** below page header / above drop strip + filters.
- Show when `needsCheckCount > 0` where  
  `needsCheckCount = uncategorised + lowConfidence + duplicateSuspect` (Eng may expose one aggregated count or sum client-side).
- **Hide entirely when N = 0** (no empty banner, no “All clear” chrome).

### Anatomy

```
┌ EXCEPTION BANNER ─────────────────────────────────────────────┐
│ ⚠  {N} need a quick check                    [ Review ]       │
└───────────────────────────────────────────────────────────────┘
```

| Prop | Spec |
|---|---|
| Fill | `warning-soft` |
| Border | `1px warning-border` · optional `4px` left bar `warning` |
| Icon | Lucide `AlertTriangle` 18px `warning` |
| Copy | **“{N} need a quick check”** — N is integer; pluralisation: `1 needs` / `{N} need` (lock: keep **“{N} need a quick check”** for all N ≥ 1 for simplicity, matching IMPORT-AUTO — Eng may use ICU later) |
| CTA | Outline button **Review** — `bg-surface` · border `border` · text `primary` · **not teal** |
| Hit target | Entire banner row clickable **or** CTA only — Design default: **whole banner** opens triage (CTA is visual affordance) |
| Stacking | If duplicates also shown as second line, keep Review line primary; Resolve remains secondary text button |

### Forbidden
- Teal fill on Review CTA  
- Auto-opening triage after import success (toast soft-link only)  
- Banner when N = 0  
- Navigating to a wizard that hides Books behind a dead-end

---

## 4. Triage sheet / panel

### Desktop (`lg+`)
- Right **panel** or centered **sheet** over current route (Dashboard or Books stay dimmed underneath).
- Width: `480–560px` side panel **or** `640px` centered modal sheet — **Design default: right drawer `520px`**, full viewport height, `surface` fill, left shadow.
- Scrim: `bg-black/40`.
- Close: ✕ · Esc · scrim click (no destructive discard — open actions already committed or not).

### Mobile (`<lg`)
- **Full-screen sheet** (slide up from bottom or replace main).
- Safe-area padding; sticky header with title + Close.
- Bottom safe padding under list.

### Header

| Element | Spec |
|---|---|
| Title | **Quick check** |
| Sub | **{N} to review** · `text-3` 12px |
| Close | Icon button navy focus |

### Body
Scrollable list of exception rows (§5). Empty state inside sheet should not appear in normal flow (banner gone when N=0); if race: “You’re all caught up” + Close.

### Footer (optional tertiary bulk)
- Only when ≥1 `Low confidence` row remains:  
  text button **Ignore all low-confidence** — `text-3`, underline on hover, **not** teal, **not** primary.
- Confirm via tiny confirm popover: “Ignore {K} low-confidence items?” · **Ignore** / Cancel.
- No bulk Categorise / Confirm in Wave — too error-prone.

---

## 5. Row anatomy

```
┌ ROW ──────────────────────────────────────────────────────────┐
│  Merchant / description                         −₦12,450.00   │
│  12 Sep 2026 · POS TRANSFER                     [chip]        │
│                                         [ Primary action ]    │
└───────────────────────────────────────────────────────────────┘
```

| Field | Spec |
|---|---|
| Merchant / description | `text-1` 14 semibold · truncate 1 line · title-case from bank string when possible |
| Amount | Right-aligned tabular · debit `text-1` with leading `−` · credit `success` with `+` · ₦ formatting |
| Date | `text-3` 12 · e.g. `12 Sep 2026` |
| Bank meta (optional) | `text-3` 12 · truncated raw narration snippet after · |
| Reason chip | Pill — see §6 |
| Primary action | **One** visible button per row — see §7 |

**Density:** comfortable — padding `14px 16px`; gap between rows `8px`.  
**Hover:** `surface-2` fill subtle.  
**Focus:** navy ring on action button.

---

## 6. Reason chips (lock)

Exactly one chip per row (highest severity if multiple signals — Eng order):

| Reason | Chip label | Chip style | Typical primary action |
|---|---|---|---|
| Uncategorised | **Uncategorised** | `surface-2` fill · `text-2` · border `border` | **Categorise** |
| Duplicate suspect | **Duplicate suspect** | `warning-soft` fill · `warning` text · border `warning-border` | **Confirm** (keep) — secondary menu may offer “Open duplicates” |
| Low confidence | **Low confidence** | `warning-soft` fill · `warning` text · border `warning-border` | **Confirm** (accept suggestion) |

Chip copy is title case as above. Do not invent “Needs review” / “AI unsure”.

**Suggested category (uncategorised / low confidence):** when Eng has a suggestion, show under meta as muted line: `Suggested: Office supplies` — does not replace the chip.

---

## 7. Primary actions (one per row)

| Action | When shown | Behavior |
|---|---|---|
| **Categorise** | Uncategorised (default) | Opens **category picker** popover/sheet (existing categories list + search). On pick → apply category, remove row, decrement N, toast optional “Categorised as {Cat}” with **Undo**. |
| **Confirm** | Low confidence **or** Duplicate suspect | Commits current suggestion / marks not-duplicate (Eng semantics). Row removes. Toast “Confirmed” + **Undo**. |
| **Ignore** | Available on all reasons as alternate — **visible as primary only when** Eng marks row as ignorable-default (prefer: show Ignore as the primary for Low confidence if no trustworthy suggestion; otherwise Confirm primary + Ignore in ⋯) | **Design default visible primary map:** Uncategorised → Categorise · Low confidence → Confirm · Duplicate suspect → Confirm. **Ignore** always available via row ⋯ menu **and** as secondary text button inline on Low confidence. |

### Lock — visible primary (ship this)

| Reason | Visible primary | Secondary (text / ⋯) |
|---|---|---|
| Uncategorised | **Categorise** (teal fill) | Ignore |
| Low confidence | **Confirm** (teal fill) | Ignore |
| Duplicate suspect | **Confirm** (outline navy — keep both) | Ignore · View duplicate |

**Ignore:** removes from triage queue without changing category (or soft-dismisses exception flag — Eng). Always show **Undo** toast 5s: “Ignored · **Undo**”.

**Do not** show three equal teal buttons on one row. One primary only.

### Category picker (Categorise)
- Popover anchored to button (desktop) / half-sheet (mobile).
- Search field + list of categories (Books categories source).
- Optional “Create category” tertiary — out of scope if Categories CRUD is heavy; link to `/categories` as last resort.
- Esc / tap outside closes without apply.

---

## 8. Counts, empty, success loops

| State | UI |
|---|---|
| N > 0 | Banner visible · sheet lists N rows |
| User clears one row | Row animates out · header “{N} to review” updates · banner N updates live |
| N → 0 | Banner **unmounts** · if sheet open: empty “You’re all caught up” · auto-close sheet after 1.2s **or** leave Close — Design default: show empty + Close (no surprise dismiss mid-click) |
| Undo | Restores row + increments N + banner returns |

---

## 9. Copy strings (lock)

| Key | String |
|---|---|
| `banner.review` | {N} need a quick check |
| `banner.reviewCta` | Review |
| `triage.title` | Quick check |
| `triage.sub` | {N} to review |
| `triage.empty` | You’re all caught up |
| `triage.close` | Close |
| `chip.uncategorised` | Uncategorised |
| `chip.duplicate` | Duplicate suspect |
| `chip.lowConfidence` | Low confidence |
| `row.suggested` | Suggested: {Cat} |
| `action.categorise` | Categorise |
| `action.confirm` | Confirm |
| `action.ignore` | Ignore |
| `action.viewDuplicate` | View duplicate |
| `bulk.ignoreLow` | Ignore all low-confidence |
| `bulk.ignoreLowConfirm` | Ignore {K} low-confidence items? |
| `toast.categorised` | Categorised as {Cat} |
| `toast.confirmed` | Confirmed |
| `toast.ignored` | Ignored |
| `toast.undo` | Undo |
| `picker.search` | Search categories |
| `picker.empty` | No categories match |

Voice: direct, Nigerian-market, ₦ amounts, no “AI-powered”, no JUO.

### Forbidden copy
| Do not ship | Why |
|---|---|
| “Review queue” / “Inbox zero for books” | Jargon / cute |
| “AI isn’t sure” | AI hype |
| “Skip” as primary | Prefer Ignore with undo |
| “Fix later” with no action | Dead end |

---

## 10. Interaction flow (canonical)

```
Dashboard / Books
  └─ Banner “12 need a quick check”  [click]
       └─ Triage sheet opens (right drawer / full-screen)
            ├─ Row Uncategorised → Categorise → picker → apply → undo toast
            ├─ Row Low confidence → Confirm → undo toast
            ├─ Row Duplicate suspect → Confirm (or View duplicate)
            ├─ Ignore (any) → undo toast
            └─ Tertiary: Ignore all low-confidence (confirm)
  └─ When N=0 → banner gone
```

Post-import toast soft link **Fix {N} uncategorized** (IMPORT-AUTO) → **opens same triage sheet** (not wizard).

---

## 11. Engineering touchpoints

- Replace Review wizard UX at `/transactions/review` with triage list (or redirect sheet host).
- Shared `NeedsCheckBanner` on Dashboard + Books.
- Shared `TriageSheet` component (drawer + mobile full-screen).
- APIs: list exceptions · categorise · confirm · ignore · undo · optional bulk ignore-low.
- Count subscription for live banner N.
- Do not re-add Review to sidebar.
- Do not change AUTO happy path / DropZone success.

---

## 12. Acceptance (IVA-85)

1. Banner shows only when N > 0 with copy “{N} need a quick check” and outline **Review** CTA (not teal).  
2. Clicking banner (or toast Fix link) opens triage sheet/panel — **not** a dead wizard page.  
3. Each row shows merchant · amount · date · reason chip · **one** primary action.  
4. Uncategorised → Categorise opens category picker; Confirm / Ignore work with Undo toasts.  
5. Bulk “Ignore all low-confidence” is tertiary only (with confirm).  
6. N → 0 removes banner; mobile uses full-screen sheet.  
7. Option C tokens; no JUO; no logo mark; Review stays out of primary nav.

---

## 13. Open for Kezie (non-blocking for Eng scaffold)

- Right drawer `520px` vs centered `640px` sheet on desktop — **Design default: right drawer**.  
- Whether Duplicate suspect Confirm = “keep both” vs jump to merge UI — **Design default: Confirm = keep both; View duplicate secondary**.  
- Plural “1 need” vs “1 needs” — **Design default: keep IMPORT-AUTO “{N} need a quick check”**.

---

*Comps: `comps/banner-to-list.html` (+png) · `comps/row-actions.html` (+png).*
