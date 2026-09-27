**Status:** LOCKED by Kezie (UX plan approved via CoS; Design defaults) · 27 Sep 2026 WAT · Handed to Shipping

# IVA-82 — Business + client profiles for personalised invoices

**Status:** Design defaults proposed · Pending Kezie lock · Ready for Shipping once approved  
**Ticket:** [IVA-82](https://linear.app/ivano-technologies/issue/IVA-82/business-client-profile-data-for-personalised-invoices)  
**Owner:** Design (Coco) → Shippie implement · CoS smokes  
**Date:** 27 Sep 2026 WAT  
**Brand:** Option C — `/workspace/kompleet-design/wave1/OPTION-C-BRAND-SYSTEM.md`  
**Shell:** Settings via `SettingsModal` — `/workspace/kompleet-design/wave2/APP-SHELL.md`  
**Invoices base:** Extend Wave 3 — `/workspace/kompleet-design/wave3/INVOICES-DROP.md` (IVA-78) — **do not redesign** New sheet from scratch  
**Related (out of scope):** IVA-81 UBA import · JUO campaign · logo mark (deferred)

---

## 0. Problem → fix

| Today (www) | After IVA-82 |
|---|---|
| Sender: static `KOMPLEET · Plot 42 Lekki · support@ivanotechnologies.com` | Sender from **Business profile** (tenant) |
| BILL TO: drop filename / draft title (e.g. “invoice drop flow”) | BILL TO from **selected Client**; filename → draft **title** / attachment name only |

---

## 1. Tokens (Option C — do not invent)

| Token | Hex | Notes |
|---|---|---|
| `bg` / `surface` / `surface-2` | `#F4F1EB` / `#FFFDF8` / `#EBE6DC` | Page / cards / muted |
| `border` / `border-hover` | `#DDD5C8` / `#C9BFAE` | |
| `primary` | `#0B3A5C` | Titles, secondary links, focus rings |
| `accent` / `accent-hover` | `#0D9488` / `#0F766E` | Primary CTA + active only |
| `success` | `#1B7A4E` | Money+ / Paid — never teal |
| `warning` / `error` | `#D97706` / `#DC2626` | Incomplete / hard errors |
| `info` | `#2563EB` | Soft nudge banners (preferred over warning for incomplete profile) |
| `text-1`–`text-3` | `#0D1B2A` / `#3D4A55` / `#6B7280` | |

**Type:** Ceoruse wordmark · Clash Display page titles · Montserrat body/UI.  
**No logo mark** (Kezie 27 Sep: “No logo for now”) — wordmark-only; teal ₦ favicon separate.  
**Radius:** buttons `md` 10 · cards `xl` 16. No teal glow.

---

## 2. Design defaults (pending Kezie lock)

State clearly for approval; Eng ships these unless Kezie overrides.

1. **Business legal name** drives invoice **sender** line 1. If empty → show product wordmark **KOMPLEET** + soft nudge to complete profile. Never invent fixture address/email.
2. **Address** is multi-line (line1 required for “complete”; line2/city/state/country optional). Display stacked on invoice.
3. **Email + phone** optional but recommended; show on sender when set.
4. **Tax IDs (NG):** `TIN` + `VAT number` — both **optional** fields. Show on invoice footer/sender meta when set (label TIN / VAT).
5. **Logo field:** **omit / deferred** — no upload, no placeholder mark on invoice.
6. **Clients:** invoice-first (combobox + inline create per IVA-78). **Also** Settings → **Clients** list for edit/delete. Prefer this over More-menu clients.
7. **BILL TO card:** client name + address lines + email (+ phone if set). **Status chip stays outside** BILL TO card (header / meta row).
8. **Drop → draft:** filename → draft **title** + attachment name. BILL TO stays blank until client picked or OCR-matched. **Never** put filename in BILL TO.
9. **Gates:** soft-block **Issue / Send** if no client. Soft-nudge (banner) for incomplete business profile before **Send / PDF** — allow **Save draft** always. Do not hard-block draft save.
10. **Onboarding:** if signup already collects legal name / address / email, map → Business profile. Else Settings is source of truth; onboarding can stay light (Eng note).

---

## 3. Data model

### 3.1 Business profile (tenant / workspace)

One record per tenant. Editable in Settings → Business profile.

| Field | Key | Required for “complete” | Required to save | Notes |
|---|---|---|---|---|
| Legal name | `legalName` | Yes | Soft (can save empty → incomplete) | Invoice sender line 1 |
| Address line 1 | `addressLine1` | Yes | No | Street / plot |
| Address line 2 | `addressLine2` | No | No | Suite / landmark |
| City | `city` | Yes* | No | *for complete |
| State | `state` | No | No | e.g. Lagos |
| Country | `country` | Default `NG` | No | Default Nigeria |
| Email | `email` | Recommended | No | Business contact |
| Phone | `phone` | Recommended | No | E.164 or local NG |
| TIN | `tin` | No | No | Optional NG tax ID |
| VAT number | `vatNumber` | No | No | Optional |
| Logo | — | — | — | **Deferred — omit UI** |

**Complete profile** = `legalName` + `addressLine1` + `city` all non-empty.  
**Incomplete** → show nudge banner on invoice editor / before Send·PDF (see §7).

**Seed:** map from onboarding/signup when those keys exist. Never seed Plot 42 Lekki / support@ivanotechnologies.com fixtures.

### 3.2 Client

| Field | Key | Required | Notes |
|---|---|---|---|
| Name | `name` | Yes | BILL TO line 1 |
| Address line 1 | `addressLine1` | No (recommended) | Extend IVA-78 inline create |
| Address line 2 | `addressLine2` | No | |
| City | `city` | No | |
| State | `state` | No | |
| Country | `country` | Default `NG` | |
| Email | `email` | No | IVA-78 already |
| Phone | `phone` | No | IVA-78 already |

**Invoice attachment:** `invoice.clientId` → Client. BILL TO renders from client snapshot at Issue time (Eng: freeze copy on Issue so later client edits don’t rewrite issued PDFs — recommended). Drafts may live-bind.

### 3.3 Drop filename rule

| Source | Maps to |
|---|---|
| Uploaded file name (sans ext) | Draft **title** + attachment display name |
| OCR client name (if confidence high + match) | Prefill client select |
| OCR client name (no match) | Leave BILL TO empty; offer **Create “{name}”** |
| No OCR / stub | BILL TO empty; title from filename |

**Forbidden:** `billTo.name = filename`.

---

## 4. Settings — Business profile

**Surface:** `SettingsModal` section — **not** a new primary nav route (APP-SHELL.md).

### 4.1 Modal IA (extend existing)

```
Settings
├── Profile / Account        (existing)
├── Business profile         ← NEW (this ticket)
├── Clients                  ← NEW list (this ticket)
├── … existing sections …
```

Tab/section order: put **Business profile** near top (after Account). **Clients** immediately after Business profile.

### 4.2 Business profile layout

```
┌ Settings ──────────────────────────────────────── × ┐
│  [Account]  [Business]  [Clients]  …                 │
│                                                      │
│  Business profile                                    │
│  Shown on invoices and documents you send.           │
│                                                      │
│  Legal name *                                        │
│  [ Lekki Crafts Ltd                              ]   │
│                                                      │
│  Address                                             │
│  [ Plot 14 Admiralty Way, Lekki Phase 1          ]   │
│  [ (optional line 2)                             ]   │
│  [ City            ] [ State         ] [ NG      ]   │
│                                                      │
│  Contact                                             │
│  [ Email                     ] [ Phone           ]   │
│                                                      │
│  Tax IDs (optional)                                  │
│  [ TIN                       ] [ VAT number      ]   │
│                                                      │
│  ℹ Logo upload coming later — invoices use your      │
│    legal name only for now.                          │
│                                                      │
│                         [ Cancel ]  [ Save ]  teal   │
└──────────────────────────────────────────────────────┘
```

**Validation on Save**
- Trim whitespace; empty strings → null.
- Email format if non-empty.
- Phone: soft (allow NG local or +234).
- TIN / VAT: free text; no hard format gate in IVA-82.
- Allow save with incomplete fields → toast “Saved — add address to finish your invoice header” if incomplete.

**No logo upload control** (omit). Optional one-line deferred note OK.

---

## 5. Settings — Clients list

**Default (Design):** Settings → **Clients** for browse/edit; create remains invoice-first.

```
┌ Clients ─────────────────────────────────────────────┐
│  Clients                          [ + New client ]   │
│  Search [                    ]                       │
│                                                      │
│  Name              Email              City           │
│  Blue Harbour…     ap@blueharbour.ng  Lagos     ›    │
│  …                                                   │
│                                                      │
│  Empty: “No clients yet — create one when you        │
│  issue an invoice, or add here.”                     │
└──────────────────────────────────────────────────────┘
```

- **+ New client** / row click → side sheet or inline form with full client fields (§3.2).
- Delete: confirm; block delete if client has issued invoices (Eng: soft-disable + “Used on invoices”) — or allow with orphan warning; **Design default:** allow delete only if zero issued; else archive/hide. Eng picks; Design prefers soft-hide.
- Does **not** replace IVA-78 inline create on New sheet.

### 5.1 Extend IVA-78 inline create fields

Keep sheet pattern. Extend mini form:

| Field | Required |
|---|---|
| Client name | Yes |
| Email | No |
| Phone | No |
| Address line 1 | No (new) |
| City | No (new) |

Full address (line2/state/country) available in Settings client edit + Full form BILL TO editor. Quick create stays short.

---

## 6. Invoice draft editor — sender + BILL TO

Extend existing `/invoices/[id]` draft view / preview. Do not rebuild New sheet chrome.

### 6.1 Header meta (outside cards)

```
INV-2026-0001          [ Draft ]     ← status chip HERE, not inside BILL TO
Title: invoice drop flow             ← from drop filename (editable)
```

### 6.2 Sender block (FROM)

```
┌ FROM ─────────────────────────────────────────────┐
│  Lekki Crafts Ltd                                 │
│  Plot 14 Admiralty Way, Lekki Phase 1             │
│  Lagos, NG                                        │
│  billing@lekkicrafts.ng  ·  +234 801 234 5678     │
│  TIN 01234567-0001                                │
│                                    [ Edit in Settings ]  (text link, navy)
└───────────────────────────────────────────────────┘
```

| Profile state | Render |
|---|---|
| Complete | Legal name + address + contact + tax IDs as set |
| Legal name only | Name; omit empty lines; show incomplete banner |
| Empty | Product wordmark **KOMPLEET** (Ceoruse uppercase) + banner “Add your business details” |

Never show fixture Plot 42 / support@ivanotechnologies.com.

### 6.3 BILL TO block

```
┌ BILL TO ──────────────────────────────────────────┐
│  [ Client combobox: search / + Create client ]    │  ← edit mode
│                                                   │
│  Blue Harbour Hotels Ltd                          │  ← after select
│  22 Adeola Odeku Street                           │
│  Victoria Island, Lagos, NG                       │
│  ap@blueharbour.ng                                │
└───────────────────────────────────────────────────┘
```

- Empty: dashed highlight + copy “Select or create a client” + combobox focus.
- Status chip **never** inside this card.
- Drop path: start empty even if title = filename.

### 6.4 Paths wiring

| Path | Sender | BILL TO |
|---|---|---|
| (A) Drop | Business profile | Blank until match/pick; title = filename |
| (B) Quick create | Business profile | Customer combobox (required for Issue) |
| (C) Full form | Business profile | Same client picker + address fields |

---

## 7. Empty / incomplete states

### 7.1 Incomplete business profile

**Where:** Invoice draft editor (top of preview), and optionally Settings Business tab badge.

**Banner (info / soft):**
- Icon + `Add your business details` · link **Settings** (opens SettingsModal → Business profile).
- Sub: `Your name and address appear on PDFs you send.`
- **Save draft:** always enabled.
- **Issue / Send / Download PDF:** show banner; **Design default = soft-nudge** (button stays enabled with confirm toast “Send without full business address?”) — Eng may choose soft-disable Issue until `legalName` set; **minimum bar:** require `legalName` for Issue/Send; address incompleteness = nudge only.

**Design lock for Shippie:**
1. No `legalName` → **block** Issue / Send (tooltip: add business name in Settings). PDF download same.
2. Has `legalName` but missing address/city → **nudge banner only**; Issue/Send/PDF allowed.
3. Save draft never blocked by profile.

### 7.2 Missing client

- Highlight BILL TO card (border `warning` or navy focus ring + dashed).
- Copy: `Select a client before issuing`.
- **Save draft:** allowed without client.
- **Issue / Send:** **blocked** until `clientId` set (harder than business address — client is identity of the doc).

### 7.3 Copy keys

| Key | String |
|---|---|
| `biz.title` | Business profile |
| `biz.sub` | Shown on invoices and documents you send. |
| `biz.legalName` | Legal name |
| `biz.address` | Address |
| `biz.address2` | Address line 2 (optional) |
| `biz.city` | City |
| `biz.state` | State |
| `biz.country` | Country |
| `biz.email` | Email |
| `biz.phone` | Phone |
| `biz.tin` | TIN |
| `biz.vat` | VAT number |
| `biz.logo.deferred` | Logo upload coming later — invoices use your legal name only for now. |
| `biz.save` | Save |
| `biz.nudge.title` | Add your business details |
| `biz.nudge.sub` | Your name and address appear on PDFs you send. |
| `biz.nudge.cta` | Open Settings |
| `biz.block.legalName` | Add your business name in Settings before issuing |
| `biz.toast.savedIncomplete` | Saved — add address to finish your invoice header |
| `clients.title` | Clients |
| `clients.new` | New client |
| `clients.empty` | No clients yet — create one when you issue an invoice, or add here. |
| `clients.search` | Search clients |
| `inv.billto.label` | BILL TO |
| `inv.billto.empty` | Select or create a client |
| `inv.billto.required` | Select a client before issuing |
| `inv.from.label` | FROM |
| `inv.from.edit` | Edit in Settings |
| `inv.from.fallback` | KOMPLEET |
| `inv.drop.titleFromFile` | (use filename as draft title — no separate string) |

Voice: direct; no “AI will fill your profile”.

---

## 8. Onboarding note (Eng)

| If onboarding collects… | Action |
|---|---|
| Business / company name | → `legalName` |
| Address / city | → address fields |
| Business email / phone | → contact fields |
| Nothing business-related | Settings is SoT; keep onboarding light — **no IVA-82 scope to rebuild onboarding** |

Do not block first invoice on completing onboarding wizard.

---

## 9. Comps

| File | Shows |
|---|---|
| `comps/settings-business-profile.html` (+ `.png`) | SettingsModal · Business profile filled (NG SME) |
| `comps/invoice-preview-personalised.html` (+ `.png`) | Draft preview · real FROM + BILL TO |
| `comps/invoice-billto-empty.html` (+ `.png`) | Missing client nudge + incomplete-profile banner optional |

---

## 10. Acceptance criteria (IVA-82)

1. SettingsModal has **Business profile** with fields in §3.1 (no logo upload).  
2. SettingsModal has **Clients** list; edit does not remove IVA-78 inline create.  
3. Inline client create includes optional **address line 1 + city** (extend, don’t redesign sheet).  
4. Invoice FROM block reads Business profile; empty legal name → KOMPLEET + nudge; **no** Plot 42 / support@ivanotechnologies fixtures.  
5. BILL TO reads selected Client; drop filename never becomes BILL TO (title/attachment only).  
6. Save draft allowed with missing client and/or incomplete profile.  
7. Issue/Send blocked without client; Issue/Send blocked without `legalName`; address incomplete = banner nudge only.  
8. Status chip remains outside BILL TO card.  
9. Option C tokens; wordmark-only; no JUO; IVA-81 untouched.  
10. Comps present under `iva-82-profiles/comps/`.

---

## 11. Out of scope

- IVA-81 UBA / bank statement import  
- Logo mark / upload / invoice letterhead image  
- JUO campaign surfaces  
- Rebuilding New invoice sheet IA (IVA-78)  
- Multi-currency / multi-entity tenants  
- Client portal / public pay page redesign  
- Hard TIN/VAT format validation against FIRS  
- Changing NRS Issue / QR / PDF pipeline beyond header data source  
- New primary nav route for Settings or Clients  

---

## 12. Eng touchpoints (hints, not tickets)

- Tenant `BusinessProfile` (or workspace settings) CRUD + SettingsModal section.  
- Client model: add address fields if missing; Settings list page/section.  
- Invoice render / PDF template: replace fixtures with profile + client.  
- Drop intake: map filename → `title` only; clear any current bill-to-from-filename bug.  
- Gate Issue/Send on `clientId` + `legalName`.  

*Handoff: `shipping-handoff-iva82.txt`.*
