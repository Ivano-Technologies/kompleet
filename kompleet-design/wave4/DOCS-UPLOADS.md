# Wave 4 — Docs / uploads (Shipping-ready)

**Status:** LOCKED by Kezie 27 Sep 2026 WAT · Handed to Shipping
**Ticket:** IVA-75 (child of IVA-71)  
**Status:** Design pack · Ready for Shipping · 27 Sep 2026 WAT  
**Surfaces:** `/documents` hub · attach sheet from Books / Invoices / Expenses detail · More menu entry  
**Brand:** Option C — `/workspace/kompleet-design/wave1/OPTION-C-BRAND-SYSTEM.md`  
**Workflow:** `/workspace/kompleet-design/wave2/WORKFLOW-SIMPLIFICATION.md` §3 (pick-and-drop)  
**Shell:** Wave 2 LOCKED — Dashboard · Books · Invoices · Tax · More (do **not** add Docs as a 6th primary)  
**Drop language:** Wave 2 `DASHBOARD-DROPZONE` + Wave 3 `IMPORT-AUTO` / `INVOICES-DROP` (dashed strip/hero, teal drag-over only, Choose file tertiary)

**Happy path:** More → Documents → drop PDF/image/CSV → file lands in library; attach to txn / invoice / expense from row or from money-surface detail — no wizard walls.  
**Storage:** **Convex file storage** (not Supabase). Eng wires `storageId` + metadata table; UI never mentions Supabase.

**Out of scope:** JUO · Wave 1–3 locks (do not edit) · sidebar redesign · bank-statement Import (owned by Books/Dashboard DropZone) · invoice OCR create (IVA-78) · logo squircle.

---

## 1. IA — where Docs lives (Design lock)

### Decision: Documents hub under More (not primary nav)

| Option | Verdict |
|---|---|
| **A — More → Documents → `/documents` hub** | **SHIP THIS.** Keeps primary nav at 5. Matches Wave 2 “More for secondary.” Docs is a library, not a daily money door. |
| B — 6th primary “Documents” | Reject. Bloates shell; fights Wave 2 ≤5 lock. |
| C — Only attach drawers, no hub | Reject. Users need a place to find, preview, delete unattached files. |

**Nav update (additive only to More — do not touch primary five):**

| Label | Route | Placement |
|---|---|---|
| **Documents** | `/documents` | More flyout — **first row** (above Expenses), Lucide `FolderOpen` or `Files` |
| Mobile More sheet | same | Same order |

When a Documents child route is active: highlight **More** in sidebar + mark Documents in the flyout (Wave 2 active rule).

**Do not** put Upload / Review / Duplicates under Documents — those stay Books-owned.

### Relationship to money paths

| Surface | Docs role |
|---|---|
| Dashboard / Books DropZone | Still **statements only** (CSV/XLS/PDF → books). Not a general file dump. |
| Invoices drop | Still **create-draft** path (IVA-78). Created attachment also appears in Documents library. |
| Expenses / txn detail | **Attach** existing or drop new → link to that record |
| Documents hub | Library of all uploads: filter, preview, attach, delete |

Rule: dropping a **bank statement** on Dashboard/Books never becomes a bare Documents row without going through Import AUTO. Dropping a **generic** PDF/image/CSV on Documents stores the file; user may later Attach to a record. Optional Eng: if file looks like a statement, soft toast “Looks like a bank statement — Import to Books?” with one tap (taste Q1 — not blocking).

---

## 2. Tokens & spacing

Same Option C set as Waves 2–3:

| Token | Hex | Use |
|---|---|---|
| `bg` | `#F4F1EB` | Page canvas |
| `surface` | `#FFFDF8` | Cards, list, sheet, drop |
| `surface-2` | `#EBE6DC` | Drop idle / preview chrome |
| `border` / `border-hover` | `#DDD5C8` / `#C9BFAE` | |
| `primary` | `#0B3A5C` | Titles, secondary links, focus rings |
| `accent` / `accent-hover` | `#0D9488` / `#0F766E` | Primary CTA + drop **drag-over** only |
| `success` | `#1B7A4E` | Success toast — never teal |
| `warning` / `error` | `#D97706` / `#DC2626` | |
| `text-1` / `text-2` / `text-3` | `#0D1B2A` / `#3D4A55` / `#6B7280` | |

