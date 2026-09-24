# Supabase cutover kill-list (by domain)

**Audience:** Kezie (go), CoS (cutover / teardown), Shipping (eng)  
**Verified against:** shallow clone of `staging` @ `b3633c7326cb7b54a2bc647141375dd4251d82a6` (`fix(auth): POST /api/auth returns Convex Auth JSON, not Next HTML` / #95)  
**This PR:** docs only. Runtime code, deps, and schema are unchanged.

Related: [convex-migration-plan.md](./convex-migration-plan.md) (IVA-60 inventory), [convex-auth-storage.md](./convex-auth-storage.md) (Auth + Storage already moved), [convex-backfill.md](./convex-backfill.md).

**Scale (this tip):** ~50 API routes still on Supabase; ~90 strong runtime code files (routes + libs + workers + mobile). Root deps: `@supabase/ssr`, `@supabase/supabase-js`. Mobile dep: `@supabase/supabase-js`.

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

### Already Convex (do not list as still on Supabase)

- Invoice **CRUD APIs** (`src/app/api/invoices/**`)
- Expense **CRUD + categories** (`expenses/route`, `expenses/[id]`, `expenses/categories`)
- Transaction **list / [id] / upload-v2 / import-history**
- Login / signup / `/api/auth` (Convex Auth)
- `change-password` → `api.accounts.changePassword`
- `delete-account` → `api.users.softDeleteMine` (Convex-only; comment says it does not pause/delete the SB project)

`convex/` already has: `transactions`, `expenses`, `invoices`, `imports`, `exports`, `categories`, `tenancy`, `users`, `accounts`, `files`, `documents`, `audit`, `tax`, `health`, `backfill`.

### Split-brain

Leftover routes still auth + read/write Postgres. After #93–#95, live web CRUD writes go to Convex. Leftovers therefore see stale or empty Supabase rows and often still call `supabase.auth.getUser()`, which does not see Convex Auth cookies.

---

## 2. Cutover matrix by domain

Columns: **Domain** | **Still on Supabase (paths)** | **Target Convex module (propose names)** | **Strategy** | **Risk** | **Kill-order**

Kill-order is the suggested sequence **inside Phase 2+** (see §6). Dual-write then cut for the money path; cutover OK for low-traffic after soak.

| Domain | Still on Supabase (paths) | Target Convex module | Strategy | Risk | Kill-order |
| --- | --- | --- | --- | --- | --- |
| **transactions leftovers (4)** | `transactions/upload`, `transactions/export`, `transactions/duplicates`, `export/transactions` | Existing `convex/transactions.ts` + `convex/imports.ts` + `convex/exports.ts` | Dual-write then cut | **High** — list/create is Convex; these four still hit SB | **1** |
| **expenses leftovers (2)** | `expenses/export`, `expenses/ocr` | Existing `convex/expenses.ts`. OCR auth → `requireAuthedConvex` | Dual-write then cut | **High** (export split-brain). OCR is SB auth only | **2** |
| **mobile** | `apps/mobile/lib/supabase/client.ts`; `receipt-upload.ts` (Storage bucket `receipts`); `sync/sync-engine.ts` (`expenses` table); `app/(tabs)/index.tsx` sync; `app.config.ts` `EXPO_PUBLIC_SUPABASE_*`; `apps/mobile/package.json` `@supabase/supabase-js` | Propose `apps/mobile/lib/convex/client.ts`. Reuse `convex/expenses.ts` + `convex/files.ts` | Dual-write then cut (sync/storage with expense leftovers) | **High** (field devices) | **2** (sync/storage) then **10** (dep drop) |
| **reports / exports (7 APIs + 2 SSR)** | APIs: `reports/export-pdf`, `reports/balance-sheet`, `reports/profit-loss`, `financial-statements/generate`, `analytics/yoy/summary`, `export/bulk`, `export/statements`. SSR: `(dashboard)/reports/page.tsx`, `yoy-comparison/page.tsx` still `createServerClient` + `requireServerUser` | Propose `convex/reports.ts`. Reuse `convex/transactions.ts` (`totalsForYear` / `monthlyTotals`) + `convex/exports.ts` + schema `financialStatements` | Cutover after money-path soak | Medium | **3** |
| **tax / compliance (15)** | `tax-reports/*` (3), `tax-rules`, `tax/sources/check`, `calculations/*` (4), `forms/*` (4), `nrs-filing/*` (2) | Existing `convex/tax.ts` (`listCalculations`, `saveCalculation`, `loadRuleBundle`, `listSources`). Propose `convex/forms.ts` for `nrsForms` / `formFilingStatuses` / `filingAuditLogs` (tables already in schema) | Cutover after soak | Medium (wrong rates / filings) | **4** |
| **documents / workers (3 APIs)** | `v1/documents/upload`, `v1/documents/[id]/status`, `ingest`. Infra: `supabase-document.repository.ts`, `supabase-audit-log.adapter.ts`, `review-queue.stub.ts`. Workers: `document-processor.worker.ts`, `document-recovery.worker.ts`. Also `convex/backfill.ts` + `pnpm backfill:convex` / `backfill:storage` | Existing `convex/documents.ts` + `convex/audit.ts` + `convex/files.ts` + `convex/imports.ts` | Dual-write then cut. Workers and `v1/documents` flip together | **High** | **5** |
| **AI / ML / feedback** | `ai/*`, `categorize`, `ml/*`, `feedback` (subset of the 19 “other” APIs) | Propose `convex/categorization.ts`. Reuse `convex/categories.ts` for category list (GET `/api/categories` already Convex) | Cutover after soak | Medium (wrong category) | **6** |
| **secondary APIs** | Remainder of the 19: `admin/users`, `categories/[id]`, `audit-log`, `audit/log`, `history/*`, `deadlines/upcoming`, `reminders/history`, `notifications/preferences`, `year/available`, `year/switch`, `migration/migrate`, `health/db` | Existing `convex/users.ts`, `convex/categories.ts`, `convex/audit.ts`. Propose `convex/year.ts` (`userTaxYears` exists), `convex/deadlines.ts` (**no** deadline tables in Convex schema yet). **Leave `health/db` on SB** until Phase 6 keep-alive | Cutover (except keep-alive) | Admin = **high** (service-role `listUsers`). Rest low–medium | **7** (keep-alive last) |
| **orphan invoice lib** | `src/lib/invoice-service.ts`, `invoice-archiving.ts`, `invoice-security.ts` — APIs already Convex; these writers still call SB | Existing `convex/invoices.ts`. Keep PDF/calc helpers; delete or rewrite SB writers | Cutover / delete. Do not treat as Phase 2 money CRUD | Medium (dead writers can be revived) | **8** |
| **lib shim** | Full `src/lib/supabase/*` (`server`, `client`, `session`, `auth`, `queries`, `types`, `index`) + `src/lib/supabase.ts`. Strong SB libs: `export-service`, `deadline-service`, `reminder-job`, `form-prefill`, `data-migration-service`, `expense-premium`, `ai/feedbackService`, `ml/monitoring`, `services/recurring-detection`, `services/rules-engine`, `tax/rule-loader` | Delete after last consumer moves. `with-auth` is already Convex (`getCompatUser`) | Cutover per consumer, then delete | Medium | **9** |
| **deps + `supabase/` tree** | Root `@supabase/ssr` + `@supabase/supabase-js`; mobile `@supabase/supabase-js`; `supabase/migrations`, `config.toml`, rollbacks, RLS scripts. CI: `check:schema-drift`, `check:migrations`, `check:security-advisors`, `test:rls` | Remove after last import is gone | Cutover last | Medium (CI + advisor baseline) | **10** |

### Already Convex (explicit non-list)

Do **not** recut: invoice CRUD APIs; expense CRUD + categories; transaction list / `[id]` / `upload-v2` / `import-history`; login / signup / `/api/auth`.

---

## 3. Table → Convex module map

Inferred from `supabase/migrations` and live `.from()` usage. Convex names are **existing schema tables** unless marked **propose** or **unknown**. Do not invent.

| Supabase table | Live notes | Convex table | Convex module | Disposition |
| --- | --- | --- | --- | --- |
| `profiles` | notifications, expense-premium, reminder-job, feedbackService, queries | `users` | `convex/users.ts` | Mapped. Leftover column writes still SB. |
| `auth.users` | admin `listUsers`; mobile session | Convex Auth + `users` | `convex/auth.ts` | Web done. Admin + mobile leftover. |
| `categories` | `categories/[id]`, ai categorize | `categories` | `convex/categories.ts` | List live; `[id]` leftover. |
| `transactions` | leftover upload/export/duplicates + reports + ingest | `transactions` | `convex/transactions.ts` | CRUD live; leftovers split-brain. |
| `import_sessions` / `import_errors` / `duplicate_candidates` | `transactions/duplicates`; legacy `upload` | `importSessions`, `importErrors`, `duplicateCandidates` | `convex/imports.ts` | `upload-v2` live; `upload` leftover. |
| `import_batches` | `queries.ts` only | **unknown** — not in Convex schema | — | Do not invent. |
| `export_history` | leftover export writers | `exportHistory` | `convex/exports.ts` | `export/history` GET is Convex. |
| `expenses` / `expense_categories` | leftover export; mobile sync | `expenses`, `expenseCategories` | `convex/expenses.ts` | CRUD live. |
| `expense_reports` | migration only; no `src/` `.from()` | **unknown** | — | No app writer found. |
| `ndpr_consents` | mobile consent-store | **unknown** | — | Mobile-only; do not invent a table name. |
| `invoices` / `invoice_sequences` / `invoice_archives` / `invoice_audit_logs` / `client_keys` | orphan invoice lib + RLS tests | matching camelCase tables | `convex/invoices.ts` | API live; libs leftover. |
| `firms` / `firm_members` / `clients` | RLS tests; `api/clients` Convex | `firms`, `firmMembers`, `clients` | `convex/tenancy.ts` | Schema present. |
| `tax_calculations` | `calculations/*` | `taxCalculations` | `convex/tax.ts` | Functions exist; API leftover. |
| `sources` / `rule_versions` / `tax_rules` | rule-loader, rules-engine, tax-rules, health/db | `sources`, `ruleVersions`, `taxRules` | `convex/tax.ts` | Backfilled; app + keep-alive still SB. |
| `tax_reports` | `tax-reports/*` | `taxReports` | stay on `convex/tax.ts` | Schema exists; API leftover. |
| `tax_filings` | migration only; no `src/` `.from()` | **unknown** | — | Do not invent. |
| `financial_statements` | reports P&L / BS | `financialStatements` | propose `convex/reports.ts` | Schema exists. |
| `nrs_forms` / `form_filing_statuses` / `filing_audit_logs` | `forms/*` | `nrsForms`, `formFilingStatuses`, `filingAuditLogs` | propose `convex/forms.ts` | Schema exists; no module file yet. |
| `user_tax_years` | `year/*` | `userTaxYears` | propose `convex/year.ts` | Schema exists. |
| `filing_deadlines` / `deadline_reminders` | deadline-service, reminders | **unknown** | propose `convex/deadlines.ts` | **Not in Convex schema today.** |
| `documents` | repository + workers | `documents` | `convex/documents.ts` | Functions exist; API/workers leftover. |
| `audit_logs` | leftover APIs + workers | `auditLogs` | `convex/audit.ts` | Functions exist; APIs leftover. |
| `categorization_predictions` / `categorization_feedback` / `user_learning_profiles` / `recurring_patterns` / `ml_inference_logs` | categorize / feedback / ml / monitoring | **unknown** | propose `convex/categorization.ts` | **Not in Convex schema today.** |
| `data_migration_logs` | data-migration-service | **unknown** | — | Ops only. |
| `merchant_categorizations` / `bank_configs` / `clerk_users` / `file_uploads` / `review_queue` / `review_actions` | no live app writers (review stub writes `audit_logs`) | **unknown** / do not copy | — | Do not invent. |

---

## 4. Dual-write vs cut (recommendation)

| Class | Kill-order | Recommendation |
| --- | --- | --- |
| Transaction leftovers (4) | 1 | **Dual-write then cut** onto existing Convex modules. Do not dual-write *back* onto empty SB tables if no client still reads Postgres. |
| Expense leftovers + mobile sync/storage | 2 | **Dual-write then cut.** Flip `expenses/export` + `ocr` with mobile `sync-engine` / `receipts` bucket so devices do not diverge. |
| Reports / exports + SSR | 3 | **Cutover** after money-path soak. |
| Tax / compliance (15) | 4 | **Cutover** after soak; checksum vs last SB row counts. Prefer existing `convex/tax.ts`. |
| Documents pipeline | 5 | **Dual-write then cut.** Workers + `v1/documents` + `ingest` together. |
| AI / ML / feedback | 6 | **Cutover** after soak. |
| Secondary APIs | 7 | **Cutover.** Leave `health/db` on SB until teardown. |
| Orphan invoice lib | 8 | **Cutover / delete** writers. Not a CRUD recut. |
| Supabase shims | 9 | Delete after last consumer. |
| Deps + `supabase/` tree | 10 | Last. Keep CI RLS / advisors until CoS agrees. Keep-alive until Phase 6. |

---

## 5. Auth leftovers

**Already Convex:** login / signup / `/api/auth` (Convex Auth). `change-password`. `delete-account` is Convex-only (soft-delete profile; comment notes it does not pause/delete the SB project). `AuthContext.tsx` does not import `@/lib/supabase`.

**Still on Supabase:**

| Path | What it still does |
| --- | --- |
| `src/lib/supabase/auth.ts` | Browser helpers (`signInWithEmail`, `signUpWithEmail`, password reset, …). |
| `src/lib/supabase/session.ts` | `requireServerUser` / session helpers — **used by reports SSR** (`reports/page.tsx`, `yoy-comparison/page.tsx`). |
| Leftover APIs in §2 | Many still `getSupabaseForRequest` + `supabase.auth.getUser()`. |
| Mobile | `client.ts` session; `receipt-upload.ts` auth + Storage (`receipts` bucket); `sync-engine.ts`. |

`year-context.tsx` does not import `@/lib/supabase`; it still `fetch`es `/api/year/available` (SB).

---

## 6. Phased PR map (reference only)

| Phase | Scope |
| --- | --- |
| **1** | **This docs PR.** |
| **2+** | Execute kill-order 1–10 below. Original buckets: Phase 2 money leftovers; Phase 3 remaining APIs + libs; Phase 4 documents/workers; Phase 5 mobile + deps + `supabase/` tree; Phase 6 soak → prod Convex URL → teardown. |

### Kill-order inside Phase 2+

1. Transaction leftovers (`upload`, `export`, `duplicates`, `export/transactions`)
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
