# Expense Tracking & Receipt OCR — Final PRD and Execution Plan

**Product:** Expense Tracking & Receipt OCR (Easy Expense–Style)  
**Platform:** Kompleet Web + Mobile (Mobile-first priority)  
**Market:** Nigeria  
**Document:** Combined PRD + Execution Plan (download-ready)

---

# PART 1 — FINAL PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Product Overview

### What We Are Building

A mobile-first expense tracking system inside Kompleet that allows Nigerian users to:

- Scan receipts
- Automatically extract expense data via AI OCR
- Categorize expenses
- Track mileage
- Generate reports (PDF/CSV/Excel)
- Sync securely across devices
- Operate offline-first

### Target Users

- Nigerian SMEs
- Freelancers
- Field workers
- Individuals tracking household expenses

### Core Problem

Nigerian users struggle with:

- Lost receipts
- Manual Excel tracking
- Low data connectivity
- Tax/VAT documentation for SMEs
- Battery drain on low-end Android devices

### Core User Flow

**Scan receipt → Auto-extract → Review/edit → Categorize → Sync → Export report**

---

## 2. Market & Localization Requirements (Nigeria-Specific)

| Area | Requirement |
|------|-------------|
| **Currency & Categories** | Default currency: ₦ (Naira). Preloaded categories: Transport (okada, fuel), Airtime/Data, Market/Inventory, VAT (7.5%), Utilities, Logistics, Office Supplies. |
| **Offline-First** | All features must work offline: Scan, Save, Edit, Queue sync. Sync happens automatically when network is restored. |
| **Language** | English (default). Architecture must support adding Nigerian Pidgin, Hausa. |

---

## 3. Personas (Operational Context)

| Persona | Context |
|---------|---------|
| **Chidi – SME Owner** | Android 10, low data. Wants VAT-ready expense records. Mostly offline during workday. |
| **Aisha – Freelancer** | Mid-range Android/iPhone. Wants client reimbursement records. Needs PDF exports. |
| **Emeka – Field Worker** | Low-end Android. GPS mileage tracking. Battery sensitive. |
| **Fatima – Individual** | Household expenses. Simple UI. Budget awareness (future phase). |

---

## 4. Functional Requirements (Implementation-Level)

### 4.1 Receipt Scanning (AI OCR)

- Camera capture
- Auto-crop + perspective correction
- OCR extracts: Vendor, Date, Amount, VAT (if present)
- Manual override UI
- Works offline (queue OCR if needed)
- Edge cases: Blurry images → manual fallback; Low light → prompt retry

### 4.2 Expense Logging

- Manual entry
- OCR-generated entry
- Edit/Delete
- Notes
- Category assignment
- Attach receipt image

### 4.3 Mileage Tracking

- GPS-based mileage tracking
- Manual entry fallback
- Battery-efficient polling

### 4.4 Reports & Exports

- Time range selection
- Export formats: PDF, CSV, Excel
- Share via: Email, WhatsApp, Download

### 4.5 Cloud Sync

- Multi-device sync
- Conflict resolution: last-write-wins
- Manual “Sync now” button
- Auto-sync on connectivity

### 4.6 Team Sharing (Phase 2)

- Business workspace
- Shared expenses
- Permissions: Viewer, Editor

### 4.7 Authentication

- Email/password
- Local passcode
- Biometric (if device supports)

---

## 5. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| Offline | 100% usable offline |
| Performance | OCR < 2 seconds |
| Battery | <5% drain per hour active use |
| Devices | Android 8+, 2GB RAM |
| Sync | <10 seconds |
| Accessibility | Large text, screen readers |
| Dark Mode | Required |

---

## 6. UX / UI Requirements

- **Navigation:** Bottom tabs — Home, Scan, Reports, Settings
- **Onboarding:** Demo scan, First expense, First export
- **Trust UX:** NDPR compliance notice, “Your data is encrypted” badge, Offline indicator

---

## 7. Data Model (PRD)

```
User {
  id, email, locale, created_at
}

Expense {
  id, user_id, date, amount, currency, category_id, vendor,
  vat_amount, receipt_image_url, notes, created_at, updated_at, synced_at
}

Category {
  id, name, is_custom
}

Report {
  id, user_id, start_date, end_date, export_format
}
```

