# Missing Tables — Recovery Plan

**Date:** 2026-08-03 · **Revised** 2026-08-04 after the Phase 1 drift detector ran.
**Problem:** **27** tables referenced by live application code do not exist in the database.
**Verified against:** live `pg_class` lookup (all schemas) + full `.from("…")` reference map across `src/`.

> ## Inventory correction
>
> This plan originally listed **14** tables. The Phase 1 drift detector found **27**. The original inventory was built from a hand-written regex over `.from("…")` calls in `src/app/api/` and `src/lib/`, and missed consumers in `src/modules/` and several service files. **The detector is authoritative; this document has been corrected to match it.**
>
> This is the guardrail working as intended — it caught an incomplete inventory *before* anything was built on it. That is precisely why it was sequenced first.
>
> **None of the 15 additional tables has DDL anywhere** in `supabase/migrations/` or `drizzle/`. All must be reconstructed from code per §1.

---

## 0. Revised totals

| Disposition | Count |
|---|---|
| Cleared by Phase 2 deletions (detector-visible) | **8** |
| Application bug, not a missing table (`users`) | **1** |
| Still missing after Phase 2 (detector) | **18** |
| **To build in Phase 3** | **18** + `merchant_categorizations` = **19** |
| **Total (Phase 1 detector baseline)** | **27** |

**Standing rule:** the drift detector's count is authoritative. Any figure in planning docs that disagrees is stale — correct the doc, do not reconcile to it.

`records`/`customers` had zero `.from()` refs (Drizzle-only) and were never in the 27. Clearances: 8 deletions + `users` fix = 9 → 27 − 9 = 18 still missing.

---

## 1. Why this is tractable

The routes are the specification. Three sources together give a near-complete DDL for every missing table:

| Source | Yields |
|---|---|
| **Zod schemas** (`src/lib/schemas/*.ts`) | Column names, types, nullability, min/max constraints, enums |
| **`.insert({…})` / `.upsert({…})` calls** | The full write column set, plus defaults |
| **`.select()` / `.eq()` / `.order()` calls** | Read columns, filter columns (→ indexes), sort columns |

Worked example — `tax_calculations`, reconstructed from `src/lib/schemas/calculations.ts` + `api/calculations/save/route.ts` + `api/calculations/route.ts`:

```sql
create table public.tax_calculations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  tax_type         text not null check (tax_type in ('pit','cit','vat','wht')),
  tax_year         integer not null check (tax_year between 2000 and 2100),
  calculation_date date not null default current_date,
  input_data       jsonb not null,
  gross_amount     numeric(18,2) not null check (gross_amount >= 0),
  deductions       numeric(18,2) not null default 0 check (deductions >= 0),
  taxable_amount   numeric(18,2) not null check (taxable_amount >= 0),
  tax_due          numeric(18,2) not null check (tax_due >= 0),
  effective_rate   numeric(5,2) check (effective_rate between 0 and 100),
  breakdown        jsonb not null,
  is_final         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Filter/sort columns observed in routes → indexes
create index idx_tax_calculations_user_created
  on public.tax_calculations (user_id, created_at desc);
create index idx_tax_calculations_user_type_year
  on public.tax_calculations (user_id, tax_type, tax_year);

alter table public.tax_calculations enable row level security;
revoke all on public.tax_calculations from anon;   -- see §4, guardrail 1
```

Every constraint above traces to a line of code — the enum from `taxTypeEnum`, the ranges from `.min(2000).max(2100)` and `.min(0).max(100)`, the `>= 0` checks from `"Amounts must be non-negative"`, the defaults from `?? 0` / `?? false` in the route.

**This is reconstruction, not invention.** Where the code does not determine something (numeric precision, `on delete` behaviour, exact index shape), that is a judgement call to flag in review — not a guess to bury.

---

## 2. Classification — all 14

Verdicts from the live reference map. "Refs" counts files containing `.from("<table>")`.

### Build — core features, visibly reachable (7 tables)

