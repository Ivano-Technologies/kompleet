# Expense Tracking – Final Release & QA Checklist

Use this before merging all sprint branches into `main` (or `release/expense-v1`) and before Play Store submission.

---

## 🔄 Release state (Claude ↔ Cursor sync)

**Single source of truth.** You (or Claude) update the status below. Cursor fixes only what is flagged; Cursor does not push to `main`, run production EAS builds, or submit to Play Store without explicit GO from Claude.

| Phase | Description | Status | Notes |
|-------|-------------|--------|--------|
| **Phase 0** | Env readiness (EAS login, app.json version/versionCode, env vars) | ✅ | EAS login ✅ · Project linked (`5a45be5b`) ✅ · Supabase env vars ✅ |
| **Phase 1** | Pre-build gates (lint, tests, secrets scan, debug flags) | ✅ | Cursor: mobile lint + 55 expense tests pass. |
| **Phase 2** | Staging / preview build (`eas build --profile preview`) | 🔄 IN PROGRESS | Release branch creation started. |
| **Phase 3** | QA (install, smoke tests, Play checklist) | ⏳ | |
| **Phase 4** | Prod build + Play Store | 🚫 BLOCKED until Claude GO | Cursor does not run prod build or submit |

**Current mobile app (for reference):**

- **Branch (mobile work):** `feat/expense-sprint-5-mileage-premium-teams` → merging to `release/expense-v1`
- **App name:** Kompleet Platform (`apps/mobile/app.json`)
- **Version:** `0.1.0`, **versionCode:** `1`
- **Android package:** `com.kompleet.platform` · **iOS bundle:** `com.kompleet.platform`
- **EAS owner:** `ivano-technologies` · **Project ID:** `5a45be5b-d2df-407e-ae5f-73098fd334ae`
- **EAS profiles:** `preview` → internal APK · `production` → AAB. Run: `cd apps/mobile && eas build --profile preview`

**Sprint branch audit (git — confirmed):**
- `feat/expense-sprint-1-core-model-offline` → same SHA as `main` — skip (empty)
- `feat/expense-sprint-2-ocr-pipeline` → same SHA as `main` — skip (empty)
- `feat/expense-sprint-3-expense-ux` → 1 commit ahead of `main` ✅ (contains all Sprints 1–4 code)
- `feat/expense-sprint-4-reports-export-sync` → same commit as sprint-3 — skip (redundant)
- `feat/expense-sprint-5-mileage-premium-teams` → 2 commits ahead of `main` ✅

**Phase 2 merge sequence:** `main` → merge sprint-3 → merge sprint-5 → `release/expense-v1`

**Cursor’s remit during release:**

- Fix build/lint/test errors that block a gate.
- Apply version/versionCode bumps and EAS config changes when asked.
- Remove or guard debug flags when flagged.
- Resolve merge conflicts on release/hotfix branches only.
- Do **not** push to `main`, trigger production EAS build, or submit to Play Store unless Claude explicitly green-lights the phase.

---

## 0️⃣ Pre-Merge Verification Commands

Run these to verify expense-related code before merge. Use when full-repo lint/typecheck have pre-existing issues.

| Check | Command | Notes |
|-------|---------|--------|
| **Branch naming** | `git branch --show-current` | Must match `feat/expense-sprint-{n}-*` |
| **Lint (mobile)** | `pnpm eslint apps/mobile --max-warnings 0` | Expense mobile app only |
| **Lint (expense API)** | `pnpm eslint src/app/api/expenses src/lib/expense-ocr src/lib/expense-premium --max-warnings 0` | Expense web API + libs |
| **Web build** | `pnpm build` | Next.js production build |
| **Tests (expense)** | `pnpm test tests/expense-sprint1.test.ts tests/expense-sprint2.test.ts tests/expense-sprint3.test.ts tests/expense-sprint4.test.ts tests/expense-sprint5.test.ts tests/expense-ocr-parsing.test.ts tests/expense-sync.test.ts --run` | All expense tests |
| **Mobile build** | `cd apps/mobile && npx expo prebuild && npx expo run:android` | Requires Android SDK / emulator (or use EAS build) |

**Known pre-existing issues (non-expense):**

- `pnpm typecheck`: may fail in `src/__tests__/transaction-import/pdf-parser.test.ts` (pdf-parse types). Fix or exclude for expense release.
- `pnpm lint --max-warnings 0`: full repo has ~50 warnings (unescaped entities, setState-in-effect, etc.) in other areas. Expense + mobile lint clean.

**Launch preparation (done on `feat/expense-sprint-5-mileage-premium-teams`):**

- [x] Expense mobile lint fixes (unescaped entities, NDPR effect, logger).
- [x] Expense tests updated (Sprint 3 regex for `from("expenses")`).
- [x] No secrets in expense API or mobile expense code.
- [x] Pre-merge verification commands added above; run before merge.