**Storage:** Local: SQLite. Cloud: Supabase. OCR: On-device ML Kit + server fallback.

---

## 8. Security & NDPR Compliance

- AES-256 encryption at rest
- TLS in transit
- Explicit consent for: Scanning, Cloud sync, Data deletion
- CSV export for portability

---

## 9. Monetization

- **Free:** Scan + manual logs + export
- **Premium:** Teams, Cloud sync, Mileage tracking. Nigerian payments: Paystack, Flutterwave.

---

## 10. MVP vs Phase 2

| Phase 1 (MVP) | Phase 2 |
|---------------|---------|
| Scan, OCR, Log, Offline, Export, Sync | Teams, Biometric auth, Advanced analytics |

---

## 11. Definition of Done (PRD)

- Users can scan receipts offline
- Expenses sync across devices
- Exports work on mobile
- NDPR consent enforced
- App passes Play Store review
- No regression in existing Kompleet flows

---

# PART 2 — EXECUTION PLAN

## Execution Mode

- **Sprint-based, production quality, no placeholders, no stubs**
- **Platform priority:** React Native Mobile App, then Next.js Web App

---

## Current State (Kompleet Codebase)

- **Repo:** Single Next.js app at root; no React Native or Expo. Auth and data via Supabase; existing tables: `transactions` (bank-linked), `categories`, `profiles`, `invoices`, `financial_statements`; storage: `bank-statements`, `documents`. No `expenses` table, no `receipts` bucket, no NDPR consent table, no offline layer.
- **Auth:** Supabase Auth + cookie-based session. NDPR is a badge only; no consent capture or storage.

---

## Architecture (Target)

```
┌─────────────────────────────┐
│     Mobile App (NEW)        │
│  React Native / Expo        │
│  • Camera Capture           │
│  • Offline SQLite Store     │
│  • OCR Queue (Offline)      │
│  • Sync Engine              │
└──────────────┬──────────────┘
               │ HTTPS (JWT)
┌──────────────▼──────────────┐
│      Next.js Web (EXTEND)   │
│  • Expense UI               │
│  • Reports & Export          │
│  • Admin / Teams             │
└──────────────┬──────────────┘
               │ Supabase Client
┌──────────────▼─────────────────────────┐
│              Supabase                   │
│  • Auth (Email/Password)                 │
│  • Postgres (Expenses, Categories, …)   │
│  • RLS Policies                         │
│  • Storage (Receipts)                   │
│  • Edge Functions (OCR fallback, etc.)  │
└──────────────┬─────────────────────────┘
               │
   ┌───────────▼───────────┐   ┌─────────────────────┐
   │ On-device OCR (ML Kit)│   │ Server OCR Fallback │
   └───────────────────────┘   └─────────────────────┘
```

---

## Repo and App Structure

- **Mobile (new):** Add `apps/mobile` at repo root — Expo (SDK 52+) with React Native, TypeScript strict. Keep Next.js at root.
- **Shared (optional):** `packages/shared` for types (Expense, Category, Report, SyncPayload) and Nigerian defaults.
- **Web:** New routes under `src/app/(dashboard)/expenses/*`, `src/app/(dashboard)/reports/expense-reports/*`, and `src/app/api/expenses/*`, `src/app/api/expense-reports/*`. Reuse existing Supabase and auth; no breaking changes to existing transaction/category/dashboard.

---

## Sprint 1 – Core Data Model & Offline Engine

### Deliverables

- Expense, Category, Report schemas (Supabase + SQLite)
- SQLite offline storage layer
- Sync queue engine with conflict resolution
- NDPR consent flow
- Encryption at rest + in transit
- Local cache + sync triggers

### Supabase Schema + RLS Policies (COPY & PASTE)

**Enable Extensions**

```sql
create extension if not exists "uuid-ossp";
```

**Tables**

```sql
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  date date not null,
  amount numeric not null,
  currency text default 'NGN',
  category_id uuid,
  vendor text,
  vat_amount numeric default 0,
  receipt_url text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  synced_at timestamp with time zone
);

create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  name text not null,
  is_custom boolean default true,
  created_at timestamp with time zone default now()
);

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  start_date date not null,
  end_date date not null,
  format text check (format in ('pdf','csv','excel')),
  created_at timestamp with time zone default now()
);

create table public.ndpr_consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  consent_scan boolean default false,
  consent_cloud_sync boolean default false,
  consent_timestamp timestamp with time zone default now()
);
```

