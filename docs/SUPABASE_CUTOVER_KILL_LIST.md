# Supabase cutover kill-list (by domain)

**Audience:** Kezie (go), CoS (cutover / teardown), Shipping (eng)  
**Verified against:** `staging` @ `881b2dd` (Phase 2 #97) plus Phase 3 remaining-APIs cutover.  
**Phase 3:** remaining web APIs + orphan invoice libs moved to Convex. Documents/workers, mobile, shim delete, and schema-missing domains stay leftover.

Related: [convex-migration-plan.md](./convex-migration-plan.md) (IVA-60 inventory), [convex-auth-storage.md](./convex-auth-storage.md) (Auth + Storage already moved), [convex-backfill.md](./convex-backfill.md).

**Scale (this tip):** Phase 3 in-scope web APIs + invoice libs are on Convex. Leftover SB APIs: schema-missing Phase 3 OUT (AI/ML/feedback, deadlines/reminders, notifications, migration), documents/workers, money-path leftovers (tx `upload`/`export`/`duplicates`, expenses `export`/`ocr`), keep-alive `health/db`. Root deps: `@supabase/ssr`, `@supabase/supabase-js`. Mobile dep: `@supabase/supabase-js`.

---

## 1. Status / constraints

| Item | Status |
| --- | --- |
| Auth + Storage | Already on Convex. PRs [#93](https://github.com/Ivano-Technologies/kompleet/pull/93) (path B app DB), [#94](https://github.com/Ivano-Technologies/kompleet/pull/94) (Auth + Storage), [#95](https://github.com/Ivano-Technologies/kompleet/pull/95) (`POST /api/auth` JSON). |
| Prod `NEXT_PUBLIC_CONVEX_URL` | **Stays OFF** until Kezie go. Staging / preview may already point at Convex. |
| e2e | Advisory (`continue-on-error`). **Not a merge blocker.** |
| Security advisors | Do **not** bump `scripts/security-advisor-baseline.json` from leftover-strip PRs. Pre-existing red vs live `frlcvkmjuhnjcicwywrh`. Dedicated CoS follow-up. |
| Supabase project | `frlcvkmjuhnjcicwywrh`. **No pause / delete** until the strip is live on staging **and** CoS + Kezie go. Keep-alive is `GET /api/health/db` → Supabase `tax_rules`. |
| Convex deployment | `shiny-cricket-316` (`techivano` / `kompleet` / `dev/main`). Develop with `npx convex dev`. Never `npx convex deploy` from this work. |

### CoS staging smoke (money path)

| Check | Result |
| --- | --- |
| Session | **PASS** |
| Tx / Invoices nav | **PASS** |
| CSV upload | **FAIL** — `POST /api/transactions/upload-v2` → **400** `"No valid transactions found"` |

**Flag `src/app/api/transactions/upload-v2` as a Phase 2 / money-path verification + fix target** even though the route is already on Convex. It is **not** a leftover Supabase route.

Code check on this tip (`b3633c732`):

- Route uses `requireAuthedConvex`, `api.imports.*`, `api.transactions.createManyMine` / `listMine`, `uploadToConvexStorage`. **No** `getSupabaseForRequest` / `@/lib/supabase` / `@supabase/*` import.
- Parser stack (`src/lib/transaction-import/*`) has **no** Supabase imports. No silent SB fallback in the handler.
- Browser UI (`src/components/transaction-upload.tsx`) only `fetch("/api/transactions/upload-v2")`. **No `convex.*` in the browser is expected** — Convex mutations run server-side via `ConvexHttpClient`. Absence of browser Convex calls does not mean a Supabase path.
- The 400 body is returned when `parseBankStatement` yields `transactions.length === 0` (then `imports.updateSession` status `failed`). That is parser/validation, not an auth or store cutover miss.
- Legacy `POST /api/transactions/upload` **is** still on Supabase; the live upload page does **not** call it.

Phase 2 must: (1) confirm Convex-only persist on a passing CSV, (2) fix or explain parser/bank-code/`bankCode` validation so a known-good statement imports, (3) prove the handler never falls back to Supabase.

### Already Convex (do not list as still on Supabase)

- Invoice **CRUD APIs** (`src/app/api/invoices/**`)
- Expense **CRUD + categories** (`expenses/route`, `expenses/[id]`, `expenses/categories`)
- Transaction **list / [id] / import-history**
- Transaction **`upload-v2`** — Convex-only persist, but **Phase 2 money-path verify/fix** (CoS smoke FAIL above). Do not recut to Supabase.
- Login / signup / `/api/auth` (Convex Auth)
- `change-password` → `api.accounts.changePassword`
- `delete-account` → `api.users.softDeleteMine` (Convex-only; comment says it does not pause/delete the SB project)

`convex/` already has: `transactions`, `expenses`, `invoices`, `imports`, `exports`, `categories`, `tenancy`, `users`, `accounts`, `files`, `documents`, `audit`, `tax`, `health`, `backfill`, `reports`, `forms`, `year`.

### Split-brain

Leftover routes still auth + read/write Postgres. After #93–#95, live web CRUD writes go to Convex. Leftovers therefore see stale or empty Supabase rows and often still call `supabase.auth.getUser()`, which does not see Convex Auth cookies.

---

## 2. Cutover matrix by domain

Columns: **Domain** | **Still on Supabase (paths)** | **Target Convex module (propose names)** | **Strategy** | **Risk** | **Kill-order**

Kill-order is the suggested sequence **inside Phase 2+** (see §6). Dual-write then cut for the money path; cutover OK for low-traffic after soak.

| Domain | Still on Supabase (paths) | Target Convex module | Strategy | Risk | Kill-order |
| --- | --- | --- | --- | --- | --- |
| **transactions leftovers (4)** | `transactions/upload` (legacy, unused by live UI), `transactions/export`, `transactions/duplicates`, `export/transactions` | Existing `convex/transactions.ts` + `convex/imports.ts` + `convex/exports.ts` | Dual-write then cut | **High** — list/create is Convex; these four still hit SB | **1** |
| **upload-v2 (already Convex)** | Not on SB. `src/app/api/transactions/upload-v2` — CoS smoke **400** `"No valid transactions found"`. Server-side Convex only; no SB fallback in code. | Existing `convex/imports.ts` + `convex/transactions.ts` + `convex/files.ts`. Parser: `src/lib/transaction-import/*` | **Verify/fix** (not a recut). Confirm Convex persist + parser/validation; prove no SB fallback | **High** — money-path upload is the live import | **1** (Phase 2 money path) |
| **expenses leftovers (2)** | `expenses/export`, `expenses/ocr` | Existing `convex/expenses.ts`. OCR auth → `requireAuthedConvex` | Dual-write then cut | **High** (export split-brain). OCR is SB auth only | **2** |
| **mobile** | `apps/mobile/lib/supabase/client.ts`; `receipt-upload.ts` (Storage bucket `receipts`); `sync/sync-engine.ts` (`expenses` table); `app/(tabs)/index.tsx` sync; `app.config.ts` `EXPO_PUBLIC_SUPABASE_*`; `apps/mobile/package.json` `@supabase/supabase-js` | Propose `apps/mobile/lib/convex/client.ts`. Reuse `convex/expenses.ts` + `convex/files.ts` | Dual-write then cut (sync/storage with expense leftovers) | **High** (field devices) | **2** (sync/storage) then **10** (dep drop) |
| **reports / exports (7 APIs + 2 SSR)** | **Moved (Phase 3).** APIs + SSR use `requireAuthedConvex` + `convex/reports.ts` / `transactions.totalsForYear` / `exports.createMine`. | `convex/reports.ts` + existing `convex/transactions.ts` + `convex/exports.ts` | Cutover done | Medium | **3** |
| **tax / compliance (15)** | **Moved (Phase 3).** `tax-reports/*`, `tax-rules`, `tax/rules`, `tax/sources`, `tax/sources/check`, `calculations/*`, `forms/*`, `nrs-filing/*` (deadlines = calendar only). | Existing `convex/tax.ts` + `convex/forms.ts` | Cutover done | Medium | **4** |
| **documents / workers (3 APIs)** | `v1/documents/upload`, `v1/documents/[id]/status`, `ingest`. Infra: `supabase-document.repository.ts`, `supabase-audit-log.adapter.ts`, `review-queue.stub.ts`. Workers: `document-processor.worker.ts`, `document-recovery.worker.ts`. Also `convex/backfill.ts` + `pnpm backfill:convex` / `backfill:storage` | Existing `convex/documents.ts` + `convex/audit.ts` + `convex/files.ts` + `convex/imports.ts` | Dual-write then cut. Workers and `v1/documents` flip together | **High** | **5** |
| **AI / ML / feedback** | **OUT of Phase 3.** `ai/*`, `categorize`, `ml/*`, `feedback` still on SB. Tables `categorization_predictions` / `feedback` / `user_learning_profiles` / `recurring_patterns` / `ml_inference_logs` are **not in Convex schema**. TODO comments on routes. | Do not invent `convex/categorization.ts` until schema exists | Deferred | Medium | **6** |
| **secondary APIs** | **Partial Phase 3.** Moved: `admin/users` GET, `categories/[id]`, `audit-log`, `audit/log`, `history/*`, `year/available`, `year/switch`. **OUT (no schema):** `deadlines/upcoming`, `reminders/history`, `notifications/preferences`, `migration/migrate`, `admin/users` PATCH (no role field). **Leave `health/db` on SB** (Phase 6 keep-alive). | Existing `convex/users.ts`, `convex/categories.ts`, `convex/audit.ts`, `convex/year.ts` | Cutover except schema-missing + keep-alive | Admin GET = Convex list; role writes OUT | **7** (keep-alive last) |
| **orphan invoice lib** | **Moved (Phase 3).** `invoice-service`, `invoice-archiving`, `invoice-security` writers use `convex/invoices.ts`. PDF/calc helpers kept. | Existing `convex/invoices.ts` | Cutover done | Medium | **8** |
| **lib shim** | Full `src/lib/supabase/*` (`server`, `client`, `session`, `auth`, `queries`, `types`, `index`) + `src/lib/supabase.ts`. Strong SB libs: `export-service`, `deadline-service`, `reminder-job`, `form-prefill`, `data-migration-service`, `expense-premium`, `ai/feedbackService`, `ml/monitoring`, `services/recurring-detection`, `services/rules-engine`, `tax/rule-loader` | Delete after last consumer moves. `with-auth` is already Convex (`getCompatUser`) | Cutover per consumer, then delete | Medium | **9** |
| **deps + `supabase/` tree** | Root `@supabase/ssr` + `@supabase/supabase-js`; mobile `@supabase/supabase-js`; `supabase/migrations`, `config.toml`, rollbacks, RLS scripts. CI: `check:schema-drift`, `check:migrations`, `check:security-advisors`, `test:rls` | Remove after last import is gone | Cutover last | Medium (CI + advisor baseline) | **10** |

### Already Convex (explicit non-list)

Do **not** recut: invoice CRUD APIs; expense CRUD + categories; transaction list / `[id]` / `import-history`; login / signup / `/api/auth`. **`upload-v2` stays Convex** — Phase 2 verifies/fixes parser + persist, does not move it back to SB.

---

## 3. Table → Convex module map

Inferred from `supabase/migrations` and live `.from()` usage. Convex names are **existing schema tables** unless marked **propose** or **unknown**. Do not invent.

| Supabase table | Live notes | Convex table | Convex module | Disposition |
| --- | --- | --- | --- | --- |
| `profiles` | notifications, expense-premium, reminder-job, feedbackService, queries | `users` | `convex/users.ts` | Mapped. Leftover column writes still SB. |
| `auth.users` | admin `listUsers`; mobile session | Convex Auth + `users` | `convex/auth.ts` | Web done. Admin + mobile leftover. |
| `categories` | `categories/[id]`, ai categorize | `categories` | `convex/categories.ts` | List + `[id]` PUT live. AI categorize leftover. |
| `transactions` | leftover upload/export/duplicates + reports + ingest | `transactions` | `convex/transactions.ts` | CRUD live; leftovers split-brain. |
| `import_sessions` / `import_errors` / `duplicate_candidates` | `transactions/duplicates`; legacy `upload` | `importSessions`, `importErrors`, `duplicateCandidates` | `convex/imports.ts` | `upload-v2` live; `upload` leftover. |
| `import_batches` | `queries.ts` only | **unknown** — not in Convex schema | — | Do not invent. |
| `export_history` | leftover export writers | `exportHistory` | `convex/exports.ts` | Phase 3 writers (`export/bulk`, `export/statements`) are Convex. |
| `expenses` / `expense_categories` | leftover export; mobile sync | `expenses`, `expenseCategories` | `convex/expenses.ts` | CRUD live. |
| `expense_reports` | migration only; no `src/` `.from()` | **unknown** | — | No app writer found. |
| `ndpr_consents` | mobile consent-store | **unknown** | — | Mobile-only; do not invent a table name. |
| `invoices` / `invoice_sequences` / `invoice_archives` / `invoice_audit_logs` / `client_keys` | orphan invoice lib + RLS tests | matching camelCase tables | `convex/invoices.ts` | API + lib writers live (Phase 3). |
| `firms` / `firm_members` / `clients` | RLS tests; `api/clients` Convex | `firms`, `firmMembers`, `clients` | `convex/tenancy.ts` | Schema present. |
| `tax_calculations` | `calculations/*` | `taxCalculations` | `convex/tax.ts` | API moved (Phase 3). |
| `sources` / `rule_versions` / `tax_rules` | rule-loader, rules-engine, tax-rules, health/db | `sources`, `ruleVersions`, `taxRules` | `convex/tax.ts` | App tax APIs moved. Keep-alive `health/db` still SB. |
| `tax_reports` | `tax-reports/*` | `taxReports` | stay on `convex/tax.ts` | API moved (Phase 3). |
| `tax_filings` | migration only; no `src/` `.from()` | **unknown** | — | Do not invent. |
| `financial_statements` | reports P&L / BS | `financialStatements` | `convex/reports.ts` | API + persist moved (Phase 3). |
| `nrs_forms` / `form_filing_statuses` / `filing_audit_logs` | `forms/*` | `nrsForms`, `formFilingStatuses`, `filingAuditLogs` | `convex/forms.ts` | API moved (Phase 3). |
| `user_tax_years` | `year/*` | `userTaxYears` | `convex/year.ts` | API moved (Phase 3). No `is_active` field — switch inserts the year row. |
| `filing_deadlines` / `deadline_reminders` | deadline-service, reminders | **unknown** | propose `convex/deadlines.ts` | **Not in Convex schema today.** |
| `documents` | repository + workers | `documents` | `convex/documents.ts` | Functions exist; API/workers leftover. |
| `audit_logs` | leftover APIs + workers | `auditLogs` | `convex/audit.ts` | `audit-log` / `audit/log` / `history/*` moved. Documents workers leftover. |
| `categorization_predictions` / `categorization_feedback` / `user_learning_profiles` / `recurring_patterns` / `ml_inference_logs` | categorize / feedback / ml / monitoring | **unknown** | propose `convex/categorization.ts` | **Not in Convex schema today.** |
| `data_migration_logs` | data-migration-service | **unknown** | — | Ops only. |
| `merchant_categorizations` / `bank_configs` / `clerk_users` / `file_uploads` / `review_queue` / `review_actions` | no live app writers (review stub writes `audit_logs`) | **unknown** / do not copy | — | Do not invent. |

---

## 4. Dual-write vs cut (recommendation)

| Class | Kill-order | Recommendation |
| --- | --- | --- |
| Transaction leftovers (4) | 1 | **Dual-write then cut** onto existing Convex modules. Do not dual-write *back* onto empty SB tables if no client still reads Postgres. |
| **`upload-v2` (already Convex)** | 1 | **Verify/fix, do not recut.** CoS smoke: session PASS, Tx/Invoices nav PASS, CSV upload FAIL (400 no valid txns). Confirm Convex-only path + parser/`bankCode` behavior. |
| Expense leftovers + mobile sync/storage | 2 | **Dual-write then cut.** Flip `expenses/export` + `ocr` with mobile `sync-engine` / `receipts` bucket so devices do not diverge. |
| Reports / exports + SSR | 3 | **Done (Phase 3).** |
| Tax / compliance (15) | 4 | **Done (Phase 3).** |
| Documents pipeline | 5 | **Dual-write then cut.** Workers + `v1/documents` + `ingest` together. |
| AI / ML / feedback | 6 | **Deferred** — no Convex tables. |
| Secondary APIs | 7 | **Partial.** Year/audit/history/categories/[id]/admin GET done. Deadlines/reminders/notifications/migration/role PATCH OUT. Leave `health/db` on SB. |
| Orphan invoice lib | 8 | **Done (Phase 3).** |
| Supabase shims | 9 | Delete after last consumer. |
| Deps + `supabase/` tree | 10 | Last. Keep CI RLS / advisors until CoS agrees. Keep-alive until Phase 6. |

---

## 5. Auth leftovers

**Already Convex:** login / signup / `/api/auth` (Convex Auth). `change-password`. `delete-account` is Convex-only (soft-delete profile; comment notes it does not pause/delete the SB project). `AuthContext.tsx` does not import `@/lib/supabase`.

**Still on Supabase:**

| Path | What it still does |
| --- | --- |
| `src/lib/supabase/auth.ts` | Browser helpers (`signInWithEmail`, `signUpWithEmail`, password reset, …). |
| `src/lib/supabase/session.ts` | `requireServerUser` / session helpers — reports SSR moved off this in Phase 3. |
| Leftover APIs in §2 | Phase 3 in-scope routes now use `requireAuthedConvex`. Still SB auth: AI/ML/feedback, deadlines/reminders, notifications, migration, documents/workers, `health/db`. |
| Mobile | `client.ts` session; `receipt-upload.ts` auth + Storage (`receipts` bucket); `sync-engine.ts`. |

`year-context.tsx` does not import `@/lib/supabase`; it `fetch`es `/api/year/available` (now Convex).

---

## 6. Phased PR map (reference only)

| Phase | Scope |
| --- | --- |
| **1** | **This docs PR.** |
| **2+** | Execute kill-order 1–10 below. Original buckets: Phase 2 money leftovers; Phase 3 remaining APIs + libs; Phase 4 documents/workers; Phase 5 mobile + deps + `supabase/` tree; Phase 6 soak → prod Convex URL → teardown. |

### Kill-order inside Phase 2+

1. Transaction leftovers (`upload`, `export`, `duplicates`, `export/transactions`) **+ verify/fix `upload-v2`** (already Convex; CoS CSV upload FAIL)
2. Expense export/ocr **+** mobile sync/storage
3. Reports / exports + SSR pages
4. Tax / compliance (15 routes)
5. Documents pipeline (v1 + ingest + adapters + workers)
6. AI / ML / feedback
7. Secondary APIs (admin, history/audit, year, deadlines, notifications, migration, …)
8. Orphan invoice lib (`invoice-service`, `invoice-archiving`, `invoice-security`)
9. Delete `src/lib/supabase/*` shims + leftover SB libs
10. Deps (`@supabase/ssr`, `@supabase/supabase-js`) + `supabase/` tree last

Phase 6 (not a strip PR): staging soak → Kezie sets Production `NEXT_PUBLIC_CONVEX_URL` → CoS + Kezie pause/delete `frlcvkmjuhnjcicwywrh`. Do not start Phase 6 from a shipping PR. Do not pause the project from Phases 1–5.

---

## 7. Existing tooling (do not reinvent)

```bash
pnpm backfill:convex    # scripts/backfill-supabase-to-convex.mjs — read-only vs frlcvkmjuhnjcicwywrh
pnpm backfill:storage   # scripts/backfill-supabase-storage-to-convex.mjs — Path B recorded 0 objects
```

Also: `convex/backfill.ts` (internal backfill actions). Checksums: [convex-backfill.md](./convex-backfill.md). Re-run before Phase 6 teardown.