---

## 1️⃣ Final Release Checklist (Single Merge Window → main)

### 🔐 Pre-Merge (Per Sprint Branch)

- [ ] Branch naming matches: `feat/expense-sprint-{n}-*`
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] Web build passes: `pnpm build`
- [ ] Mobile build passes: `expo prebuild && expo run:android` (or EAS build)
- [ ] Supabase migrations applied locally without errors
- [ ] RLS policies verified (cannot read others’ expenses)
- [ ] No secrets committed
- [ ] Feature flags / premium gates work
- [ ] Offline → online sync tested
- [ ] OCR happy path + failure fallback tested
- [ ] Exports (PDF/CSV/Excel) generated successfully

### 🧪 Integration (on release/expense-v1)

- [ ] Merge all sprint branches into `release/expense-v1`
- [ ] Resolve conflicts only on release branch
- [ ] Run full CI
- [ ] Manual QA on:
  - [ ] Android APK (low-end device/emulator)
  - [ ] Web staging
- [ ] Run Supabase migrations on staging
- [ ] Smoke test critical flows:
  - [ ] Login
  - [ ] NDPR consent
  - [ ] Scan → OCR → Save
  - [ ] Offline → Sync
  - [ ] Export

### 🚀 Production Release

- [ ] Merge `release/expense-v1` → `main`
- [ ] Tag release: `expense-v1.0.0`
- [ ] Deploy web
- [ ] Generate Play Store release build
- [ ] Backup Supabase
- [ ] Monitor logs (OCR, sync, exports)

---

## 2️⃣ QA Test Plan (Per Sprint)

### Sprint 1 – Core Model & Offline

**Must Pass**

- [ ] Create expense offline → sync when online
- [ ] Edit expense offline → sync updates
- [ ] Delete expense offline → sync delete
- [ ] RLS blocks access to other users’ data
- [ ] NDPR consent blocks camera + sync
- [ ] No crash on Android 8 / 2GB RAM

### Sprint 2 – OCR

**Must Pass**

- [ ] Clear Nigerian receipt → OCR extracts amount/date/vendor
- [ ] Blurry receipt → manual fallback works
- [ ] Offline scan → queued OCR → processed on reconnect
- [ ] Receipt image uploads to Supabase Storage
- [ ] Low-light warning shown

### Sprint 3 – Expense UX

**Must Pass**

- [ ] List loads from SQLite instantly
- [ ] Edit/Delete reflects after sync
- [ ] Nigerian default categories visible
- [ ] Offline banner + “pending sync” shown
- [ ] Trust UX badges visible

### Sprint 4 – Reports & Sync UX

**Must Pass**

- [ ] Export PDF/CSV/Excel on web
- [ ] Export on mobile (share/download)
- [ ] Manual “Sync now” works
- [ ] Last synced time updates
- [ ] Conflict UI shows correct options

### Sprint 5 – Mileage & Premium

**Must Pass**

- [ ] Start/stop trip saves mileage expense
- [ ] Battery drain acceptable
- [ ] Premium gating blocks gated features
- [ ] Teams schema migration runs cleanly
- [ ] Billing hooks disabled (no accidental charges)

---

## 3️⃣ Google Play Store Submission Checklist (OCR + Receipts App)

### 📦 App & Build

- [ ] App ID stable
- [ ] App name + description updated
- [ ] Version code bumped
- [ ] Release keystore secure
- [ ] No debug logs
- [ ] No test endpoints in prod

### 🔐 Permissions

- [ ] Camera permission explained in-app
- [ ] Storage permission justified
- [ ] Location permission (for mileage) disclosed
- [ ] Privacy Policy URL added to Play Console
- [ ] Data Safety form completed:
  - [ ] Camera
  - [ ] Images
  - [ ] Location
  - [ ] Financial info

### 🛡 Privacy & Compliance

- [ ] NDPR consent implemented
- [ ] Privacy policy mentions:
  - [ ] OCR
  - [ ] Receipt storage
  - [ ] Cloud sync
  - [ ] Data deletion
- [ ] “Delete account” flow implemented
- [ ] No sensitive data in logs

### 📸 Store Listing

- [ ] Screenshots (Home, Scan, OCR, Reports)
- [ ] Feature graphic
- [ ] Short description (80 chars)
- [ ] Full description
- [ ] Test account for review (if auth-gated)

### 🧪 Final QA

- [ ] Fresh install → onboarding works
- [ ] OCR demo works
- [ ] Offline mode tested
- [ ] No crash on Android 8
- [ ] Network drop does not crash app

---

*Sprint branches: `feat/expense-sprint-1-core-model-offline`, `feat/expense-sprint-2-ocr-pipeline`, `feat/expense-sprint-3-expense-ux`, `feat/expense-sprint-4-reports-export-sync`, `feat/expense-sprint-5-mileage-premium-teams`.*