**RLS Policies**

```sql
alter table public.expenses enable row level security;
alter table public.categories enable row level security;
alter table public.reports enable row level security;
alter table public.ndpr_consents enable row level security;

-- Expenses
create policy "Users can view own expenses"
on public.expenses for select
using (auth.uid() = user_id);

create policy "Users can insert own expenses"
on public.expenses for insert
with check (auth.uid() = user_id);

create policy "Users can update own expenses"
on public.expenses for update
using (auth.uid() = user_id);

create policy "Users can delete own expenses"
on public.expenses for delete
using (auth.uid() = user_id);

-- Categories
create policy "Users can view own categories"
on public.categories for select
using (auth.uid() = user_id or user_id is null);

create policy "Users can manage own categories"
on public.categories for all
using (auth.uid() = user_id);

-- Reports
create policy "Users can manage own reports"
on public.reports for all
using (auth.uid() = user_id);

-- NDPR Consents
create policy "Users manage own consents"
on public.ndpr_consents for all
using (auth.uid() = user_id);
```

**Storage Policies (Receipts)**

Create bucket `receipts` in Supabase Dashboard (private), then:

```sql
create policy "Users can upload receipts"
on storage.objects for insert
with check (
  bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view receipts"
on storage.objects for select
using (
  bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
);
```

**Implementation notes**

- **Expenses:** Use `receipt_url` for Supabase Storage path or URL after upload (e.g. `{user_id}/{uuid}.jpg`).
- **Categories:** Seed Nigerian defaults (Transport, Airtime/Data, Market/Inventory, VAT 7.5%, Utilities, Logistics, Office Supplies) with `user_id = null`, `is_custom = false`. Custom: `user_id = auth.uid()`, `is_custom = true`.
- **NDPR:** On Accept, set `consent_scan = true`, `consent_cloud_sync = true`, `consent_timestamp = now()`.
- **Note:** If existing Kompleet `public.categories` table exists for bank transactions, use a different table name (e.g. `expense_categories`) or schema to avoid clash.

### Mobile App Bootstrap

- Create `apps/mobile` with Expo (tabs or blank). Dependencies: `expo-sqlite`, `@supabase/supabase-js`, `expo-secure-store`, `expo-camera` / `expo-image-picker`, `react-native-vision-camera` (Sprint 2), `@react-native-ml-kit/text-recognition` (Sprint 2).
- SQLite: tables `expenses` (plus `sync_status`, `local_id`), `categories` cache, `ocr_queue`, `sync_queue`. On expense insert/update/delete, enqueue sync.

### Sync Engine (Mobile)

- Drain `sync_queue` when online; push to Supabase (insert/update/delete). Last-write-wins using `updated_at` / `synced_at`. Pull: fetch `expenses` where `updated_at > last_synced_at`; merge into SQLite; update `last_synced_at`.

### NDPR Consent Flow

- First launch or first scan/sync: show consent modal. On Accept, insert/update `ndpr_consents` (`consent_scan`, `consent_cloud_sync`, `consent_timestamp`). Block camera and sync until consent.

### Encryption

- In transit: HTTPS (Supabase). At rest (mobile): `expo-secure-store` for tokens; optionally encrypted SQLite or document “sensitive in SecureStore, expense data in SQLite.”

---

## Sprint 2 – Receipt Scanning & OCR

### Deliverables

- Camera capture UI
- Auto-crop and perspective correction
- OCR pipeline: on-device ML Kit + server fallback
- Manual correction UI
- Low-light & blurry handling
- Queued OCR when offline

### Implementation

- **Camera:** `expo-image-picker` or `react-native-vision-camera`. Save to temp file → OCR or queue.
- **OCR:** `@react-native-ml-kit/text-recognition`; parse with regex (amount ₦, date DD/MM/YYYY, vendor). Server fallback: Edge Function or Next.js API calling Cloud Vision.
- **Manual correction:** Form pre-filled with extracted fields; save to SQLite and enqueue sync.
- **Low light/blur:** Check brightness; toast “Poor lighting” or allow manual entry. Optional blur check.
- **Offline:** Save image path to `ocr_queue`; process when online (OCR → upload receipt → save expense).