| Table | Refs | Consumers | Note |
|---|---|---|---|
| `tax_calculations` | 7 | `calculations/{route,save,[id],[id]/finalize}`, `lib/supabase/queries.ts`, **`(dashboard)/dashboard/page.tsx`** | Highest priority. Zod schema exists. The dashboard queries it directly client-side, so the landing page of the app is hitting a missing table. |
| `user_tax_years` | 2 | `year/available`, `year/switch` | Multi-year support is a headline feature |
| `nrs_forms` | 6 | `forms/{generate,list,[id]/download,[id]/mark-filed}`, `lib/data-migration-service.ts` | The compliance output — the product's whole point |
| `filing_status` | 1 | `forms/[id]/mark-filed` | Paired with `nrs_forms` |
| `filing_audit_logs` | 3 | `forms/{generate,[id]/download,[id]/mark-filed}` | Regulatory audit trail — build with `nrs_forms`, not after |
| `deadline_reminders` | 2 | `lib/deadline-service.ts`, `reminders/history` | |
| `categorization_predictions` | 1 | `categorize` | Feeds the ML correction loop |

### Build — observability (1 table)

| Table | Refs | Consumers | Note |
|---|---|---|---|
| `ml_inference_logs` | 3 | `lib/ml/monitoring.ts`, `ai/categorize` | Not user-facing. **Make writes non-fatal** so a missing or failing log never breaks categorization. |

### Build — the 9 found by the drift detector

| Table | Refs | Consumer | Note |
|---|---|---|---|
| `documents` | **13** | `modules/document-intelligence/infrastructure/persistence/supabase-document.repository.ts` | The entire OCR / document-intelligence pipeline — the best-engineered module in the repo — has no table. Highest reference count of anything missing. |
| `invoice_audit_logs` | **7** | `invoice-service.ts`, `invoice-security.ts`, `invoice-archiving.ts` | Invoice audit trail. NRS compliance relevant. |
| `invoice_archives` | 4 | `invoice-archiving.ts` | Statutory invoice retention. |
| `filing_deadlines` | 5 | `deadline-service.ts`, `reminder-job.ts` | Distinct from `deadline_reminders` — this is the deadline *definitions*, that is the *sent reminders*. Both needed. |
| `user_keys` | 2 | `invoice-security.ts` | **Security-sensitive.** Holds cryptographic signing key material for NRS-compliant invoice QR codes. Requires encryption at rest, tight RLS, explicit `revoke … from anon`, and must never be readable cross-tenant. Design this one deliberately — do not reconstruct it mechanically. |
| `recurring_patterns` | 3 | `lib/ml/recurring-detection.ts` | **Keep** — recurring detection is statistical, not ML, and survives the AI simplification. |
| `import_batches` | 2 | `lib/supabase/queries.ts` | Statement-import batch tracking. |
| `data_migration_logs` | 2 | `data-migration-service.ts` | Year-to-year data migration audit. |
| `categorization_feedback` + `user_learning_profiles` | 6 | `lib/ai/feedbackService.ts` | The surviving correction store — see §2c. |

### Not a table — an application bug (1)

**`users`** — `app/api/auth/delete-account/route.ts:56` runs:

```ts
await supabase.from("users").update({ status: "deactivated" }).eq("id", user.id);
```

`public.users` has never existed; only `auth.users` does. **The return value is not checked**, so this fails silently. The next statement calls `adminClient.auth.admin.deleteUser(user.id)` — a hard delete — so account deletion *appears* to work while the intended soft-delete/deactivation audit trail never happens.

Fix: soft-delete against `profiles` (which does exist), check the error, and decide deliberately whether deletion is soft or hard. Per `docs/TENANCY_DESIGN.md` risk #12 this route also needs review before any multi-tenant model ships — deleting a practitioner must not cascade their clients' statutory records.

---

## 2c. Two competing correction stores — consolidate

The duplicate AI stacks identified in `docs/AI_SIMPLIFICATION_PLAN.md` §1 each have their own correction persistence:

| Stack | Tables | Consumer | Disposition |
|---|---|---|---|
| `lib/ml/continuous-learning.ts` | `ml_corrections`, `ml_models`, `ml_retraining_jobs` | `api/ml/corrections` imports `recordCorrection` / `getCorrectionStats` from here | **Delete.** Model registry and retraining are gone with the ML tier. |
| `lib/ai/feedbackService.ts` | `categorization_feedback`, `user_learning_profiles` | Currently no route consumer | **Keep.** Richer — `getUserLearningContext()` is exactly the few-shot example source a Claude prompt wants. |

**Action:** repoint `api/ml/corrections/route.ts` at `feedbackService` (`recordFeedback` / `getFeedbackStatistics`), then delete `lib/ml/continuous-learning.ts` and `lib/ml/monitoring.ts`'s drift half.

