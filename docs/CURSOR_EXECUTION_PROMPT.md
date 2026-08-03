# Cursor Execution Prompt — KOMPLEET Consolidation

**Revision 4 — 2026-08-03.** Supersedes revisions 1–3. Written after live inspection of the resumed Supabase project, a full triage of the missing tables, and owner decisions on Mono, email ingestion and the AI stack. Where this document and any other doc disagree, **this one wins**.

Paste everything below the horizontal rule into Cursor.

---

You are working on KOMPLEET, a Nigerian tax compliance platform (Next.js 16 / Supabase). Repo root: `c:\Antigravity\Projects\kompleet-platform`. Supabase project ref `frlcvkmjuhnjcicwywrh`, `ACTIVE_HEALTHY`, Postgres 17, eu-west-1.

## Ground truth — verified live on 2026-08-03. Do not re-derive.

**The production database is nearly empty.**

| | |
|---|---|
| `auth.users` / `profiles` | **4** (test accounts) |
| `transactions`, `invoices`, `expenses`, `tax_filings` | **0 rows** |
| Reference data | seeded — `tax_rules` 27, `categories` 23, `bank_configs` 15 |

**Fourteen tables referenced by application code do not exist**, verified by `pg_class` across all schemas: `tax_calculations`, `user_tax_years`, `nrs_forms`, `filing_audit_logs`, `filing_status`, `email_connections`, `deadline_reminders`, `ml_inference_logs`, `categorization_predictions`, `bank_accounts`, `customers`, `records`, `workspaces`, `workspace_members`.

`workspaces`/`workspace_members` **have a repo migration that was never applied** — so repo migrations and live schema diverge in *both* directions.

**Advisors (live):** Security **4 WARN** — three are lint 0029 (`SECURITY DEFINER` executable by `authenticated`) on `get_clerk_user_id()`, `get_current_user_id()`, `get_next_invoice_number(p_user_id uuid, p_tax_year integer)`; one is leaked-password protection disabled. These are probably *not* a regression — July's migration revoked `anon`/`PUBLIC`, while 0029 targets `authenticated`, and 0029 appears to be a newer rule. Assess, don't assume. Performance **133** — `auth_rls_initplan` 58, `unused_index` 52, `multiple_permissive_policies` 10, `duplicate_index` 7, `unindexed_foreign_keys` 6. Matches July's 132, so these were never addressed.

**`get_clerk_user_id()` is live**, confirming Clerk dual-identity is real, not a leftover file.

**Implications:** ~15–19 API routes fail at runtime against missing tables. There is no data-migration problem because there is no data. The public-repo credential exposure had near-zero data impact — rotation was still correct, but there is no NDPR breach to notify.

## Non-negotiable constraints

1. **This repository is PUBLIC.** Never write a credential, key, token, password or connection string into any file. Env var references only. CI runs gitleaks over full history.
2. **Do not run `git add -A`.** The Windows checkout generates CRLF churn across ~40 files. Stage explicitly.
3. **Conventional commits** (commitlint + semantic-release). One logical change per commit.
4. **Branch per phase, PR into `staging`.** Never commit directly to `main`.
5. **Gates before every PR:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (expect 499 passing), `pnpm build`.
6. **All schema work happens on a Supabase branch**, never directly against production. Use `create_branch` → apply → verify → `merge_branch`.
7. **STOP AND ASK** on anything destructive, anything touching RLS or auth, or anything not authorised below.

---

## ⛔ DECISION GATE — resolve before Phase 2

**Does KOMPLEET target individual SMEs, or accountants managing many client entities?**

This blocks table creation and nothing else can sensibly proceed past it. `docs/TENANCY_DESIGN.md` originally scoped multi-tenancy at 10–14 weeks; that estimate assumed migrating live data and is now **obsolete** — with 0 customer rows and 14 tables to build from scratch, the revised figure is **~4–6 weeks**.

If the practitioner model is going ahead, **every table built in Phase 2 must carry `client_id` from the start.** Building 10 tables now and retrofitting `client_id` next month is strictly worse than building them once, and retrofitting is exactly where the cross-tenant leakage risks in `docs/TENANCY_DESIGN.md` §3.2 live.

Put the question to the owner, get an answer, and record it in `docs/STATUS.md` before creating any table.