---

## Sprint 3 – Expense Management UX

### Deliverables

- Expense list UI
- Edit/Delete flows
- Category system (Nigerian defaults + custom)
- Offline indicators
- Trust UX (encryption + NDPR badges)

### Implementation

- **Mobile:** List from SQLite (date desc); pull-to-refresh sync; detail → edit/delete; category picker from cached `categories`.
- **Web:** `src/app/(dashboard)/expenses/page.tsx` and `expenses/[id]`; fetch from Supabase; filters (date, category).
- **Offline:** Banner when offline; “Pending sync” per item.
- **Trust:** “Your data is encrypted”, “NDPR compliant” in Settings/first-run.

---

## Sprint 4 – Reports, Export & Sync

### Deliverables

- PDF, CSV, Excel export
- Time range filtering
- Share via WhatsApp/email
- Manual and auto sync
- Sync conflict resolution UI

### Implementation

- **Web:** `src/app/(dashboard)/reports/expense-reports/page.tsx`; time range + format; API builds file (reuse existing report/export patterns); download or temp URL.
- **Mobile:** Export via web in browser or native share (API + expo-sharing). Time range in all list/export views.
- **Sync:** “Sync now” button; auto-sync on foreground/NetInfo online; show last synced time. Conflict: optional “Keep mine” / “Keep server” UI.

---

## Sprint 5 – Mileage + Premium Readiness

### Deliverables

- GPS mileage tracker (battery efficient)
- Premium gating logic
- Team workspace scaffolding
- Paystack/Flutterwave billing hooks (disabled until legal review)

### Implementation

- **Mileage:** `expo-location` (low accuracy/significant-change); start/end trip; compute distance; save as expense (category Mileage).
- **Premium:** Use `profiles.subscription_tier`; gate teams, sync, mileage; free = scan + manual + export; premium = teams, full sync, mileage. Return 402 when limit exceeded.
- **Teams:** Schema `workspaces`, `workspace_members`; optional `workspace_id` on expenses; APIs and UI stubs.
- **Billing:** Stub routes/functions “disabled until legal review”; no real charges.

---

## Engineering Constraints

| Constraint | Approach |
|------------|----------|
| Offline-first | SQLite + sync queue; write local first; sync when online |
| Android 8+ | Target SDK in Expo; avoid higher API-only APIs |
| Low memory | Stream/resize images; avoid loading full receipt in memory |
| Battery efficient | Sync on foreground/resume; location significant-change |
| NDPR | Consent table + UI; data deletion flow |
| Strict TypeScript | `strict: true`; shared or duplicated types |
| No breaking changes | New tables/routes only; existing flows unchanged |

---

## Quality Bar

- **Testing:** Unit tests for sync, OCR parsing, API handlers; E2E for offline→sync and export on mobile where feasible.
- **Performance:** OCR <2s; sync <10s; no crashes on 2GB RAM Android.
- **Documentation:** API docs, data model doc, sync logic doc.

---

## Definition of Done (Recap)

- Users can scan receipts offline
- Expenses sync across devices
- Exports work on mobile
- NDPR consent enforced
- App passes Play Store review
- No regression in existing Kompleet flows

---

## File / Area Map

| Area | Location |
|------|----------|
| Supabase migration | `supabase/migrations/YYYYMMDD_expense_tracking.sql` |
| Mobile app | `apps/mobile/` |
| Shared types (optional) | `packages/shared/src/types/` |
| Web expense pages | `src/app/(dashboard)/expenses/*`, `reports/expense-reports/*` |
| Web expense API | `src/app/api/expenses/*`, `src/app/api/expense-reports/*` |
| NDPR consent API | `src/app/api/ndpr-consent/*` or auth/onboarding |
| Edge Functions | `supabase/functions/ocr-fallback`, `export-pdf` (if used) |
| Receipt storage | Supabase bucket `receipts` + RLS |

---

## Risks and Mitigations

- **OCR on Nigerian receipts:** Test with real receipts; tune regex; use server fallback for poor quality.
- **Encrypted SQLite on RN:** If no stable solution, document SecureStore for tokens + SQLite for expense data; defer full-disk encryption if needed.
- **Monorepo:** pnpm workspaces; CI runs web and mobile tests/builds.

---

*End of document. Save or download this file as needed.*