This is the correction feedback loop the owner chose to retain — it survives, just on the surviving stack.

### Delete — dead or descoped (4 tables)

**Owner decisions, 2026-08-03.**

| Table | Refs | Verdict |
|---|---|---|
| `records` | **0** | Zero `.from("records")` anywhere. Drizzle-only artifact. |
| `customers` | **0** | Zero references. Drizzle-only. |
| `bank_accounts` | 3 | **Mono contract is not live and the feature is cancelled.** Never build the table; delete the integration outright (§2a). |
| `email_connections` | 1 | **Gmail/Outlook ingestion postponed.** Never build the table; remove the incomplete surface and document for later revival (§2b). |
| `ml_models` | 1 | Model registry — no models exist after the AI simplification. |
| `ml_retraining_jobs` | 1 | Retraining dropped with the ML tier. |
| `ml_drift_alerts` | 1 | Drift monitoring dropped — owner decision. |
| `ml_corrections` | 5 | Superseded by `categorization_feedback` — see §2c. |

**10 of 27 are resolved by deletion rather than construction** — the best outcome available.

---

## 2a. Mono removal — cancelled, delete outright

Full surface, verified by reference scan:

| Path | Action |
|---|---|
| `src/app/api/banking/mono/{accounts,exchange,sync}/route.ts` | Delete (3 routes) |
| `src/app/(dashboard)/transactions/connect/page.tsx` | Delete — user-facing bank-connect page |
| `src/lib/services/mono-service.ts` | Delete |
| `src/types/mono-connect.d.ts` | Delete |
| `@mono.co/connect.js` in `package.json` | Remove dependency |
| `MONO_SECRET_KEY`, `NEXT_PUBLIC_MONO_PUBLIC_KEY` | Remove from `.env.example` and both templates |
| Any nav/link to `/transactions/connect` | Find and remove — check sidebar, dashboard CTAs, `api-docs/page.tsx` |
| `bank_accounts` | Never create |

Statement upload (`transactions/upload-v2`, the 11 bank adapters in `src/lib/transaction-import/`) is **unaffected and remains the ingestion path.** Do not touch it — per `docs/CAPABILITY_AND_POSITIONING_ASSESSMENT.md` it is the product's strongest asset.

## 2b. Gmail/Outlook removal — postponed, not cancelled

Remove the surface so nothing 500s; git history preserves the implementation for revival.

| Path | Action |
|---|---|
| `src/app/api/email/connect/{gmail,outlook}/route.ts` | Delete |
| `src/app/api/email/callback/gmail/route.ts` | Delete |
| `src/lib/email/{gmail,outlook}.ts` | Delete |
| `src/app/(dashboard)/dashboard/ml-settings/page.tsx` | Remove the email-connection section — see warning below |
| `email_connections` | Never create |
| `googleapis`, `@azure/identity`, `@microsoft/microsoft-graph-client` | **Verify no other consumer** before removing — `googleapis` in particular may be used elsewhere |

**Warning — the UI currently lies.** `ml-settings/page.tsx:32-33` hardcodes `gmail: { connected: true, email: "hello@untapped.africa" }`. The settings page shows a *connected* Gmail account, with a third party's email address, against a table that does not exist. Remove this, do not merely hide it.

Record what was removed and the reviving commit SHA in `docs/DEFERRED_FEATURES.md`, along with the note that `email_connections` stores OAuth tokens and **must be encrypted at rest** when the feature returns — designed in, not bolted on.

**Unrelated but adjacent:** `src/app/(dashboard)/profile/edit/page.tsx:77` hardcodes a personal email as a form `value`. The repo is public. Replace with the authenticated user's email or a placeholder.

### Supersede — do not re-apply (2 tables)

| Table | Refs | Verdict |
|---|---|---|
| `workspaces` | 2 | Migration `20260221100000_sprint5_workspaces_premium.sql` exists in the repo and was **never applied**. |
| `workspace_members` | 2 | Same. |

**Do not apply that migration.** `docs/TENANCY_DESIGN.md` §2.5 argues these should be *replaced* by `firms` / `firm_members`, not generalised — the role vocabulary is wrong (`viewer|editor`, no owner/admin), and their RLS contains a self-referential `USING` clause that will not survive being referenced from 20+ other tables' policies. Since they do not exist and hold no data, this is a free win: build `firms`/`firm_members` instead, and delete the orphaned migration plus the two `expenses/workspaces` routes.