---

## PHASE 1 — Guardrails first

Build the detector before fixing anything. It generates the work list mechanically and defines "done" unambiguously.

### 1.1 Schema drift detector

`scripts/check-schema-drift.mjs` — greps every `.from("…")` in `src/`, queries `information_schema.tables` on the target project, exits non-zero listing any reference to a table that does not exist. Add as a CI job.

**Expected first run: fails, listing exactly the 14 known tables.** If it lists more or fewer, stop and report — the ground truth above is then incomplete.

The absence of this check is the root cause of the entire problem. It would have caught all 14 on the day they were introduced.

### 1.2 Migration-application check

`workspaces` proves migrations can sit unapplied indefinitely. Add a CI step comparing `supabase migration list` local vs remote, failing on divergence.

### 1.3 Advisor baseline gate

Add Supabase security advisors to CI as a **failing** gate, baseline = current count. Critical because `20260715144130_revoke_anon_access_user_data_tables.sql` is a **hardcoded list of 9 tables** — Supabase's default `GRANT ALL ON TABLES TO anon` means every table you create in Phase 2 is anon-exposed the moment it exists. Each new table's migration must carry its own `revoke all … from anon` in the same file.

**Gate:** all three checks running in CI; 1.1 failing with exactly the 14 expected tables.

---

## PHASE 2 — Delete before you build

Owner decisions of 2026-08-03. Each removes broken surface rather than repairing it. **Do this before Phase 3** — every later step then operates on a smaller codebase, and the drift script's count falling 14 → 8 is a free correctness check on the deletions.

### 2.1 Mono open banking — cancelled

The contract is not live and the feature is dropped. Delete per `docs/MISSING_TABLES_RECOVERY_PLAN.md` §2a: three `api/banking/mono/*` routes, `(dashboard)/transactions/connect/page.tsx`, `lib/services/mono-service.ts`, `types/mono-connect.d.ts`, `@mono.co/connect.js`, the `MONO_*` env vars, and any nav link to `/transactions/connect`. Never create `bank_accounts`.

**Do not touch statement upload** (`transactions/upload-v2`, the 11 bank adapters in `src/lib/transaction-import/`). That remains the ingestion path and is the product's strongest asset.

### 2.2 Gmail/Outlook ingestion — postponed

Remove the surface; git history preserves it. Per §2b: `api/email/connect/{gmail,outlook}`, `api/email/callback/gmail`, `lib/email/{gmail,outlook}.ts`, and the email-connection section of `ml-settings/page.tsx`. Never create `email_connections`. Verify `googleapis`, `@azure/identity` and `@microsoft/microsoft-graph-client` have no other consumer before removing them.

Record what was removed, the reviving commit SHA, and the note that `email_connections` must encrypt OAuth tokens at rest when revived, in `docs/DEFERRED_FEATURES.md`.

### 2.3 ML and AWS — removed, consolidating on Claude

**Follow `docs/AI_SIMPLIFICATION_PLAN.md` in full.** Headlines:

- Delete `ml-service/` (a Python Flask service that cannot run on Vercel — this removes an entire deployment target), `ml-training/`, `lib/ml/model-loader.ts`, both `scripts/upload-models-to-*.ts`, `@aws-sdk/client-s3`, the `kompleet-ml-models` S3 bucket, and the `ML_SERVICE_URL` / `AWS_*` env vars.
- **Keep `lib/ml/recurring-detection.ts`** — it is statistical, not a trained model. Consider moving it to `lib/services/`.
- Replace `lib/services/llm-categorization-service.ts` (which hardcodes OpenAI `gpt-4o-mini`) with the **already-existing** provider factory at `src/lib/ai/providers/`, configured for Claude. Keep `openai-provider` and `kimi-provider` registered for fallback.
- **Fix the rules tier — mandatory, not optional.** `ruleCategorize()` in `ensemble-categorization-service.ts` passes `keywords: []`, so it matches nothing and returns null on every call. The ensemble is currently LLM → *nothing* → ML. Removing ML without fixing this leaves no fallback. Add `keywords text[]` to `categories` and populate for Nigerian merchants.
- **Add a merchant-normalised cache table.** It is simultaneously the cost control, the determinism guarantee (categorization feeds tax computation, so the same merchant must yield the same category), and the latency fix.
- Keep the `AUTO_ACCEPT` / `SUGGEST` / `MANUAL_REVIEW` confidence routing unchanged — that design is sound.