**Type:** Clash Display 24 page title · Montserrat UI 14 / meta 12.  
**Radius:** drop `rounded-xl` (16) · buttons `rounded-md` (10) · sheet `rounded-xl`.  
**Shadows:** `shadow-1` quiet; **no** teal glow.  
**Space:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48.

---

## 3. Documents hub — empty state

**Route:** `/documents`  
**Title:** Documents  
**Header CTA:** **Upload** (teal) → focuses hero / opens file picker (same accept set).

```
[ Documents ]                    [ Upload (primary teal) ]

┌─────────────────────────────────────────────────────────────┐
│                     LARGE DROP HERO                         │
│         (min-height ~320–400px, full content width)         │
│   Lucide Upload / stacked-docs in navy · not teal-filled    │
│   “Drop PDF, image, or CSV”                                 │
│   “Attach to a transaction, invoice, or expense anytime.”   │
│   [ Choose file ]  tertiary                                 │
└─────────────────────────────────────────────────────────────┘

No empty-table walls. No multi-step “upload wizard.”
Optional one-liner: “Bank statements? Drop them on Books or Dashboard.”
```

**Chrome (match Wave 2/3 DropZone):**
- `bg-surface`, dashed `2px` `#DDD5C8`, hover `#C9BFAE`, drag-over: border `#0D9488` + `bg-accent/5`.
- Click hero = file picker.
- Accept: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.csv` (+ `.xlsx` / `.xls` optional for receipt exports — Design default **include** for parity with Books).
- Max size / count: Eng policy; UI shows clear error toast on reject.

**Mobile:** hero ~240px; Upload full-width under title; pad for bottom nav.

---

## 4. Documents hub — list + drop strip

When `files.length > 0`:

```
[ Documents ]     [ Upload (primary) ]

┌ SLIM DROP STRIP ────────────────────────────────────────────┐
│ ⬆  Drop PDF, image, or CSV                  [ Choose file ] │
└─────────────────────────────────────────────────────────────┘

Filters:  All · PDF · Images · CSV · Attached · Unattached
Search:   filename / linked record (optional Wave 4.1)