---

## 3. Verification — how you know the reconstruction is correct

This is the part that makes the plan trustworthy rather than hopeful. Three independent checks:

**Check 1 — compile-time proof.** After applying migrations:

```bash
supabase gen types typescript --project-id frlcvkmjuhnjcicwywrh > src/types/database.types.ts
pnpm typecheck
```

If a route reads a column the table lacks, or writes a type the column rejects, **`tsc` fails**. This turns "did I get the schema right?" from a judgement call into a build error. The repo already has `scripts/check-type-drift.sh` (`pnpm check:types`) — wire this into it.

**Check 2 — runtime proof.** The five E2E specs already written (`e2e/`) exercise exactly these paths: calculate → save → retrieve from history hits `tax_calculations`; export hits the forms tables. Run them against a branch database. A missing column surfaces as a failing test, not a production 500.

**Check 3 — do it on a Supabase branch, not production.** Use `create_branch` → apply → `gen types` → typecheck → E2E → `merge_branch`. Zero risk to the (empty, but real) production project, and the branch is disposable if the reconstruction is wrong.

---

## 4. Guardrails — so this cannot recur

The tables went missing because nothing connected "code references table X" to "table X exists." Three additions close that permanently.

**Guardrail 1 — schema drift detector in CI.** A script that greps every `.from("…")` in `src/`, queries `information_schema.tables` on the target project, and fails the build on any reference to a non-existent table. ~30 lines. This is the check whose absence caused the entire problem — it would have caught all 14 on the day they were introduced.

**Guardrail 2 — `anon` revoke is a hardcoded list.** `20260715144130_revoke_anon_access_user_data_tables.sql` names 9 tables explicitly. Supabase's default `GRANT ALL ON TABLES TO anon` means **every new table you create in this plan is anon-exposed the moment it exists**. Each new table's migration must carry its own `revoke all … from anon` in the same file, or the July security work silently regresses. Add the Supabase security advisor to CI as a failing gate with the current count as baseline.

**Guardrail 3 — migrations must be applied, not just written.** `workspaces` proves migrations can sit in the repo unapplied indefinitely. Add a CI step comparing `supabase migration list` local vs remote and failing on divergence.

---

## 5. Sequence

| Step | Work | Gate |
|---|---|---|
| 1 | Build **guardrail 1** — produces the authoritative work list and proves itself by failing on all 14 | Script lists exactly the 14 known tables |
| 2 | **Delete before building.** Mono removal (§2a), Gmail/Outlook removal (§2b), `records` + `customers`, `src/db/` entirely | `pnpm typecheck` + `pnpm build` green; drift script now lists **8**, not 14 |
| 3 | Create a Supabase branch | — |
| 4 | Migration A: `tax_calculations` + RLS + `revoke anon` + indexes | typegen → typecheck → E2E calculation spec |
| 5 | Migration B: `nrs_forms`, `filing_status`, `filing_audit_logs` | typecheck + forms E2E |
| 6 | Migration C: `user_tax_years`, `deadline_reminders`, `categorization_predictions`, `ml_inference_logs` | typecheck |
| 7 | Build `firms`/`firm_members` instead of workspaces; delete the orphaned migration and the two workspace routes | typecheck |
| 8 | Guardrail 1 passes clean; add guardrails 2 and 3 | Full CI green |
| 9 | Merge branch → production; re-run advisors, record new baseline | Security lint count unchanged from baseline |

**Two deliberate ordering choices.**

*Guardrail before construction* — it is cheap, generates the checklist mechanically, and gives an unambiguous definition of done: finished when the script exits 0.

*Deletion before construction* — step 2 removes 6 routes and 2 tables from the problem. Every subsequent step operates on a smaller surface, and the drift script's count dropping 14 → 8 is a free correctness check on the deletions.

---

## 6. Remaining open question

**Tenancy.** If the practitioner model is going ahead (~4–6 weeks per the revised estimate), **the 8 remaining tables must be built with `client_id` from the start.** Building them now and retrofitting `client_id` next month is strictly worse — and retrofitting is precisely where the cross-tenant leakage risks in `docs/TENANCY_DESIGN.md` §3.2 live.

This blocks step 4 and nothing else. Steps 1–3 can proceed today regardless of the answer.