**Security dividend:** this deletes the only consumer of the leaked AWS IAM key, which is the highest financial-risk item in `docs/SECRET_EXPOSURE_REMEDIATION.md`. Delete the bucket and the IAM user in the AWS console as part of this phase.

### 2.4 Dead Drizzle tables

`records` and `customers` have **zero** `.from()` references anywhere. Pure Drizzle artifacts — delete.

### 2.5 Workspaces — supersede, do not apply

Do **not** apply the orphaned `20260221100000_sprint5_workspaces_premium.sql`. Build `firms`/`firm_members` instead per `docs/TENANCY_DESIGN.md` §2.5; delete the migration and the two `expenses/workspaces` routes.

**Gate:** `pnpm typecheck` and `pnpm build` green. Drift script now lists **8** tables, not 14. `grep -ri "aws\|s3\|ML_SERVICE_URL" src/ scripts/` returns nothing outside comments.

---

## PHASE 3 — Rebuild the missing schema

**Follow `docs/MISSING_TABLES_RECOVERY_PLAN.md`.** Triage is done — do not re-litigate it. Eight tables remain:

`tax_calculations`, `user_tax_years`, `nrs_forms`, `filing_status`, `filing_audit_logs`, `deadline_reminders`, `categorization_predictions`, `ml_inference_logs` (make its writes **non-fatal** so a failed log never breaks categorization; consider renaming `ai_inference_logs`).

Plus the new `merchant_categorizations` cache table from Phase 2.3.

### Method

Reconstruct DDL from three sources, in this order of authority: **Zod schemas** (`src/lib/schemas/*.ts`) for types, nullability and constraints → **`.insert({…})` calls** for the column set and defaults → **`.eq()`/`.order()` calls** for indexes. A worked `tax_calculations` example with every constraint traced to its source line is in the recovery plan §1.

Where the code does not determine something — numeric precision, `on delete` behaviour, exact index shape — **flag it in the PR description as a judgement call.** Do not bury it.

### Verification per migration

1. `supabase gen types typescript --project-id <branch> > src/types/database.types.ts`
2. `pnpm typecheck` — **if a route reads a column the table lacks, `tsc` fails.** This converts "is the schema right?" from judgement into a build error. Wire into the existing `scripts/check-type-drift.sh`.
3. Run the relevant E2E spec from `e2e/` against the branch.

Sequence: `tax_calculations` first (the dashboard landing page queries it client-side, so it is the most visible breakage), then the `nrs_forms` + `filing_status` + `filing_audit_logs` set together, then the remainder.

**Gate:** `check-schema-drift` exits 0. Advisors unchanged from the Phase 1 baseline. Branch merged.

---

## PHASE 4 — Simplify how the app works

### 4.1 One schema source of truth

`src/db/schema/` (Drizzle) does not describe the live database: `banking.ts` defines `transactions` with **no `user_id`** (live has one), `users.ts` defines a `users` table with `password_hash` that does not exist, `filings.ts` defines `filings` (live: `tax_filings`), `records.ts` defines a table that exists nowhere.

Find every import of `src/db/`. If nothing production-critical depends on it: **delete `src/db/`, `drizzle/`, `drizzle.config.ts`**, drop `drizzle-orm` and `drizzle-kit`. If something does, stop and report — do not partially migrate. Supabase migrations become the sole source of truth; state so in `docs/ARCHITECTURE.md`.

### 4.2 One identity model

`get_clerk_user_id()` is live; `get_current_user_id()` falls back Clerk → `auth.uid()`; `transactions` and `profiles` carry both `user_id` and `clerk_user_id` with both policy families active.

**With 4 test users this is near-free right now, and expensive the moment there are real ones.** Confirm no user depends on `clerk_user_id`, then write one migration dropping the Clerk policy family, the fallback inside `get_current_user_id()`, `get_clerk_user_id()`, and `clerk_users`. Add a test asserting no dual-identity path resolves.

Not cosmetic: `PERMISSIVE` policies OR together, so the Clerk family is a live second authorization path on your most sensitive table. The 10 `multiple_permissive_policies` lints are the linter observing exactly this.

