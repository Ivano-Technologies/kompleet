# Kompleet: Supabase → Convex migration plan

**Linear:** [IVA-60](https://linear.app/ivano-technologies/issue/IVA-60/kompleet-migrate-db-from-supabase-to-convex)
**Audience:** Kezie (product), CoS (cutover decisions), Shipping (eng)
**This PR:** inventory + written plan only. No cutover, no live env change, no production data move, no Supabase teardown.

---

## 0. What this document is (and is not)

Kezie asked (via CoS, 2026-09-24) to move **Kompleet’s database off Supabase onto Convex**. IVA-60 is that request. This document is workstream 1 of that ticket: **inventory + risk brief + proposed target model + cutover options**.

### Non-goals of *this* PR

- Do not implement Convex functions, queries, or mutations in the app.
- Do not add a live Convex deployment or change Vercel / GitHub env to Convex.
- Do not migrate or dual-write production data.
- Do not delete, pause, or decommission the Supabase project.
- Do not change login, RLS, or storage behaviour on `ivanotechnologies.com`.
- Do not touch juo-campaign or any other Ivano repo.

### Decision channel (from IVA-60)

Escalate these to **CoS**, not Kezie-direct:

- Cutover strategy and freeze window
- Auth (keep Supabase Auth vs move)
- Storage / realtime replacements
- Production go / Supabase teardown

This plan **recommends** a path so Kezie can pick one. It does not execute it.

---

## 1. Recommendation (read this first)

**Recommend option B for the first production cutover: Convex as the data store, keep Supabase Auth (and empty Storage) until soak.** Treat option A (everything off Supabase, including Auth) as the **end state**, not the first cut.

**Do not start with option C (phased dual-write)** unless row counts grow a lot before cutover. Live data is small enough to backfill in one rehearsal.

| Option | What moves | When it is right |
| --- | --- | --- |
| **A — Full Convex** | DB + Auth + Storage | End state Kezie asked for. Too many blast radii for the first production go. |
| **B — Data-only Convex** *(recommended first cut)* | Postgres tables + RPCs + RLS logic | Matches IVA-60 “migrate the database”. Auth already works. Storage has **zero objects**. |
| **C — Dual-write** | Write both stores, then flip reads | Insurance for a large live corpus. Not justified by current row counts. |

**Why B first**

1. IVA-60’s goal is the **data layer**. Auth is an explicit CoS decision.
2. App auth today is **Supabase Auth** (`@supabase/ssr` cookies + Bearer for mobile). Convex can verify those JWTs via a custom JWT provider — no login rewrite on day one. See [Convex custom JWT](https://docs.convex.dev/auth/advanced/custom-jwt).
3. Live Storage is empty (3 buckets, 0 objects). ML models already live on **AWS S3**, not Supabase.
4. Realtime is unused in app code. Convex’s automatic reactivity is a later benefit, not a cutover blocker.
5. There is **no Edge Functions directory**. Workers are Node/BullMQ talking to PostgREST with the service role.

**Why not C first**

Live user data (snapshotted 2026-09-24 from project `frlcvkmjuhnjcicwywrh`) is:

| Table | Exact rows |
| --- | ---: |
| `auth.users` | 5 (all email-confirmed) |
| `profiles` | 5 |
| `transactions` | **208** |
| `import_sessions` | 45 |
| `import_errors` | 101 |
| `export_history` | 100 |
| `firms` / `clients` / `invoices` / `expenses` / `documents` | 0 |

`docs/TENANCY_DESIGN.md` (2026-08-03) said domain tables were empty. That is **stale**. There is now a small but real transaction/import corpus. It is still small enough to copy once after a freeze, with a row-count + checksum gate — dual-write adds weeks of consistency bugs for ~200 rows.

**What Kezie / CoS must pick**

- First cut: **A, B, or C** (this doc recommends **B**, then A after soak).
- Whether the unused tenancy spine (`firms` / `clients`, 0 rows) is **required on Convex from day one**, or whether user-scoped tables stay user-scoped until a practitioner launch.

---

## 2. Current-state facts (code + live project)

These are verified against the repo on `main`/`staging` (same SHA at plan time) **and** a read-only look at the live KOMPLEET Supabase project. If a README disagrees with code, **code + live SQL win**.

### 2.1 Product and stack

Kompleet is a Nigerian financial / tax platform (Nigeria Tax Act 2025/2026): transactions, expenses, invoices, tax calculators, NRS forms, document intelligence, ML categorization.

| Layer | What is actually live |
| --- | --- |
| Web | Next.js App Router (`src/app`), Vercel (`iad1` in `vercel.json`) |
| Auth | **Supabase Auth** — email/password UI; OAuth/magic-link **helpers exist**, no login button wired |
| Database | Supabase Postgres 17, project `frlcvkmjuhnjcicwywrh`, region `eu-west-1`, status `ACTIVE_HEALTHY` |
| Access control | RLS on every public table; ~user JWT via anon key. Service role for admin / workers / a few inserts |
| Mobile | Expo app in `apps/mobile` — anon supabase-js + Bearer to web API; auth still placeholder-ish |
| Workers | `src/workers/document-*.worker.ts` — BullMQ + Redis + **service_role** supabase-js |
| ML artifacts | AWS S3 `kompleet-ml-models` (eu-west-1), not Supabase Storage |

### 2.2 Auth: ignore stale Clerk docs

| Source | Claim | Verdict |
| --- | --- | --- |
| `README.md` | Clerk middleware, Clerk webhooks, Clerk JWT into Supabase | **Stale.** No `@clerk/*` in `package.json`. No `/api/webhooks/clerk`. |
| `docs/AUTH_MIGRATION_PLAN.md` | Active = Supabase Auth; Clerk deferred post-MVP | **Matches code.** |
| SQL | `clerk_users`, `get_clerk_user_id()`, overlapping Clerk **OR** `auth.uid()` policies on some tables | **Residue.** Invoice policies were switched back to `auth.uid()` in `20260228100000`. Live `clerk_users` = **1 row**. |
| `middleware.ts` | Supabase SSR `getUser()` cookie refresh | **Live path.** Does **not** redirect unauthenticated users; layouts call `requireAuth()`. |

**Live auth path**

1. Browser: `@supabase/ssr` `createBrowserClient` (cookies, not localStorage) — `src/lib/supabase/client.ts`
2. Server/RSC: `createServerClient()` — `src/lib/supabase/server.ts`
3. API routes: `getSupabaseForRequest(request)` — cookies **or** `Authorization: Bearer` (mobile)
4. Admin: `createAdminClient()` / inline `createClient(url, SERVICE_ROLE_KEY)`
5. Profile row: trigger `on_auth_user_created` → `handle_new_user()` inserts `profiles`

### 2.3 Tenancy: designed, half-applied, unused in data

Wave A (`20260813220000`) added `firms`, `firm_members`, `clients` plus `my_firm_ids()` / `accessible_client_ids()`.
Wave C + Phase 3 made invoicing and 16 domain tables **client-scoped**.

**Live:** 0 firms, 0 members, 0 clients. The only populated user domain table (`transactions`) is still **`user_id` + `auth.uid()`**, not `client_id`.

Phase 3 inserts use trigger `assign_client_id_from_user()` which **fails if the user has no client**. So calculators / documents / NRS forms that write those new tables will throw until a firm+client exists. That is a product/tenancy gap **independent of Convex**, but Convex schema design must not pretend tenancy is already complete.

### 2.4 What is *not* used

| Feature | Repo | Live |
| --- | --- | --- |
| Edge Functions | `supabase/functions/` **does not exist** | n/a |
| Realtime in app | No `.channel` / `postgres_changes` | Publication `supabase_realtime` exists; unused by Kompleet code |
| Storage uploads (web) | No `storage.upload` in `src/` | 0 objects |
| Storage uploads (mobile) | `apps/mobile/lib/receipt-upload.ts` → bucket `receipts` | 0 objects |
| Clerk runtime | None | 1 leftover `clerk_users` row |
| Drizzle ORM | `src/db/` + `drizzle/` present | **No app imports.** Stale; do not plan from it |
| Paystack / Clerk / Stripe webhooks | Billing stubs only | No live webhook routes under `src/app/api/webhooks/` |

### 2.5 Schema sources of truth (ranked)

1. **Live `public` tables + `supabase/migrations/*.sql`** (29 forward files, all applied — see §3.2)
2. Application `.from("…")` call sites (drift detector in `scripts/check-schema-drift.mjs`)
3. `src/lib/supabase/types.ts` — **hand-maintained, diverges** (documents columns the migrations never created, e.g. `transactions.hash` / `tax_year` / `running_balance`, `profiles.vat_*`)
4. `drizzle/` and `src/db/schema/` — **do not use**

`.schema-drift-baseline` is currently `15` (ratchet: CI fails only if *more* referenced-but-missing tables than this). Phase 3 added tables; the baseline was not decremented to 0.

---

## 3. Full Supabase inventory

### 3.1 Project, env, CI, Vercel

**Project**

- Ref: `frlcvkmjuhnjcicwywrh`
- Dashboard: `https://supabase.com/dashboard/project/frlcvkmjuhnjcicwywrh`
- Postgres 17.6.x, `eu-west-1`
- Keep-alive exists because **free-tier pause** is a real operational constraint (`.github/workflows/keepalive.yml` hits PostgREST `tax_rules` every 3 days)
- PITR is documented as required for MVP (`docs/DATABASE_PITR_GUIDE.md`) and is **not available on Free**. Convex cutover should not assume PITR is already on.

**App env vars (Supabase-related)**

| Variable | Where used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Web, CI build, Vercel | Public. Prod example in docs: `https://frlcvkmjuhnjcicwywrh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web, CI | Publishable `sb_publishable_…` preferred; legacy JWT `eyJ…` deprecated end of 2026 (`docs/KEY_MIGRATION_CHECKLIST.md`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server, workers, admin | Secret `sb_secret_…` or legacy JWT. **Bypasses RLS.** Canonical name only (no `SUPABASE_SERVICE_KEY` alias) |
| `DATABASE_URL` | CI drift + migrations-applied | Direct Postgres. Optional for the Next app |
| `SUPABASE_URL` / `SUPABASE_POOLER_URL` | Workers | Pooler preferred |
| `KEEPALIVE_TOKEN` | `GET /api/health/db` | Shared with GitHub `KEEPALIVE_TOKEN`; route fails closed without it |
| `SUPABASE_ACCESS_TOKEN` | CI `security-advisors` | Account-wide; **must not** go in Dependabot secrets |
| `SUPABASE_PROJECT_REF` | CI var | Default `frlcvkmjuhnjcicwywrh` |
| `SUPABASE_PUBLISHABLE_KEY` | Keep-alive + e2e | New key format (legacy anon JWTs may be disabled) |
| `KOMPLEET_RLS_*` | CI `rls-negative` | Local `pnpm supabase start`, not hosted secrets |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | |
| `EXPO_PUBLIC_TEST_USER_ID` | Mobile placeholder auth | |

Validated in `src/lib/env.ts` (Zod). Templates: `.env.example`, `.env.local.template`, `.env.production.template`. Docs: `docs/ENVIRONMENT_VARIABLES.md`.

**`vercel.json`** has **no** env entries. Production secrets live in the Vercel dashboard (not committed). Documented required prod vars: the three Supabase keys + `NEXT_PUBLIC_SITE_URL` + AI keys.

**GitHub Actions (Supabase-coupled jobs)**

| Workflow / job | Coupling |
| --- | --- |
| `ci.yml` → `build` | Needs `NEXT_PUBLIC_SUPABASE_*` secrets; service role is a CI placeholder |
| `ci.yml` → `test` | Placeholder URL/keys |
| `ci.yml` → `rls-negative` | Starts **local** Supabase, runs cross-tenant + policy snapshot tests |
| `ci.yml` → `schema-drift` | `DATABASE_URL` against live/hosted Postgres |
| `ci.yml` → `migrations` | Same `DATABASE_URL`; compares repo migrations to `supabase_migrations` |
| `ci.yml` → `security-advisors` | Management API + `SUPABASE_ACCESS_TOKEN` |
| `ci.yml` → `e2e` | Real URL + `SUPABASE_PUBLISHABLE_KEY` + test user secrets (advisory, `continue-on-error`) |
| `keepalive.yml` | Direct PostgREST ping with publishable key |

A Convex cutover must **replace or retire** drift / advisors / keepalive / RLS-negative jobs. Do not leave them pointing at a decommissioned project.

**Local config:** `supabase/config.toml` — API 54321, DB 54322, Postgres 17, Storage 50 MiB, Auth email confirmations on, anonymous sign-in off, Google OAuth enabled via env, Analytics off, Realtime not configured in file.

### 3.2 Migrations (all 29 applied on live)

Forward files in `supabase/migrations/`. Live `list_migrations` matches this list exactly.

| Version | Purpose |
| --- | --- |
| `20260219000000` | Baseline enums + audit_logs, bank_configs, categories, clerk_users, profiles, transactions |
| `20260219044736` | Remote schema pull: more tables, functions, RLS, storage policies, `auth.users` trigger |
| `20260219051749` | Security hardening, `bulk_insert_transactions` |
| `20260221000000` | Expenses + receipts storage policies + category seed |
| `20260221100000` / `…0001` | **No-op stubs** (workspaces superseded) |
| `20260224000000` | Invoice reshape + `invoice_sequences` + `get_next_invoice_number` |
| `20260224100000` | `import_sessions`, `import_errors`, `duplicate_candidates` |
| `20260224110000` | `export_history` |
| `20260227100000` | Clerk invoice RLS (later reversed) |
| `20260228000000` | Seed regulatory `sources` |
| `20260228100000` | Restore `auth.uid()` invoice RLS |
| `20260302113000` / `…124500` / `…143000` | Documents idempotency / recovery / attempt ceiling (conditional) |
| `20260715143255` … `20260716180723` | July security wave (revoke anon, pin search_path, lock DEFINER, drop `pg_graphql`, restrict RPCs) |
| `20260804120000` | `profiles.deleted_at` |
| `20260804120100` | `categories.keywords` + merchant seed |
| `20260805140000` | Tax-rule provenance / unverified candidates |
| `20260813210027` | Anon SELECT grant on `tax_rules` for keep-alive (RLS still hides rows) |
| `20260813220000` | Tenancy spine: firms / members / clients |
| `20260814042344` | Re-grant authenticated SELECT on tax rules (calculator fix) |
| `20260814051117` | Wave C invoicing (`client_id`, archives, audit, `client_keys`) |
| `20260917133023` | Phase 3: 16 client-scoped domain tables |

Down files live in `supabase/migrations/down/` (manual only — `supabase db reset` does not apply them). Extra rollbacks: `supabase/rollbacks/`, `supabase/scripts/security_hardening_rollback.sql`.

**Seed not in migrations:** `/workspace/populate_tax_rules.sql` (main Nigeria Tax Act rule corpus). Live `tax_rules` = 35 rows — confirm against that file before treating Convex tax seed as complete.

### 3.3 Live public tables (47)

RLS is **on** for every public table. `client_keys` has RLS and **no authenticated policies** (access via RPCs only) — Security Advisor INFO, expected.

#### Identity & tenancy

| Table | Live rows | Isolation | Notes |
| --- | ---: | --- | --- |
| `profiles` | 5 | User (`auth.uid() = id`) + leftover Clerk OR policies | PK = `auth.users.id`. Soft-delete `deleted_at` |
| `clerk_users` | 1 | JWT `sub` | **Do not port** unless Clerk is revived |
| `firms` | 0 | `my_firm_ids()` | Owner auto-added via trigger |
| `firm_members` | 0 | Firm | roles: `owner` \| `staff` |
| `clients` | 0 | Firm write / member read | Taxable entity |

#### User-scoped domain (legacy)

| Table | Live rows | Isolation |
| --- | ---: | --- |
| `transactions` | 208 | `user_id` (+ Clerk OR policies still present) |
| `expenses` | 0 | User |
| `expense_categories` | 8 | Own **or** `user_id IS NULL` (system) |
| `expense_reports` | 0 | User |
| `ndpr_consents` | 0 | User |
| `tax_filings` | 0 | User |
| `tax_reports` | 0 | User |
| `financial_statements` | 0 | User |
| `file_uploads` | 0 | User |
| `import_sessions` | 45 | User |
| `import_errors` | 101 | Via session |
| `duplicate_candidates` | 0 | Via session |
| `export_history` | 100 | User |
| `audit_logs` | 0 | User insert/select; **schema mismatch risk** (§8) |

#### Client-scoped (Wave C + Phase 3) — all 0 rows

`invoices`, `invoice_sequences`, `invoice_archives`, `invoice_audit_logs`, `client_keys`, `tax_calculations`, `import_batches`, `documents`, `nrs_forms`, `form_filing_statuses`, `filing_audit_logs`, `filing_deadlines`, `deadline_reminders`, `categorization_predictions`, `categorization_feedback`, `user_learning_profiles`, `recurring_patterns`, `data_migration_logs`, `ml_inference_logs`, `merchant_categorizations`, `user_tax_years`.

#### Global / reference

| Table | Live rows | Access |
| --- | ---: | --- |
| `categories` | 23 | Authenticated read |
| `bank_configs` | 15 | Authenticated read (active) |
| `sources` | 8 | Authenticated (+ anon SELECT grant) |
| `rule_versions` | 2 | Authenticated read |
| `tax_rules` | 35 | Authenticated read; anon GRANT without policy → empty |
| `review_queue` | 1 | Authenticated read; no authenticated insert |
| `review_actions` | 0 | service_role only |

**Views / materialized views:** none in migrations.

**Enums in SQL:** `entity_type`, `filing_period`, `filing_status`, `subscription_tier`, `tax_treatment`, `tax_type`, `transaction_type`. Several columns later became `text + CHECK`.

### 3.4 Functions / RPCs

**Called from the app today**

| RPC | Call site |
| --- | --- |
| `get_next_invoice_number(client_id, tax_year)` | `src/lib/invoice-service.ts` |
| `get_client_signing_keys` | `src/lib/invoice-security.ts` |
| `upsert_client_signing_keys` | `src/lib/invoice-security.ts` |

**Exist in SQL, not called from app** (still need a Convex equivalent if behaviour is kept): `calculate_pit_2026`, `calculate_cit_2026`, `calculate_vat`, `get_active_rule_version`, `activate_rule_version`, `bulk_insert_transactions` (service_role), `log_audit_event`, `log_tax_calculation`, `get_tax_year_summary` (service_role), `get_clerk_user_id`, `get_current_user_id`, `suggest_category` (references columns not in migrations), `generate_transaction_hash` / `set_transaction_hash` (same).

**Internal helpers to reimplement as TypeScript, not SQL:** `my_firm_ids`, `accessible_client_ids`, `resolve_default_client_for_user`, `assign_client_id_from_user`, `handle_new_user`, `firms_after_insert_add_owner`, `update_*_updated_at`.

### 3.5 Storage

Live buckets (private, 0 objects): `bank-statements`, `documents`, `receipts`.

Policies (migrations): first path segment = `auth.uid()`. That is the tenancy **L2 storage trap** in `docs/TENANCY_DESIGN.md` — even if you later add `client_id` on rows, files stay user-folder-keyed.

ML models: S3, 50 MiB Supabase limit is why. Stay on S3 regardless of Convex.

### 3.6 Auth / Storage / Realtime / Edge (feature checklist)

| Supabase product | Used? | Convex analogue |
| --- | --- | --- |
| Postgres + RLS | **Yes — core** | Convex tables + custom functions (RLS equivalent) |
| Auth (GoTrue) | **Yes — production login** | Keep (option B) via custom JWT, or Convex Auth / Clerk (option A) |
| Storage | Buckets exist; **0 objects**; mobile code ready | Convex file storage **or** keep buckets until receipts are real |
| Realtime | Publication exists; **no app subscribers** | Free with Convex queries later |
| Edge Functions | **None** | Convex actions (`"use node"`) |
| GraphQL | Dropped (`pg_graphql`) | n/a |
| Advisors / lint | CI gate | Replace with Convex ESLint + tenancy tests |

---

## 4. Call-site map

### 4.1 Client factories

```
Browser  → src/lib/supabase/client.ts          (@supabase/ssr, anon + cookies)
RSC      → src/lib/supabase/server.ts          createServerClient()
API      → getSupabaseForRequest(request)      cookies or Bearer
Admin    → createAdminClient()                 service_role
Legacy   → src/lib/supabase.ts                 singleton anon (rule-loader default)
Mobile   → apps/mobile/lib/supabase/client.ts  anon supabase-js
Workers  → createClient(URL, SERVICE_ROLE)
```

Auth helpers: `src/lib/supabase/auth.ts`, `session.ts`, `queries.ts`. Route HOF: `src/lib/auth/with-auth.ts` (RBAC from `user.app_metadata.role`). Layout gate: `src/lib/auth.ts` `requireAuth()`.

### 4.2 Feature → tables → routes / modules

| Feature | Tables / RPCs | Primary call sites | Client |
| --- | --- | --- | --- |
| **Auth** | GoTrue; `profiles`; `audit_logs` | `login`, `signup`, `forgot-password`, `reset-password`, `verify-email`, `/auth/callback`, `/api/auth/*`, `AuthContext`, `RequireAuth`, `middleware.ts` | user / admin |
| **Admin users** | `auth.admin.*` | `/api/admin/users` | service_role |
| **Transactions** | `transactions`, `categories` | `/api/transactions*`, dashboard aggregation, export, YoY, reports | user |
| **Import** | `import_sessions`, `import_errors`, `duplicate_candidates` | `/api/transactions/upload-v2`, `import-history`, `duplicates` | user |
| **Import (new)** | `import_batches` | `src/lib/supabase/queries.ts` only | user |
| **Expenses** | `expenses`, `expense_categories` | `/api/expenses*`, mobile `sync-engine.ts` | user |
| **Receipts** | Storage `receipts` | mobile `receipt-upload.ts` only | user |
| **Invoices** | `invoices`, sequences RPC, signing RPCs, archives, audit | `/api/invoices*`, `(dashboard)/invoices/*`, `invoice-*.ts` | user |
| **Clients UI** | `clients` | `(dashboard)/invoices/new/page.tsx` | user |
| **Tax calc** | `tax_calculations`, `audit_logs` | `/api/calculations*`, dashboard | user |
| **Tax rules** | `rule_versions`, `tax_rules`, `sources` | `rule-loader.ts`, `rules-engine.ts`, `/api/tax-rules`, `/api/tax/*` | user / legacy anon singleton |
| **Tax reports / NRS** | `tax_reports`, `transactions` | `/api/tax-reports*`, `/api/nrs-filing/*` | user |
| **Forms / filing** | `nrs_forms`, `form_filing_statuses`, `filing_audit_logs` | `/api/forms*` | user |
| **Deadlines** | `filing_deadlines`, `deadline_reminders`, `profiles` | `/api/deadlines/upcoming`, `/api/reminders/history`, `deadline-service.ts` | user |
| **Year switch** | `user_tax_years` | `/api/year/*`, `year-context.tsx` | user |
| **Reports / FS** | `transactions`, `financial_statements` | `/api/reports/*`, `/api/financial-statements/generate` | user |
| **AI / ML** | `categories`, `categorization_*`, `ml_inference_logs`, `recurring_patterns`, `user_learning_profiles` | `/api/ai/*`, `/api/categorize`, `/api/ml/*`, `/api/feedback` | user + service_role for some logs |
| **Documents** | `documents`, `audit_logs` | `/api/v1/documents/[id]/status`, `supabase-document.repository.ts`, workers | user / service_role |
| **Export / history** | `export_history`, `audit_logs`, `transactions` | `/api/export/*`, `/api/history*` | user |
| **Migration tool** | `transactions`, `categories`, `nrs_forms`, `data_migration_logs` | `/api/migration/migrate` | user |
| **Keep-alive** | `tax_rules` | `/api/health/db`, `keepalive.yml` | anon + token |
| **Account delete** | `profiles.deleted_at`, `auth.admin.deleteUser` | `/api/auth/delete-account` | user + service_role |

### 4.3 Dashboard pages

**Direct Supabase in the page:** dashboard (invoices + tax_calculations), invoices list/new/detail (`invoices`, `clients`), reports + YoY (via `getTransactionTotals` → `transactions`), profile edit / logout (auth only).

**Auth-gated, data via `/api/*`:** transactions, expenses, calculators, tax-reports, categories, filing, export, settings, notifications, ML governance.

**No DB:** public marketing pages, `/api/contact` (Resend), `/api/health` (liveness), expense billing checkout (stub 503).

### 4.4 Tests that pin Supabase

- `src/__tests__/rls/cross-tenant.negative.test.ts` — real local JWTs, tenancy leak tests
- `src/__tests__/rls/pg-policies.snapshot.test.ts` — `pg` against policy catalog
- Most API tests mock `@/lib/supabase/server`
- `e2e/auth-flow.spec.ts` — real GoTrue login when secrets exist

Those RLS tests are the **acceptance suite for Convex custom functions**. Port the *cases*, not the Postgres.

---

## 5. Proposed Convex schema mapping

Convex is document-relational: flat documents, `Id<"table">` links, indexes instead of SQL RLS. **Do not nest** transactions under users. **Do not use `Date.now()` inside queries.**

### 5.1 Auth approach options (pick with CoS)

| Option | How it works | Fits |
| --- | --- | --- |
| **B1. Supabase Auth → Convex custom JWT** *(recommended with B)* | `convex/auth.config.ts` `customJwt` + issuer `https://<ref>.supabase.co/auth/v1` + JWKS. Client passes `access_token`. `ctx.auth.getUserIdentity().subject` = `auth.users.id`. | First cut. Login/signup/reset stay. |
| **A1. Convex Auth** | `@convex-dev/auth` email/password (+ OAuth later). Users table in Convex. | End state if you want zero Supabase. Password migration is extra work. |
| **A2. Clerk** | Official Convex Clerk provider. Schema leftovers exist; runtime does not. | Only if CoS re-opens the deferred Clerk plan. |
| **A3. Better Auth** | `@convex-dev/better-auth` component. | Greenfield-friendly; more rewrite than B1. |

All public Convex functions that touch user data must use `ctx.auth.getUserIdentity()` (or a custom wrapper). Replicate today’s `authedQuery` / `firmQuery` pattern from Convex custom functions — that **is** the RLS replacement.

### 5.2 Identity mapping during backfill

Keep the live UUID as `externalId` (string) on Convex docs so 208 transactions can be copied without rewriting FKs in one pass.

```
auth.users.id  ==  profiles.id  ==  transactions.user_id
                ↓
convex users.externalId (string) + users.tokenSubject (from JWT sub)
```

After soak, new rows use Convex `Id`s only.

### 5.3 Table map (Postgres → Convex)

Proposed names stay close to today so call-site rewrites are mechanical.

| Postgres | Convex table | Indexes (minimum) | Notes |
| --- | --- | --- | --- |
| `profiles` | `users` (or `profiles`) | `by_externalId`, `by_email`, `by_tokenSubject` | Split “practitioner” vs “taxable entity” fields when tenancy launches |
| `firms` | `firms` | `by_ownerUserId` | |
| `firm_members` | `firmMembers` | `by_firm`, `by_user`, `by_firm_and_user` | |
| `clients` | `clients` | `by_firm`, `by_firm_and_status` | |
| `transactions` | `transactions` | `by_user`, `by_user_and_date`, `by_category`, `by_client` (optional) | **Still user-scoped live.** Add `clientId` only if product requires it |
| `categories` | `categories` | `by_name` | Global |
| `bank_configs` | `bankConfigs` | `by_bank` | Global |
| `import_sessions` + `import_batches` | **One** `importSessions` | `by_user`, `by_client` | Consolidate; two tables is accidental dual-model |
| `import_errors` | `importErrors` | `by_session` | |
| `duplicate_candidates` | `duplicateCandidates` | `by_session` | |
| `expenses` | `expenses` | `by_user`, `by_user_and_date` | |
| `expense_categories` | `expenseCategories` | `by_user_and_name` | Keep system rows (`userId` optional) |
| `invoices` | `invoices` | `by_client`, `by_client_and_taxYear`, `by_user` | Port Wave C shape even if 0 rows |
| `invoice_sequences` | `invoiceSequences` | `by_client_and_taxYear` (unique) | Mutation must be single-occupancy (no SQL UPDATE … RETURNING) |
| `invoice_archives` / `invoice_audit_logs` | same names | `by_invoice`, `by_client` | 7-year NRS retention — do not drop |
| `client_keys` | `clientKeys` | `by_client` | Never return private material from a public query |
| `tax_calculations` | `taxCalculations` | `by_user_and_year`, `by_client` | |
| `tax_reports` / `tax_filings` | same | `by_user_and_year` | |
| `financial_statements` | `financialStatements` | `by_user_and_type` | |
| `tax_rules` / `rule_versions` / `sources` | same | `by_version_and_key` (unique) | Seed from `populate_tax_rules.sql` |
| `review_queue` / `review_actions` | same | `by_status` | Writes = internal mutations |
| `documents` | `documents` | `by_user_and_idempotencyKey`, `by_status` | Workers → `internalMutation` |
| `nrs_forms` + filing tables | same | `by_client`, `by_user` | |
| `filing_deadlines` / `deadline_reminders` | same | unique pair indexes as SQL | |
| ML / feedback / recurring / merchant | same | `by_user` / `by_client` + merchant | |
| `export_history` | `exportHistory` | `by_user` | NDPR: record *which* client if tenancy is on |
| `audit_logs` | `auditLogs` | `by_user`, `by_entity` | **Redesign columns** to match what the app inserts (see §8) |
| `user_tax_years` | `userTaxYears` | `by_user_and_year` | |
| `ndpr_consents` | `ndprConsents` | `by_user` | Legal: may need both actor + client later |
| `data_migration_logs` | `dataMigrationLogs` | `by_user` | |
| `file_uploads` | skip or `fileUploads` | | No app call sites; Storage empty |
| `clerk_users` | **skip** | | |

**Do not port** Drizzle-only ghosts: `users` (password_hash), `records`, `customers`, `bank_accounts`, `sessions`, `workspaces`.

### 5.4 Access wrappers (RLS → TypeScript)

```
authedQuery / authedMutation
  → identity required; load users row by tokenSubject

firmQuery / firmMutation
  → member of args.firmId

clientQuery / clientMutation
  → client.firmId ∈ caller's firm membership; skip archived

ownerQuery
  → resource.userId === ctx.user._id   // for still-user-scoped tables

adminMutation
  → app_metadata.role / users.platformRole (today: owner-only admin API)

internalMutation
  → workers, seeds, backfill (never scheduled as public api.*)
```

Replicate July security rules in wrappers, not as afterthoughts:

- No “authenticated insert with `USING (true)`” on review/internal tables
- No public/anon equivalent of `GRANT ALL TO anon`
- Signing-key reads only through dedicated mutations
- Invoice number allocation only inside one mutation (equivalent of `get_next_invoice_number`)

### 5.5 SQL tax functions → TypeScript

The app already computes tax in `src/lib/tax/*` and `src/lib/services/tax-computation-service.ts`. Postgres `calculate_*_2026` functions are **not** on the hot path. Port tests, not PL/pgSQL.

### 5.6 File storage

| Today | Option B | Option A later |
| --- | --- | --- |
| Empty `receipts` / `documents` / `bank-statements` | Leave buckets; mobile keeps supabase-js storage until first real upload | Convex `_storage` + HTTP actions for private files (do **not** expose raw `getUrl` for receipts) |
| S3 ML models | Unchanged | Unchanged |

### 5.7 Workers

BullMQ + Redis stay. Replace `createClient(SERVICE_ROLE)` with `ConvexHttpClient` calling **`internal.*`** mutations (never public `api.*` from a scheduler). Document intelligence adapters (`supabase-document.repository.ts`, `supabase-audit-log.adapter.ts`) get a Convex implementation behind the same ports.

---

## 6. Cutover options (detail + trade-offs)

### A — Full Convex (DB + Auth + Storage)

**Move:** all tables, login/signup/reset, admin user APIs, storage buckets, retire GoTrue.

**Pros:** One vendor; matches “off Supabase entirely”; Convex Auth session is first-class; no leftover JWT issuer.

**Cons:** Password/session migration for 5 users is small, but **every** auth surface (middleware, mobile Bearer, e2e, email templates, Google OAuth config) moves in the same window as 47 tables. Account delete, email confirm, and `app_metadata.role` must be redesigned. Highest schedule risk.

**Rollback:** hard — users may have Convex-only passwords.

### B — Data-only Convex, keep Supabase Auth (+ empty Storage)

**Move:** all `public` data + RPC behaviour. **Keep:** GoTrue, cookies, `/auth/callback`, mobile Bearer, keep-alive can become a Convex query later.

**Pros:** Smallest production-safe slice of IVA-60. Custom JWT is a documented Convex pattern. Storage decision can wait (0 objects). If Convex data is wrong, login still works and you can point reads back at Postgres.

**Cons:** Two vendors until A. JWT clock/JWKS dependency. Service-role admin APIs (`listUsers`, `deleteUser`) stay on Supabase. Free-tier Auth project can still pause if *Auth* is the only remaining traffic — plan Pro or a ping.

**Rollback:** flip `DATA_BACKEND=supabase` (feature flag) if dual-read was built for staging; or revert the Vercel deployment.

### C — Phased dual-write

**Move:** write Convex and Postgres; read Postgres; flip reads per domain (tax rules → transactions → rest).

**Pros:** Safest if the corpus is large or writes are continuous and unaudited.

**Cons:** Two RLS/wrapper implementations must stay equivalent. Invoice sequences and unique constraints are classic dual-write bugs. Current volume does not pay for that.

**Rollback:** stop Convex writes; Postgres remains source of truth.

### Suggested choice

```
CoS picks B (this document's recommendation)
  → Shipping implements B on a Convex *dev* deployment
  → staging rehearsal + RLS-equivalent tests
  → production data backfill (208 transactions + import/export + seeds + 5 profiles)
  → soak
  → separate ticket for A (Auth + Storage teardown)
  → IVA-60 “Supabase teardown” checkbox only after CoS go
```

If CoS wants **A in one go** because there are only 5 users: still do a **staging full-stack rehearsal**, but do not skip the auth e2e and delete-account paths.

---

## 7. Suggested milestones and PR contents

Repo convention (`docs/BRANCHING.md`): work integrates on **`staging`**; schema/security waves use a short-lived PR; `main` only receives `staging`. Treat Convex schema + wrapper PRs as **schema-wave equivalents** (PR required).

| # | Milestone | What the PR contains | Done when |
| --- | --- | --- | --- |
| **0** | **This PR** | `docs/convex-migration-plan.md` only | Kezie/CoS can pick A/B/C |
| **1** | Decision + freeze note | Short addendum in this doc: chosen option, freeze rules, owner | Written CoS decision |
| **2** | Convex project (dev only) | `convex/` schema + `auth.config.ts` (custom JWT if B) + `npx convex dev` in agent/dev docs. **Do not** set production Vercel Convex env | `convex dev` against anonymous/dev deployment |
| **3** | Access wrappers + tenancy | `convex/lib/customFunctions.ts`, users/firms/clients, port RLS negative cases to Convex | Cross-tenant tests fail closed |
| **4** | Reference data | categories, bankConfigs, sources, ruleVersions, taxRules + seed script from `populate_tax_rules.sql` | Calculators load a rule bundle from Convex |
| **5** | Transactions + import | tables + mutations; rewrite `/api/transactions*` (or call Convex from routes) | Upload-v2 + list/export parity on staging |
| **6** | Remaining domain | expenses, invoices+RPCs, tax_calculations, reports, forms, year, export, audit | Feature checklist green on staging |
| **7** | Documents + workers | Convex adapters + internal mutations; Redis stays | Processor/recovery against Convex |
| **8** | App cutover on staging | Remove supabase-js from domain paths (Auth remains if B); replace CI drift/advisors with Convex checks | Staging Vercel + Convex; `rls-negative` replaced |
| **9** | Production rehearsal | Freeze writes → export snapshot → import → checksum (count + sum(amount) per user) → unfreeze on Convex | CoS go / no-go |
| **10** | Soak + teardown ticket | Monitor Sentry; keepalive retargeted; **new** Linear ticket for Supabase delete | IVA-60 production checkbox; teardown is a *separate* go |

Milestone 0 is the only work in this PR.

Rough PR *shape* for later (not scheduled here): one domain per PR beats a monorepo rewrite. Do not combine Auth cutover (A) with Transactions (5) unless CoS explicitly chose A-in-one-go.

---

## 8. Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| **RLS parity** | Today RLS is the enforcement boundary on ~70 routes. Convex has no RLS; a missed wrapper is a cross-tenant leak. Permissive SQL policies **OR** together — do not copy that bug. | Port `cross-tenant.negative.test.ts` first. Custom functions only. No public `collect()` of user tables. |
| **Tenancy incomplete** | Client-scoped tables exist; live data and `transactions` do not use them. Phase 3 trigger throws without a client. | Product decision: user-scoped v1 on Convex **or** create default firm/client per user at backfill. Do not silently invent tenancy. |
| **Migrations already applied** | All 29 files are on live. Convex has no `supabase_migrations` equivalent. | Treat SQL history as frozen. New Postgres migrations during the Convex project create dual-write tax — freeze schema waves after decision, or apply to both. |
| **types.ts ≠ migrations ≠ live** | Hand types invent columns (`hash`, `tax_year` on transactions, VAT on profiles). | Generate Convex validators from **live** columns + `.insert()` call sites, not from `types.ts`. |
| **`audit_logs` dual schema** | Baseline columns vs `log_audit_event` / app inserts disagree. Live count is 0 so reshape is cheap. | Design Convex `auditLogs` from actual `insert({…})` in `src/`. |
| **Invoice sequences + signing keys** | Need atomic increment and private-key isolation. | Single mutation; `clientKeys` only via authenticated mutation; encrypt at rest in the app as today (`MASTER_ENCRYPTION_KEY`). |
| **Webhooks** | No Clerk/Paystack production webhooks in tree. | Do not invent a webhook migration. Revisit if billing ships before cutover. |
| **File storage** | Policies exist; 0 objects; mobile will upload to `receipts` the moment that path is used. | If B: keep buckets until first receipt. If A: Convex storage + authz on every download. Path `{userId}/` is not client-safe. |
| **Workers / Redis** | Service role bypasses RLS. A public Convex mutation with the same power is a hole. | `internalMutation` only; worker auth is a deploy key, not a user JWT. |
| **Keep-alive / Free tier** | Project pauses after inactivity. Auth-only leftover still pauses. | Retarget ping or upgrade. Do not delete keepalive until Convex (or Pro) is the live store. |
| **CI coupling** | drift, advisors, migrations-applied, rls-negative, e2e all assume Supabase. | Replace in milestone 8. Keep jobs green on Postgres until then. |
| **Mobile** | Bearer tokens are Supabase access tokens. | B: unchanged. A: new token issuer + mobile client rewrite. |
| **NDPR / NRS retention** | Invoice archives = 7 years. Export history is NDPR-relevant. | Convex docs must keep archives; retention job remains a product requirement. |
| **PITR** | Documented as MVP-required; Free has none. | Confirm Convex backup/restore story before production go; record a pre-cutover export. |
| **Public repo** | Secrets in git history already handled as a known issue. | Never commit Convex admin keys. `CONVEX_AGENT_MODE=anonymous` for cloud agents (`npx convex dev` only — not `deploy`). |
| **README / Clerk fiction** | Future agents will “restore Clerk”. | After cutover, rewrite README. Out of scope for this PR except this warning. |
| **Live data is no longer zero** | 208 transactions + import/export history. | Backfill + checksum. Do not use TENANCY_DESIGN’s “no data” line as gospel. |
| **Security Advisor leftovers** | DEFINER helpers executable by `authenticated`; leaked-password protection off. | Irrelevant after wrappers exist; if B keeps Auth, enable leaked-password protection on GoTrue as a cheap win (separate from Convex). |

---

## 9. Backfill sketch (for later — not this PR)

When CoS says go (milestones 9):

1. Record a timestamp and row counts (table in §1).
2. Export `auth.users` id/email mapping (if B: users stay in GoTrue; copy ids into Convex `users.externalId`).
3. Copy reference tables (categories, bank_configs, sources, rule_versions, tax_rules, expense_categories).
4. Copy `profiles` → Convex users.
5. Copy `transactions` (208), then import_* and `export_history`.
6. Skip empty domain tables or create empty Convex tables with indexes only.
7. **Do not** copy `clerk_users` unless Clerk is chosen.
8. Verify: per-user transaction count and `sum(amount)` match; import_session counts match.
9. Only then flip staging reads.

Production data must not be moved by a cloud agent on its own. Shipping + CoS.

---

## 10. Explicit non-goals (repeat)

This PR and this document do **not**:

- Cut over production or staging to Convex
- Delete or pause Supabase
- Change Vercel env to `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL`
- Run `npx convex deploy` (production-only command; never for this work)
- Add noisy `convex/` scaffolding (docs-first; schema lands in milestone 2 after a decision)
- Migrate JUO or any other project (`xxljlhgjjirewkovuzif` is out of scope)

---

## 11. Open questions for CoS / Kezie

1. **First cut A, B, or C?** (Recommend **B**.)
2. **Tenancy on day one?** Force a default firm/client per existing user, or keep `transactions` user-scoped until a practitioner launch?
3. **Clerk:** still deferred, or closed permanently?
4. **Freeze:** stop new Supabase migrations after decision, or accept dual-schema tax?
5. **Convex org/project:** who owns billing, and is the first deployment allowed to be a *dev* deployment only (required)?
6. **Production go window:** after staging soak — CoS sets this; not this PR.

---

## 12. Evidence log

| Check | Result | When |
| --- | --- | --- |
| Repo `package.json` | `@supabase/ssr` ^0.12.4, `@supabase/supabase-js` ^2.112.2; no Clerk, no Convex | plan write |
| Live project | `frlcvkmjuhnjcicwywrh` ACTIVE_HEALTHY, Postgres 17, `eu-west-1` | 2026-09-24 |
| Live migrations | 29 versions, matches repo | 2026-09-24 |
| Live row counts | §1 / §3.3 | 2026-09-24 |
| Storage | 3 buckets, 0 objects | 2026-09-24 |
| Edge functions | none in repo | plan write |
| App Realtime | no subscribers | plan write |
| `origin/main` vs `origin/staging` | same SHA at plan time | 2026-09-24 |

Granola meeting search was not available in this run (MCP unauthenticated). Prior product note on IVA-60: tradeoff review 2026-09-22; this ticket is the formal request.

---

*Kompleet-only. End of plan.*
