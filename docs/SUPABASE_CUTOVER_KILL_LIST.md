# Supabase cutover kill-list (by domain)

**Audience:** Kezie (go), CoS (cutover / teardown), Shipping (eng)  
**Verified against:** `staging` tip `b3633c732` (`fix(auth): POST /api/auth returns Convex Auth JSON, not Next HTML` / #95)  
**Method:** `getSupabaseForRequest` call sites, `@/lib/supabase` / `@supabase/*` imports, `convex/` modules, `supabase/migrations` + `src/lib/supabase/queries.ts`  
**This PR:** docs only. Runtime code, deps, and schema are unchanged.

Related: [convex-migration-plan.md](./convex-migration-plan.md) (IVA-60 inventory), [convex-auth-storage.md](./convex-auth-storage.md) (Auth + Storage already moved), [convex-backfill.md](./convex-backfill.md).

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

### What is already Convex (do not re-cut)

Web login / signup / session (`@convex-dev/auth`), password change, account soft-delete, avatar + import/receipt storage (`ctx.storage`), and **CRUD** for transactions, expenses, invoices, clients, categories list, export *history*.

`convex/` already has: `transactions`, `expenses`, `invoices`, `imports`, `exports`, `categories`, `tenancy`, `users`, `accounts`, `files`, `documents`, `audit`, `tax`, `health`. Schema already includes camelCase tables for most money + tax + documents rows (see §3).

### Split-brain (the actual risk)

Leftover routes still **auth + read/write Postgres** via `getSupabaseForRequest` / `createServerClient`. After #93–#95, live web writes go to Convex. Those leftover routes therefore see **stale or empty Supabase rows** and still call `supabase.auth.getUser()`, which does not see Convex Auth cookies.

Strip work is: point leftovers at existing Convex modules (and Convex Auth), then remove the client. It is not a greenfield schema design.

---

## 2. Cutover matrix by domain

Columns: **Domain** | **Still on Supabase (paths)** | **Target Convex module (propose names)** | **Strategy** | **Risk** | **Phase**

Counts below are **route files that still import Supabase**, not total routes in the folder. Where CRUD already moved, the leftover sibling routes are listed.

| Domain | Still on Supabase (paths) | Target Convex module | Strategy | Risk | Phase |
| --- | --- | --- | --- | --- | --- |
| **transactions** | **2 / 6** routes still on SB: `src/app/api/transactions/export`, `duplicates`. CRUD already Convex: `route.ts`, `[id]`, `upload-v2`, `import-history`. | Existing `convex/transactions.ts` + `convex/imports.ts` (`listDuplicates` already exists). | Dual-write then cut (money path). Prefer **cut** the leftovers onto Convex — CRUD is already Convex-only; dual-write is only if a client still posts to SB. | **High** — export/duplicates read SB while list/create is Convex. | **2** |
| **expenses** | **2 / 6** still on SB: `export`, `ocr` (`ocr` uses SB only for `auth.getUser()`; no `.from()`). CRUD already Convex: `route.ts`, `[id]`, `categories`. `billing/checkout` is a 503 stub (no SB). | Existing `convex/expenses.ts`. OCR auth → `requireAuthedConvex`. | Dual-write then cut (money path). Same note: leftover export is split-brain. | **High** (export). OCR auth leftover is **medium**. | **2** |
| **invoices** | **0 / 4** API routes on SB. All of `src/app/api/invoices/**` (`route`, `create`, `[id]`, `[id]/issue`) already call `api.invoices.*`. **Lib leftovers:** `src/lib/invoice-service.ts` (still `createClient()` + `.from("invoices")` / `invoice_audit_logs`; `create` route only uses `calculateInvoiceTotals`), `invoice-security.ts`, `invoice-archiving.ts`. Dashboard pages import `Database` types from `@/lib/supabase/types` only. | Existing `convex/invoices.ts` (issue/list/create already live). Propose `archiveMine` / `audit` on the same module; do not add a second invoices module. | Dual-write then cut for the unused writers if anything still calls them; otherwise **delete/rewrite** the SB writers (cutover). | **Medium** — dead writers can be revived by a stray import. PDF/calc helpers are fine to keep. | **2** |
| **calculations** | **4** routes, all SB: `src/app/api/calculations/route.ts`, `save`, `[id]`, `[id]/finalize` → `tax_calculations` + `audit_logs`. | **Existing** `convex/tax.ts` (`listCalculations`, `saveCalculation`). Propose `getCalculation` / `finalizeCalculation` on the same file (not a new module). | Cutover after Phase 2 soak. Schema table `taxCalculations` already exists. | Medium | **3** |
| **export** | **3** still SB: `export/transactions`, `bulk`, `statements` (write `export_history` + `audit_logs`). **`export/history` is already Convex** (`api.exports.listMine`). `src/lib/export-service.ts` still reads SB `transactions`. | Existing `convex/exports.ts` (`createMine` already exists) + `convex/transactions.ts`. | Dual-write then cut (touches money rows). History already Convex — leftover writers create split-brain history. | **High** | **2** (money) / **3** (if treated as reports) |
| **forms** | **4** routes, all SB: `forms/generate`, `list`, `[id]/download`, `[id]/mark-filed` → `nrs_forms`, `form_filing_statuses`, `filing_audit_logs`. `src/lib/form-prefill.ts` → `profiles`, `transactions`. | Propose `convex/forms.ts` (schema already has `nrsForms`, `formFilingStatuses`, `filingAuditLogs`). | Cutover after soak. | Medium (compliance artifacts) | **3** |
| **reports** | **3** API routes, all SB: `reports/export-pdf`, `balance-sheet`, `profit-loss` → `transactions`, `financial_statements`. RSC: `(dashboard)/reports/page.tsx`, `yoy-comparison/page.tsx` still `createServerClient` + `requireServerUser` + `getTransactionTotals`. | Propose `convex/reports.ts` reading `convex/transactions.ts` (`totalsForYear` / `monthlyTotals` already exist) + schema `financialStatements`. | Cutover after soak. | Medium | **3** |
| **tax-reports** | **3** routes, all SB: `tax-reports`, `generate`, `[id]` → `tax_reports`. | Propose extend `convex/tax.ts` or `convex/reports.ts`. Schema `taxReports` already exists. | Cutover after soak. | Medium | **3** |
| **tax / tax-rules** | `tax/rules`, `tax/sources` use Convex `withAuth` but **`rules-engine.ts` talks to SB** (`rule_versions`, `tax_rules`, `sources`, `audit_logs`). `tax/sources/check` + `tax-rules` still `getSupabaseForRequest`. `src/lib/tax/rule-loader.ts` uses `@/lib/supabase` anon client. Keep-alive `health/db` reads SB `tax_rules` **on purpose**. | Existing `convex/tax.ts` (`listRuleVersions`, `listRulesForVersion`, `loadRuleBundle`, `listSources`). Keep `health/db` on SB until teardown. | Cutover app reads to Convex; **leave keep-alive on SB** until Phase 6. | Medium (wrong rates). Keep-alive is **low** but load-bearing for Free-tier pause. | **3** (app) / **6** (keep-alive) |
| **nrs-filing** | **2** routes, both SB: `nrs-filing/generate`, `deadlines` (`auth.getUser` + `transactions`). | Propose `convex/forms.ts` or `convex/nrs.ts`. | Cutover after soak. | Medium | **3** |
| **deadlines / reminders** | `deadlines/upcoming` (SB auth only in the route; service uses SB). `reminders/history` → `deadline_reminders`. Libs: `deadline-service.ts` (`filing_deadlines`, `deadline_reminders`, `profiles`), `reminder-job.ts`. | Propose `convex/deadlines.ts`. **No Convex tables yet** for deadlines/reminders. | Cutover after soak; **schema work required** (mark unknown until designed). | Medium | **3** |
| **year** | **2** routes, both SB: `year/available`, `year/switch` → `user_tax_years`. `year-context.tsx` does **not** import SB; it `fetch`es `/api/year/available`. | Propose `convex/year.ts` (or `users.ts`). Schema `userTaxYears` already exists. | Cutover. | Low | **3** |
| **ai / categorize** | `ai/categorize`, `ai/batch-categorize` → `categories`, `ml_inference_logs`. `categorize` → `transactions`, `categorization_predictions`. | Propose `convex/categorization.ts`. Reuse `convex/categories.ts` for category list (GET `/api/categories` already Convex; **`categories/[id]` still SB**). | Cutover after soak. | Medium (wrong category on a txn). | **3** |
| **ml** | `ml/recurring`, `ml/corrections` — SB **auth** + `feedbackService` / `recurring-detection` (`categorization_feedback`, `recurring_patterns`, `transactions`, `profiles`). | Propose same `convex/categorization.ts`. | Cutover after soak. | Low–medium | **3** |
| **history / audit\*** | `history`, `history/[id]`, `audit-log`, `audit/log` → `audit_logs` (+ `rule_versions` on audit-log). | Existing `convex/audit.ts` (`append`, `listMine`). | Cutover. | Low | **3** |
| **categories (id)** | `categories/[id]` still SB `.from("categories")`. List is Convex. | Existing `convex/categories.ts`. | Cutover. | Low | **3** |
| **analytics** | `analytics/yoy/summary` → SB `transactions`. | Existing `convex/transactions.ts` (`totalsForYear`). | Cutover. | Low | **3** |
| **notifications** | `notifications/preferences` → SB `profiles` columns (not a dedicated table). | Existing `convex/users.ts` (`updateMine`). | Cutover. | Low | **3** |
| **reminders** | See deadlines row. | `convex/deadlines.ts` (proposed). | Cutover. | Low | **3** |
| **feedback** | `feedback` → SB auth + `feedbackService` (`categorization_feedback`, `user_learning_profiles`). | Propose `convex/categorization.ts`. | Cutover after soak. | Low | **3** |
| **admin** | `admin/users` — `supabase.auth.getUser()` **and** `auth.admin.listUsers()` (service role). | Existing `convex/users.ts`. Role source TBD (`users` row vs Convex Auth metadata). | Cutover. Confirm owner-gate against Convex identity, not SB `app_metadata`. | **High** (service-role + stale auth). | **3** |
| **financial-statements** | `financial-statements/generate` → SB `transactions`. | Propose `convex/reports.ts` + schema `financialStatements`. | Cutover after soak. | Medium | **3** |
| **ingest** | `ingest` — SB auth; `src/lib/ingestion/deduplicate.ts` → SB `transactions`. | Existing `convex/transactions.ts` / `convex/imports.ts`. | Cutover. | Medium | **3** |
| **migration** | `migration/migrate` — `withAuth` (Convex) + `getSupabaseForRequest` + `data-migration-service.ts` (`transactions`, `categories`, `nrs_forms`, `data_migration_logs`). | Propose `convex/migration.ts` or retire after backfill. | Cutover or delete once `pnpm backfill:convex` is the only path. | Low (ops). | **3** |
| **documents / workers** | `src/app/api/v1/documents/upload`, `v1/documents/[id]/status` — SB auth + `getDocumentControllerWithSupabase`. Infra: `src/modules/document-intelligence/infrastructure/persistence/supabase-document.repository.ts`, `audit/supabase-audit-log.adapter.ts`, `review/review-queue.stub.ts` (writes `audit_logs`). Workers: `src/workers/document-processor.worker.ts`, `document-recovery.worker.ts` (`@supabase/supabase-js` service role). | Existing `convex/documents.ts` (`getMine`, `createMine`, `patchInternal`) + `convex/audit.ts` + `convex/files.ts`. Propose `convex-document.repository.ts` (name TBD). | Dual-write then cut (files + status). Workers must move with the API or they will fight. | **High** | **4** |
| **auth leftovers** | See §5. Web change-password / delete-account / login **already Convex**. Real leftovers: `supabase.auth.getUser()` on leftover APIs, `src/lib/supabase/{auth,session,client}.ts`, RSC `requireServerUser`, `src/lib/api.ts`, mobile Auth. `AuthContext.tsx` and `year-context.tsx` do **not** import `@/lib/supabase`. | Existing `convex/auth.ts`, `accounts.ts`, `users.ts`; `src/lib/auth/session.ts` (`getCompatUser`) is already Convex. | Cut leftover `auth.getUser()` as each domain moves. Delete lib helpers in Phase 5. | **High** if a leftover route is hit from the web app (401 / empty data). | **2–5** (incremental) |
| **lib surface** | `src/lib/supabase.ts` (anon client), `src/lib/supabase/**` (`server`, `client`, `session`, `auth`, `queries`, `types`, `index`). `with-auth` is **already Convex** (`getCompatUser`). `tax/rule-loader` still SB. Other SB libs listed in the domain rows. | Delete with Phase 5. `queries.ts` is the RSC/legacy read path (`profiles`, `categories`, `transactions`, `tax_calculations`, `import_batches`). | Cutover per consumer, then delete. | Medium | **3** then **5** |
| **mobile** | `apps/mobile/lib/supabase/client.ts`; `receipt-upload.ts` (SB Storage); `sync/sync-engine.ts` (SB `expenses`); `lib/ndpr/consent-store.ts` (`ndpr_consents`); `app/(tabs)/index.tsx`. Dep: `apps/mobile` `@supabase/supabase-js`. | Propose `apps/mobile/lib/convex/client.ts` + Convex Auth JWT (already accepted in `convex/auth.config.ts` for soak). | Cutover after web soak. Do not strip web deps until mobile is off SB. | **High** (field devices). | **5** |
| **deps** | Root `package.json`: `@supabase/ssr` `^0.12.4`, `@supabase/supabase-js` `^2.112.2`. Mobile: `@supabase/supabase-js`. Scripts: `pnpm supabase`. | Remove in Phase 5 after last import is gone. | Cutover (delete). | Low (build break if a leftover import remains). | **5** |
| **supabase/ tree** | `supabase/migrations/**`, `config.toml`, `rollbacks/`, `scripts/security_hardening_rollback.sql`, `RLS_DEPLOYMENT_GUIDE.md`. CI still runs `check:schema-drift`, `check:migrations`, `check:security-advisors`, `test:rls`. | Archive or delete after teardown. | Cutover after soak + CI job retirement. | Medium (CI + advisor baseline). | **5–6** |
| **tooling** | `pnpm backfill:convex` → `scripts/backfill-supabase-to-convex.mjs`; `pnpm backfill:storage` → `scripts/backfill-supabase-storage-to-convex.mjs`; `scripts/run-migration.ts`; `src/__tests__/rls/**`. | Keep backfill scripts until Phase 6 checksum sign-off. | N/A (ops). | Low | **1** (exists) / **6** (retire) |

`getSupabaseForRequest` appears in **48** `src/app/api/**` route files on this tip (47 indexed call sites plus `v1/documents/upload`, which uses the same helper). Plus `health/db` (`createClient` + `tax_rules` keep-alive) and two dashboard RSC pages.

---

## 3. Table → Convex module map

Inferred from `supabase/migrations` (baseline + tenancy + expenses + import + invoicing + phase-3 domain) and live `.from()` usage. Convex names are **existing schema tables** unless marked **propose** or **unknown**.

| Supabase table | Live `.from()` / notes | Convex table (existing unless noted) | Convex module | Disposition |
| --- | --- | --- | --- | --- |
| `profiles` | queries, notifications, expense-premium, reminder-job, feedbackService | `users` | `convex/users.ts` | Already mapped. Leftover column writes (notification prefs) still SB. |
| `auth.users` | `admin.auth.admin.listUsers`; mobile `auth.getUser` | Convex Auth + `users` | `convex/auth.ts`, `accounts.ts` | Web done. Admin + mobile leftover. |
| `categories` | queries; `categories/[id]`; ai categorize; data-migration | `categories` | `convex/categories.ts` | List live; `[id]` leftover. |
| `transactions` | Many leftover APIs + queries + export-service + ingest | `transactions` | `convex/transactions.ts` | CRUD live; leftovers split-brain. |
| `import_sessions` / `import_errors` / `duplicate_candidates` | `transactions/duplicates` still SB | `importSessions`, `importErrors`, `duplicateCandidates` | `convex/imports.ts` | Upload path live; duplicates route leftover. |
| `import_batches` | `queries.ts` only | **unknown** — not in Convex schema (sessions replaced batches?) | — | Do not invent. Confirm before mapping. |
| `export_history` | leftover export writers | `exportHistory` | `convex/exports.ts` | History GET live; writers leftover. |
| `expenses` / `expense_categories` | leftover export; mobile sync | `expenses`, `expenseCategories` | `convex/expenses.ts` | CRUD live. |
| `expense_reports` | migration only; **no** `src/` `.from()` | **unknown** | — | No app writer found. |
| `ndpr_consents` | mobile consent-store | **propose** `ndprConsents` | propose `convex/users.ts` or `convex/consent.ts` | Mobile-only. |
| `invoices` / `invoice_sequences` / `invoice_archives` / `invoice_audit_logs` / `client_keys` | invoice-service / security / archiving leftover; RLS tests | `invoices`, `invoiceSequences`, `invoiceArchives`, `invoiceAuditLogs`, `clientKeys` | `convex/invoices.ts` | API live; libs leftover. |
| `firms` / `firm_members` / `clients` | RLS tests; `api/clients` already Convex | `firms`, `firmMembers`, `clients` | `convex/tenancy.ts` | Schema present. |
| `tax_calculations` | calculations/\* + queries | `taxCalculations` | `convex/tax.ts` | Functions exist; API leftover. |
| `sources` / `rule_versions` / `tax_rules` | rule-loader, rules-engine, tax-rules, health/db | `sources`, `ruleVersions`, `taxRules` | `convex/tax.ts` | Backfilled; app + keep-alive still SB. |
| `tax_reports` | tax-reports/\* | `taxReports` | propose stay on `convex/tax.ts` | Schema exists; API leftover. |
| `tax_filings` | migration only; **no** `src/` `.from()` | **unknown** | — | Do not invent. |
| `financial_statements` | reports P&L / BS | `financialStatements` | propose `convex/reports.ts` | Schema exists. |
| `nrs_forms` / `form_filing_statuses` / `filing_audit_logs` | forms/\* | `nrsForms`, `formFilingStatuses`, `filingAuditLogs` | propose `convex/forms.ts` | Schema exists; no module file yet. |
| `user_tax_years` | year/\* | `userTaxYears` | propose `convex/year.ts` | Schema exists. |
| `filing_deadlines` / `deadline_reminders` | deadline-service, reminders | **propose** `filingDeadlines`, `deadlineReminders` | propose `convex/deadlines.ts` | **Not in Convex schema today.** |
| `documents` | document repository + workers | `documents` | `convex/documents.ts` | Schema + functions exist; API/workers leftover. |
| `audit_logs` | many leftover APIs + workers | `auditLogs` | `convex/audit.ts` | Functions exist; APIs leftover. |
| `categorization_predictions` / `categorization_feedback` / `user_learning_profiles` / `recurring_patterns` / `ml_inference_logs` | categorize / feedback / ml / monitoring | **propose** matching camelCase tables | propose `convex/categorization.ts` | **Not in Convex schema today.** |
| `data_migration_logs` | data-migration-service | **propose** or drop | propose `convex/migration.ts` | Ops only. |
| `merchant_categorizations` | migration only; **no** `src/` `.from()` | **unknown** | — | Planned in older STATUS.md; unused in app search. |
| `bank_configs` | no app `.from()`; parsers | leave / static | — | Documented in backfill as not copied. |
| `clerk_users` | residue | **do not copy** | — | Dead. |
| `file_uploads` / `review_queue` / `review_actions` | migration only; review stub writes `audit_logs` instead | **unknown** | documents workers | Do not invent. |

---

## 4. Dual-write vs cut (recommendation)

Default from IVA cutover discussion:

| Class | Recommendation |
| --- | --- |
| **Phase 2 money path** (transaction / expense / invoice leftovers + export writers that persist `export_history`) | **Dual-write then cut.** In practice CRUD is already Convex-only, so dual-write means: leftover routes start writing Convex **and** keep SB only if an external client still depends on Postgres. If no such client, **cut** the leftover route onto the existing Convex module in the same PR. Do not dual-write *back* onto empty SB tables. |
| **Low-traffic / derived** (year, history, analytics, notifications, categories `[id]`, feedback stats) | **Cutover** after a Phase 2 soak. Schema/functions often already exist. |
| **Compliance / tax compute** (calculations, forms, tax-reports, tax rules, nrs-filing, financial-statements) | **Cutover** after soak, but gate on checksum vs last SB row counts. Prefer existing `convex/tax.ts` over a new module. |
| **Documents + workers** | **Dual-write then cut.** Workers and `v1/documents` must flip together. |
| **Mobile + deps + `supabase/` tree** | **Cutover** last. Do not remove `@supabase/*` while mobile or keep-alive still need them. |
| **Keep-alive / CI RLS / advisors** | Stay on project `frlcvkmjuhnjcicwywrh` until Phase 6. |

---

## 5. Auth leftovers

Web **login / signup / session** are Convex Auth. `/api/auth/login` returns **410**. `/api/auth/change-password` → `api.accounts.changePassword`. `/api/auth/delete-account` → `api.users.softDeleteMine`. `src/lib/auth/with-auth.ts` uses `getCompatUser` (Convex HTTP), not Supabase.

### Still on Supabase Auth (this tip)

| Path | What it still does |
| --- | --- |
| Almost every leftover API in §2 | `getSupabaseForRequest` then `supabase.auth.getUser()`. Broken for Convex Auth browser cookies. |
| `src/app/api/admin/users` | SB user + `auth.admin.listUsers()` (service role). |
| `src/app/(dashboard)/reports/page.tsx`, `yoy-comparison/page.tsx` | `requireServerUser` from `src/lib/supabase/session.ts`. |
| `src/lib/api.ts` | Dynamic `createServerClient()` + `auth.getUser()`. |
| `src/lib/supabase/session.ts` | `getServerSession`, `getServerUser`, `requireServerUser`, `getAccessToken`. |
| `src/lib/supabase/auth.ts` | Browser helpers: `signInWithEmail`, `signUpWithEmail`, `resetPassword`, `updatePassword`, … **unused by `AuthContext`**. |
| `src/lib/supabase/client.ts` | `@supabase/ssr` browser client. |
| `apps/mobile/lib/supabase/client.ts` + receipt upload / sync | Live mobile Auth + Storage + expenses. |

### Contexts (checked)

- `src/contexts/AuthContext.tsx` — Convex (`useConvexAuth` / `useAuthActions` / `/api/auth/ensure-profile`). **No `@/lib/supabase` import.**
- `src/contexts/year-context.tsx` — **No `@/lib/supabase` import.** Still depends on SB indirectly via `GET /api/year/available`.

---

## 6. Phased PR map (reference only)

| Phase | Scope | Notes |
| --- | --- | --- |
| **1** | **This docs PR** | Kill-list only. No runtime change. |
| **2** | transactions / expenses / invoices leftovers + money export writers | Point leftover routes at existing Convex modules. Dual-write then cut. Unblock split-brain on the money path. |
| **3** | Remaining APIs + libs | calculations, forms, reports, tax\*, nrs-filing, deadlines, year, ai/ml/categorize, history/audit, notifications, feedback, admin, ingest, migration, `queries.ts` / `rule-loader` / RSC pages. |
| **4** | documents / workers | `api/v1/documents/**` + `supabase-*` adapters + BullMQ workers. Flip together. |
| **5** | mobile + remove deps + `supabase/` tree | Expo client off SB; then drop `@supabase/ssr` + `@supabase/supabase-js`; archive migrations. Keep CI RLS jobs until CoS agrees. |
| **6** | Staging soak → prod Convex URL → project teardown | Kezie go to set Production `NEXT_PUBLIC_CONVEX_URL`. Then CoS + Kezie: pause/delete `frlcvkmjuhnjcicwywrh`. Retire keep-alive, backfill scripts, advisor job. |

Do not start Phase 6 from a shipping PR. Do not pause the Supabase project from Phases 1–5.

---

## 7. Existing tooling (do not reinvent)

```bash
pnpm backfill:convex    # scripts/backfill-supabase-to-convex.mjs — read-only vs frlcvkmjuhnjcicwywrh
pnpm backfill:storage   # scripts/backfill-supabase-storage-to-convex.mjs — Path B recorded 0 objects
```

Checksums and row counts: [convex-backfill.md](./convex-backfill.md). Re-run before Phase 6 teardown; do not treat those 2026-09-24 numbers as live forever.