### 4.3 One data-access pattern

14 dashboard pages/components query Supabase directly from the client, bypassing the API layer. Inventory every direct `supabase.from(...)` outside `src/app/api/` into `docs/DATA_ACCESS_INVENTORY.md` with a per-call-site recommendation. **Inventory only — do not refactor.**

### 4.4 Fix confirmed bugs

- **`next.config.mjs` declares `async redirects()` twice.** The second silently wins, so `/dashboard/overview` is a 302 where the first block intends 301. Merge and pick.
- **`src/app/api/transactions/upload-v2/route.ts`** passes raw DB rows to `findDuplicates()`, which expects `NormalizedTransaction` (`date`/`merchant`, not `transaction_date`/`description`). Date and merchant never compare, capping similarity at 0.35 — duplicate detection is dead on this path. Fix and unit-test. `e2e/statement-upload.spec.ts` asserts `imported === 5` relying on this bug; update it.
- **`e2e/auth-layout.spec.ts` is broken** against current markup — references a header, nav links and theme toggle `AuthLayout.tsx` does not render. Fix or delete before e2e becomes a required check.

### 4.5 Dead code and docs

- `src/app/api/v1/` — verify consumers, remove if none.
- Root detritus: `audit-out.json`, `ts-errors.txt`, `tsconfig.tsbuildinfo`, `sandbox.txt`, `test-sprint7.js`. Delete and gitignore.
- `docs/` has 50+ files including two contradictory February status reports (`PROJECT_STATUS_SUMMARY.md` "62%, blocked" vs `MVP_LAUNCH_READINESS_REPORT.md` "READY"). Archive superseded docs; create one canonical dated `docs/STATUS.md`. Rewrite `START_HERE.md` — it still quotes "128/134 tests" against a real 499.

---

## PHASE 5 — Security follow-through