┌ List ───────────────────────────────────────────────────────┐
│ 📄  GTB_Sept_receipt.pdf     PDF · 240 KB · 26 Sep          │
│     Linked: Expense · Generator fuel          [Preview][⋯]  │
│ 🖼  invoice-scan.jpg         Image · 1.1 MB · 25 Sep        │
│     Unattached                                [Attach][⋯]   │
│ 📑  clients.csv              CSV · 18 KB · 24 Sep           │
│     Unattached                                [Attach][⋯]   │
└─────────────────────────────────────────────────────────────┘
```

**Row actions**
| Action | Behavior |
|---|---|
| Click row / **Preview** | Opens preview pane or lightbox (§6) |
| **Attach** | Opens **Attach sheet** (§5) — primary when unattached |
| **⋯** menu | Attach · Download · Delete |
| Linked chip | Navigates to txn / invoice / expense detail |

**Strip:** Reuse DropZone chrome (`strip` / `compact` variant of a shared `FileDropZone` — distinct from `StatementDropZone` accept set, same visual language). Place **above** filters/list (Design default, matches Books).

**Upload behavior**
1. Drop/choose → upload **immediately** to Convex storage — no type wizard, no “what is this?” wall.  
2. Inline progress on strip/hero (filename + %).  
3. Success toast: **“{filename} uploaded”** + soft **Attach** link (opens sheet for that file).  
4. Stay on `/documents`.  
5. Failure → error toast + retry.

---

## 5. Attach sheet

Triggered by: Documents row **Attach** · detail-page **Attach file** on Books txn / Invoice / Expense · toast soft link after upload.

```
┌ Attach file ─────────────────────────────────────── × ┐
│                                                       │
│  File                                                 │
│  📄  invoice-scan.jpg · Image · 1.1 MB                │
│                                                       │
│  Link to                                              │
│  ( ) Transaction    ( ) Invoice    ( ) Expense        │
│                                                       │
│  Search  [  type to find…                          ]  │
│  ┌ results ───────────────────────────────────────┐   │
│  │ Transfer to MTN  ·  ₦12,500  ·  22 Sep         │   │
│  │ POS — Shoprite   ·  ₦45,200  ·  21 Sep         │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  Or drop another file to replace / add                │
│  ┌ compact drop ──────────────────────────────────┐   │
│  │ Drop PDF, image, or CSV          [ Choose ]    │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│              [ Cancel ]              [ Attach ] teal  │
└───────────────────────────────────────────────────────┘
```

**Rules**
- Sheet max-width ~560–640px · `rounded-xl` · scrim `bg-black/50` (match IVA-78).  
- **Link to** radio defaults: if opened from txn detail → Transaction preselected + record locked; from Documents → Transaction default, user picks.  
- Search required when record not pre-locked; empty search shows recent 5 of that type.  
- One primary link per attach action (Wave 4: single parent). Multi-link later if needed.  
- **Attach** disabled until a record is selected (unless opened with record locked).  
- Success: toast **“Attached to {record label}”** · close sheet · refresh chips.  
- Cancel / Esc closes without upload loss (file already in library if from Docs).

**From money surfaces (detail header secondary):**
- Label: **Attach file** (outline). Opens same sheet with type + record locked; user drops or picks from **Recent uploads** list (last 10) above the compact drop.

---

## 6. Preview & delete

### Preview
- PDF: in-app iframe / PDF.js panel (right split on `lg+`, full-sheet on mobile).  
- Image: lightbox centered on scrim.  
- CSV: simple table preview (first ~50 rows) or download-only if Eng capacity tight — **Design default: table preview**.  
- Chrome: filename · type · size · uploaded date · linked chip · **Download** · **Attach/Change link** · **Delete**.  
- Focus ring navy; close × top-right.

### Delete
- Confirm dialog (not toast-only): **“Delete {filename}?”** · body: “This removes the file from Documents. Links on transactions / invoices / expenses are cleared.”  
- Actions: **Cancel** (outline) · **Delete** (`error` fill or outline-error — **not** teal).  
- Success toast: **“{filename} deleted”**.  
- Convex: delete storage blob + metadata row; Eng owns orphan cleanup.

---

## 7. Types, storage, Eng hooks

### File metadata (Convex — conceptual)

| Field | Notes |
|---|---|
| `_id` | Doc id |
| `storageId` | Convex `_storage` id |
| `filename` | Original name |
| `contentType` | mime |
| `size` | bytes |
| `uploadedAt` | ms |
| `uploadedBy` | user id |
| `orgId` / `workspaceId` | tenancy |
| `linkType` | `transaction` \| `invoice` \| `expense` \| `null` |
| `linkId` | target id or null |
| `source` | `documents` \| `invoice_drop` \| `expense_attach` \| … |

### Accept MIME / extensions

| Kind | Extensions |
|---|---|
| PDF | `.pdf` |
| Image | `.png` `.jpg` `.jpeg` `.webp` |
| Spreadsheet / CSV | `.csv` `.xlsx` `.xls` |

Reject others with toast: **“Use PDF, image, or CSV.”**

### APIs (Eng shapes — Design-agnostic names)

- `generateUploadUrl` → client PUT to Convex storage  
- `saveFileMetadata` after upload  
- `listFiles` (filters) · `getFile` · `getFileUrl`  
- `attachFile({ fileId, linkType, linkId })` · `detachFile`  
- `deleteFile` (storage + metadata)

**Do not** call Supabase Storage. Kill any leftover “Hosted on Supabase” copy (Wave 1 brand kill list).

### Shared components

| Component | Role |
|---|---|
| `FileDropZone` | variants `hero` \| `strip` \| `compact` — Docs accept set |
| `StatementDropZone` | unchanged — Books/Dashboard only |
| `AttachFileSheet` | §5 |
| `FilePreview` | §6 |

---

## 8. Copy strings (lock)

| Key | String |
|---|---|
| `docs.title` | Documents |
| `docs.cta.upload` | Upload |
| `docs.empty.title` | Drop PDF, image, or CSV |
| `docs.empty.sub` | Attach to a transaction, invoice, or expense anytime. |
| `docs.empty.choose` | Choose file |
| `docs.empty.hint` | Bank statements? Drop them on Books or Dashboard. |
| `docs.strip.title` | Drop PDF, image, or CSV |
| `docs.strip.choose` | Choose file |
| `docs.filter.all` | All |
| `docs.filter.pdf` | PDF |
| `docs.filter.images` | Images |
| `docs.filter.csv` | CSV |
| `docs.filter.attached` | Attached |
| `docs.filter.unattached` | Unattached |
| `docs.row.unattached` | Unattached |
| `docs.row.attach` | Attach |
| `docs.row.preview` | Preview |
| `docs.row.download` | Download |
| `docs.row.delete` | Delete |
| `docs.toast.uploaded` | {filename} uploaded |
| `docs.toast.attachCta` | Attach |
| `docs.toast.attached` | Attached to {record} |
| `docs.toast.deleted` | {filename} deleted |
| `docs.toast.reject` | Use PDF, image, or CSV. |
| `docs.progress` | Uploading… |
| `docs.attach.title` | Attach file |
| `docs.attach.linkTo` | Link to |
| `docs.attach.txn` | Transaction |
| `docs.attach.invoice` | Invoice |
| `docs.attach.expense` | Expense |
| `docs.attach.search` | Type to find… |
| `docs.attach.cancel` | Cancel |
| `docs.attach.confirm` | Attach |
| `docs.attach.drop` | Drop PDF, image, or CSV |
| `docs.delete.title` | Delete {filename}? |
| `docs.delete.body` | This removes the file from Documents. Links on transactions, invoices, or expenses are cleared. |
| `docs.delete.confirm` | Delete |
| `docs.more.label` | Documents |
| `docs.detail.cta` | Attach file |

Voice: direct, Nigerian-market; no “AI document vault” hype; no Supabase mention.

---

## 9. Routes

| Route | Role |
|---|---|
| `/documents` | Hub — empty hero or list + strip |
| Sheet (modal) | Attach file |
| Preview | Pane / lightbox (no dedicated URL required; optional `/documents/[id]` deep link) |
| More → Documents | Entry from shell |

Deep links from money detail stay on existing `/transactions/[id]`, `/invoices/[id]`, `/expenses/[id]` with Attach CTA.

---

## 10. Acceptance (IVA-75)

1. Documents reachable from **More → Documents** only — **not** a new primary nav item; primary remains Dashboard · Books · Invoices · Tax · More.  
2. Empty hub = large drop hero; accept PDF / image / CSV; upload starts immediately (no wizard).  
3. Populated hub = slim drop strip above list + filters (All / PDF / Images / CSV / Attached / Unattached).  
4. Attach sheet links file to Transaction · Invoice · Expense (search or pre-locked from detail).  
5. Preview for PDF / image / CSV; Delete confirms and clears links.  
6. Storage is **Convex** — no Supabase storage path or copy.  
7. Drop chrome matches Wave 2/3 language (dashed warm border, teal drag-over only, Choose file tertiary).  
8. Option C tokens; teal only on Upload/Attach primary + drag-over; forest for success toasts; no lime/amber/Inter/emoji/teal glow.  
9. Comps present: `wave4/comps/docs-empty.png`, `docs-list-drop.png`, `docs-attach-sheet.png`.

*Comps: `wave4/comps/docs-empty.png`, `docs-list-drop.png`, `docs-attach-sheet.png` (+ `.html` sources).*