1. Assess the three lint-0029 findings. `get_current_user_id()` callable by `authenticated` is likely intentional (returns the caller's own id, used inside RLS). `get_clerk_user_id()` disappears with 4.2. For `get_next_invoice_number`, **confirm July's identity guard (`v_caller <> p_user_id → RAISE EXCEPTION`) is present and working — do not remove it.**
2. Enable leaked-password protection: Dashboard → Authentication → Settings.
3. **`auth_rls_initplan` × 58** — policies calling `auth.uid()` per row rather than as an InitPlan. Fix the pattern now (`(select auth.uid())`) while it is 58 mechanical edits against an empty database rather than a production incident later. Do `duplicate_index` (7) and `unindexed_foreign_keys` (6) too. **Defer `unused_index` (52)** — meaningless on empty tables, and you need real traffic to judge.

---

## PHASE 6 — Keep-alive and daily review

**`src/app/api/health/route.ts` returns a static object and touches no database.** Pinging it will not prevent Supabase pausing — Supabase pauses on *database* inactivity, not HTTP traffic. The project already paused once.

### 6.1 `GET /api/health/db`

One cheap real read (e.g. `select count(*) from tax_rules`). Returns `{ status, dbLatencyMs, timestamp }`, non-200 on failure. **Protect it** — repo is public, URL is discoverable: require `x-keepalive-token` against env `KEEPALIVE_TOKEN`, or apply the existing `withRateLimit` wrapper. Unprotected it is a free database-load amplifier. Use the anon/RLS client, not service role. Unit-test both paths.

### 6.2 Scheduler — GitHub Actions, not Cowork

`.github/workflows/keepalive.yml`: cron **every 3 days** (free tier pauses after 7; every 3 gives two chances to recover from one failure) plus `workflow_dispatch`. `curl` with `secrets.KEEPALIVE_TOKEN` against `vars.PRODUCTION_URL`. **Fail the workflow on non-200** — a silent keep-alive failure is worse than none.

Document two caveats in the file: GitHub **disables scheduled workflows in public repos after 60 days without commit activity** (Dependabot normally prevents this, but a quiet repo kills the keep-alive exactly when it matters); and this is a workaround for a free-tier limit, not a fix — Supabase Pro (~$25/mo) does not pause. Record in `docs/STATUS.md` as an accepted, time-limited risk to revisit before real users exist.

### 6.3 Daily review — Cowork

Do **not** put the keep-alive in Cowork; its scheduled tasks only run while the desktop app is open, so production availability cannot depend on it. Write `docs/COWORK_DAILY_REVIEW.md` specifying a daily digest: Supabase status and advisor counts vs baseline, last keep-alive run and latency trend, CI status on `main`/`staging`, open Dependabot count, Vercel production state and whether `live` is true, new secret-scan findings. Anomalies at the top.

---

## PHASE 7 — Domain migration to `kompleet.techivano.com`

Follow `docs/DOMAIN_MIGRATION.md`. Code changes are already in the working tree (`src/lib/cors.ts` + test, `src/app/layout.tsx`, `src/lib/email-service.ts`, `.env.example`, `ci.yml`). Verify, then work the manual checklist **with the owner**: DNS CNAME, Vercel domain attach, per-environment env vars, Supabase Auth redirect allowlist, Google/Microsoft OAuth consent screens, promote to production alias (currently `live: false`).

Two open decisions need the owner: whether mail moves to `techivano.com` (~15 files, needs MX/SPF/DKIM), and the HSTS `includeSubDomains` implication for other `*.techivano.com` subdomains.

---

## PHASE 8 — Dependencies

Per `docs/DEPENDENCY_TRIAGE.md`:

- **Merge now:** #46 postcss, #52 autoprefixer, #48 supabase-js.
- **Close #47**, replace with one PR carrying the bump plus the fix — archiver 8 is a pure-ESM rewrite with no default export. In `src/lib/export-service.ts`: `import { ZipArchive } from "archiver"`, `new ZipArchive({ zlib: { level: 9 } })`. Then manually exercise `POST /api/export/bulk`.
- **Smoke-test then merge:** #50 jspdf-autotable, #54 recharts (charts, light *and* dark), #51 lucide-react (visual pass + audit icon-only buttons for `aria-label`, since v1 makes `aria-hidden="true"` default).
- **Close #45 and #53** — `apps/mobile` is on Expo SDK 54, these are SDK 57; they can never go green individually. Schedule a proper `expo install --fix` + `expo-doctor` migration.
- Apply the rewritten `.github/dependabot.yml`.

---

## PHASE 9 — Test and CI hardening

`secret-scan`, `typecheck`, `e2e` jobs and five E2E specs are already in the working tree. Verify, then:

- Fix or delete `e2e/auth-layout.spec.ts`.
- Seed an email-confirmed test user (`requireAuth()` bounces unverified users). `tax_rules` is already seeded.
- Set CI variables/secrets: `E2E_BASE_URL`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `KEEPALIVE_TOKEN`.
- Add `vitest --coverage` with a floor at measured coverage; ratchet up only.
- Ask the owner to set `secret-scan`, `typecheck`, `test`, `build`, `check-schema-drift` as **required status checks** on `main` and `staging`.
- Once the dependency backlog clears, promote the OSV scan from `continue-on-error` to blocking.

---

## Before you start

There are **uncommitted changes in the working tree** — credential removal from `deploy_rls.sh` and `scripts/upload-models-to-*.ts`, hardened `.gitignore`, new `.gitleaks.toml`, new `secret-scan`/`typecheck`/`e2e` CI jobs, the domain-migration changes, and removal of two hardcoded personal email addresses (`profile/edit/page.tsx` now reads the session user; `ml-settings/page.tsx` no longer claims a connected Gmail account belonging to a third party). Review and commit these first, staging explicitly.

**Key rotation is deliberately deferred by the owner.** Do not block on it, but be aware of the state you are working in:

- The Supabase `service_role` JWT, an AWS IAM key pair, a GitHub token and a Google Drive OAuth token were world-readable in this public repo and have **not** been rotated. The `service_role` JWT does not expire until 2036.
- The database holds 4 test accounts and zero customer records, so **data exposure is minimal** — but `service_role` still permits writes and drops, and the AWS key carries billing-abuse risk that is unaffected by the database being empty.
- **Phase 2.3 materially improves this**: deleting the S3 bucket and IAM user removes the highest-financial-risk credential entirely rather than rotating it. Prioritise that deletion accordingly.
- Do not create any new credential, and do not treat the current state as a baseline for "secrets are handled."

## Reporting

After each phase: files changed, gate results, anything skipped and why, and any decision needed from the owner. Do not proceed past a failing gate.
