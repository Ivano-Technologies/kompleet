# KOMPLEET Multi-Tenancy Design — Practitioner / Client-Entity Refactor

**Status:** Analysis and design only. No code, schema, or migration changed. Nothing applied to Supabase.
**Date:** 2026-08-02

> ## ⚠️ SUPERSEDED — the effort estimate below is obsolete (2026-08-03)
>
> The prerequisite schema pull has now been run against the resumed project. It invalidated the estimate's central assumption.
>
> **Verified live:** `auth.users` = 4 (test accounts). `transactions`, `invoices`, `expenses`, `tax_filings` = **0 rows**. And the 11 "drift" tables in §1.2 **do not exist in the database at all** — nor do `records`, `workspaces`, or `workspace_members` (the last two despite having a migration in the repo).
>
> **Consequence:** §5's entire migration strategy — backfill, dual-write window, phased policy swap, storage-object move, mobile dual-support tail — addresses a problem that does not exist. There is no data to migrate. Risks #2, #4, #5, #7, #12, #13 largely evaporate; risk #1 becomes a design constraint rather than a migration hazard.
>
> **Revised estimate: ~4–6 engineer-weeks**, which *meets* the 6-week threshold. The §7 recommendation of a practitioner-console bridge is withdrawn — with 14 tables to build from scratch regardless, building them with a `client_id` from the start is close to free.
>
> **What remains fully valid:** §2 (table classification), §3 (RLS hazards L1–L8 — especially permissive-policy OR semantics and the storage-policy `auth.uid()` trap), §3.3 (target pattern), §4 (API surface — though ~15–19 of those routes currently query non-existent tables), and §2.5 (replace rather than generalise `workspaces`).
>
> See `docs/CURSOR_EXECUTION_PROMPT.md` for current ground truth. Read the rest of this document as design analysis, not as a plan.

---

## 0. Executive summary

| Item | Finding |
|---|---|
| Effort | **10–14 engineer-weeks**, medium-low confidence (optimistic 9, pessimistic 18) |
| 6-week threshold | **NOT met.** Roughly 2x over. Recommend the narrower product (§7). |
| Biggest single unknown | **9+ live tables have no DDL in the repo.** Estimate cannot be tightened without a prod schema pull. |
| Biggest single hazard | Storage-bucket policies + permissive-policy OR semantics during the swap |

---

## 1. Current state

### 1.1 Two contradictory schema sources

Resolve this first; it is not cosmetic.

| Source | Files | Status |
|---|---|---|
| Drizzle | `src/db/schema/{users,records,filings,banking,invoicing,expenses}.ts`, `drizzle/0000_military_hawkeye.sql` | Largely **stale / not the live schema** |
| Supabase migrations | `supabase/migrations/*.sql` (21 files) | **Live schema** for most tables |

Proof of divergence — `transactions`:

- `src/db/schema/banking.ts` defines it with **no `user_id`**, keyed via `bank_account_id → bank_accounts.id`.
- `supabase/migrations/20260219000000_baseline.sql:88` defines it with `user_id uuid not null references auth.users(id)`, plus `clerk_user_id`, `transaction_date`, `category_id`, and a generated `tax_year`.
- All API routes query the Supabase shape (`.eq("user_id", …)`, `tax_year` filters).

Likewise `src/db/schema/users.ts` defines `users` with `password_hash` — live uses `auth.users` + `public.profiles` + `public.clerk_users`. `filings.ts` defines `filings`; the live table is `tax_filings`. `records.ts` defines `records`; **no route queries it**.

**Decision required before work starts:** delete or quarantine `src/db/schema/` and `drizzle/`. An engineer using the Drizzle types to plan the rollout will write a wrong migration.

### 1.2 Tables referenced by live code with no DDL in the repo

Cross-referencing every `.from("…")` in `src/app/api/**/route.ts` against all `create table` statements:

| Table | Referenced by |
|---|---|
| `tax_calculations` | `calculations/*` (4 routes) |
| `user_tax_years` | `year/available`, `year/switch` |
| `nrs_forms` | `forms/*` (4 routes) |
| `filing_audit_logs` | `forms/generate`, `forms/[id]/download`, `forms/[id]/mark-filed` |
| `filing_status` | `forms/[id]/mark-filed` |
| `email_connections` | `email/callback/gmail` |
| `deadline_reminders` | `reminders/history` |
| `ml_inference_logs` | `ai/categorize` |
| `categorization_predictions` | `categorize` |
| `bank_accounts` | `banking/mono/*` — Drizzle only, **no Supabase migration, no RLS policy in repo** |
| `customers` | Drizzle only; no route uses it |

**RLS on these is invisible.** Nine are client-scoped tax data. `bank_accounts` is the concern: three routes read/write it through the RLS-respecting client, but there is no `enable row level security` or policy for it anywhere in the repo. Either it was applied out-of-band, or those routes silently fail.

### 1.3 Auth model

- 70 of 79 routes use `getSupabaseForRequest(request)` — anon key + user JWT. **RLS is the enforcement boundary.**
- Only 3 routes use service role: `admin/users`, `ai/categorize`, `auth/delete-account`.
- `src/lib/auth/rbac.ts` already has a `tax_consultant` role — but it is a **global platform role**, not client-scoped. Unused by tenancy.
- `public.get_current_user_id()` falls back Clerk → `auth.uid()`. Tables like `transactions` carry **both** `user_id` and `clerk_user_id`, with **both** policy families live (§3.2, L1).

---

## 2. Schema impact

### 2.1 Tier A — needs a `client_id` FK

`transactions`, `expenses`, `expense_reports`, `invoices`, `invoice_sequences`, `tax_filings`, `tax_reports`, `financial_statements`, `file_uploads`, `import_sessions`, `import_errors`, `duplicate_candidates`, `export_history`, plus the 7 unknown tables above and `bank_accounts` / `customers`.

**Count: 22 tables** (13 confirmed + 7 unknown + 2 uncertain).

Notable: `invoice_sequences` must re-key `UNIQUE(user_id, tax_year)` → `UNIQUE(client_id, tax_year)` (risk #5). `file_uploads.storage_path` must be rewritten. `export_history` is NDPR-relevant — it must record *which client's* data was exported.

### 2.2 Tier A-ambiguous — needs a decision, not just a column

| Table | Issue |
|---|---|
| `expense_categories` | `user_id` nullable; `NULL` = system category. Per-client custom categories means 200x duplication for a practitioner wanting one chart of accounts. **Recommend firm-scoped (`firm_id`)**, with the `NULL` branch replaced by explicit `is_system boolean`. |
| `ndpr_consents` | Data subject is the client's business; consenting actor is the practitioner. Needs **both** `client_id` and `consented_by_user_id`, and **legal sign-off** — not purely an engineering decision. |
| `email_connections` | Practitioner's mailbox or client's? Determines Tier A vs B. Unknown table, unknown intent. |
| `audit_logs` | `user_id` stays as **actor**; add `client_id` as **context**. Do not swap — swapping destroys accountability. |
| `ml_inference_logs` | Same pattern: actor stays, add client context. |

### 2.3 Tier B — unchanged

`profiles` (but `entity_type`, `tin`, `company_name`, `rc_number`, `fiscal_year_start`, `subscription_tier` are **entity attributes that must move to `clients`** — the practitioner is not a taxable entity), `clerk_users`, `sessions`.

### 2.4 Tier C — global reference data, no tenancy

`categories`, `bank_configs`, `tax_rules`, `rule_versions`, `sources`, `review_queue`, `review_actions`.

### 2.5 `workspaces` / `workspace_members` — replace, do not generalise

Current: `workspaces(id, name, owner_id)`, `workspace_members(workspace_id, user_id, role ∈ {viewer, editor})`, `expenses.workspace_id` nullable `ON DELETE SET NULL`. Used by 2 routes, touches 1 domain table.

1. **Semantic mismatch.** A workspace is a *collaboration group*; a client is a *taxable entity*. If workspace == client, a two-person firm with 200 clients needs 400 membership rows and has **no object representing the firm** — nowhere to hang billing, branding, or "list all my clients."
2. **Role vocabulary is wrong.** `viewer | editor` has no `owner`/`admin`; ownership is a column, not a role.
3. **Its policies already contain the recursion trap.** `workspace_members_select` selects from `public.workspace_members` inside its own `USING` clause. This works today only as a self-join Postgres does not re-enter RLS for in this specific form. Extending the pattern to a `client_members` table referenced by 22 other tables' policies produces either `42P17 infinite recursion detected in policy` or a per-row seq scan.
4. **Replacement is cheap** — 2 routes, 1 nullable column, no cascade risk. A day, not a week.

**Proposed:**

```
firms (id, name, owner_user_id, subscription_tier, ...)
  └── firm_members (firm_id, user_id, role ∈ owner|admin|staff|viewer)
  └── clients (id, firm_id, legal_name, tin, rc_number, entity_type,
               fiscal_year_start, address, status, archived_at)
        └── client_assignments (client_id, user_id)   -- for restricted clients
```

---

## 3. RLS impact — the critical section

~60 policies in the repo + 9 storage policies + unknown on the drift tables. Assume **75–85 total** to review, **~50 to rewrite**.

### 3.1 Constraints imposed by the six July security migrations

| Migration | Constraint on this refactor |
|---|---|
| `…143255_fix_review_queue…` | Precedent: writes to internal tables go through `service_role`, never a permissive `authenticated` policy. New tenancy-admin tables must follow — no `WITH CHECK (true)` for convenience. |
| `…144130_revoke_anon_access…` | **A hardcoded table list, not a policy.** Supabase's default `GRANT ALL ON TABLES TO anon` means **every new table** (`firms`, `clients`, `firm_members`, `client_assignments`) is anon-exposed on creation. Lint 0002/0006 regresses silently. Every new table needs an explicit revoke in the same migration that creates it. |
| `…144155_pin_function_search_path` | Every new function — the membership helper is unavoidable — must be `SET search_path = public, pg_temp` or lint 0011 regresses. |
| `…144214_lock_down_security_definer…` | New `SECURITY DEFINER` helpers need `revoke execute … from anon, public` + `grant … to authenticated, service_role`. |
| `…180704_disable_unused_graphql_api` | Do not reinstall `pg_graphql` to introspect the new schema. |
| `…180723_restrict_security_definer_rpcs` | **Highest-risk regression surface.** See L4/L5. |

### 3.2 Where a naive `user_id → client_id` swap opens leakage

**L1 — Permissive policies OR together. Adding without dropping is a full bypass.**

Every policy here is `AS PERMISSIVE`, so same-command policies combine with `OR`. `transactions` already carries **two overlapping families**: `transactions_select_own` (`auth.uid() = user_id`) and `transactions_select_clerk` (`clerk_user_id = jwt.sub OR user_id = auth.uid()`). Both live.

Adding a client policy alongside yields:
```
client_id ∈ my_clients  OR  user_id = auth.uid()  OR  clerk_user_id = jwt.sub
```
Combined with the likely backfill shortcut (re-parenting client rows to the practitioner's `user_id` so old code keeps working), the residual `user_id` clauses become an unconditional "see all my clients" grant that **ignores `client_assignments` entirely** — and cross-firm if any `user_id` lineage is ever shared.

**Mitigation:** `DROP POLICY` and `CREATE POLICY` in the **same transaction**, per table. Never two-phase. Assert via a `pg_policies` snapshot test that no policy referencing bare `user_id` survives on a Tier A table.

**L2 — Storage policies. Highest severity.**

Nine policies across three buckets use:
```sql
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text)
```

The naive swap to `= <client_id>::text` leaves **no `auth.uid()` in the predicate at all**. Whatever supplies `<client_id>` becomes the entire authorization decision — if that is a header, GUC, query param, or influenceable JWT claim, any authenticated user reads any client's raw bank statements by enumerating UUIDs. These buckets hold the most sensitive data in the system.

Correct form keeps `auth.uid()` inside:
```sql
using (
  bucket_id = 'receipts'
  and ((storage.foldername(name))[1])::uuid in (select public.accessible_client_ids())
)
```

Separately: existing objects are physically stored under `<user_id>/`. Swapping the policy without moving objects makes every file unreachable; moving without swapping in lockstep makes them readable by the wrong party.

**L3 — `expense_categories` NULL escape hatch becomes a global broadcast.**

`using (auth.uid() = user_id or user_id is null)` mechanically translated to `client_id is null` means **any row any tenant writes with NULL `client_id` is visible to every tenant** — and `client_id` is nullable throughout the entire migration window. Replace the NULL sentinel with explicit `is_system boolean`, CHECK-constrain non-system rows to NOT NULL, restrict `is_system = true` inserts to `service_role`.

**L4 — `get_next_invoice_number` identity guard.**

July added `IF v_caller <> p_user_id THEN RAISE EXCEPTION`, closing an IDOR. Under tenancy the signature becomes `(p_client_id, p_tax_year)`, at which point `v_caller <> p_client_id` is meaningless (a user id never equals a client id). Under time pressure the guard gets **deleted**, reopening the IDOR as a cross-tenant one — any practitioner burns sequence numbers on another firm's client. Correct replacement:
```sql
IF NOT EXISTS (SELECT 1 FROM public.accessible_client_ids() a WHERE a = p_client_id) THEN
  RAISE EXCEPTION 'permission denied: client not accessible to caller';
END IF;
```

**L5 — Re-granting the revoked RPCs.** `bulk_insert_transactions`, `get_tax_year_summary`, `log_audit_event` were revoked from `authenticated` precisely because they take a client-supplied user id. Pressure to re-grant with `p_client_id` directly regresses July's work. **Rule: they stay `service_role`-only.** Bulk import runs in a route handler using `createAdminClient()` after an explicit server-side membership check.

**L6 — Subquery policies on `import_errors` / `duplicate_candidates`.** `using (session_id in (select id from import_sessions where user_id = auth.uid()))`. Same failure as L2 if `auth.uid()` is removed. Note these are `FOR ALL` with **no `WITH CHECK`** — the `USING` clause is reused for write checks, so an error affects writes too.

**L7 — `review_queue` reads.** `USING (true)` for authenticated; July removed the insert policy but left this. Internal regulatory-review data, so severity is lower than it looks — but under a practitioner model every accountant at every firm reads your pending rule changes. One-line fix.

**L8 — `expenses.workspace_id` orphan path.** The `expenses_select` policy is `auth.uid() = user_id` and **does not consider `workspace_id` at all** — workspace sharing is enforced nowhere in RLS today. Any design assuming workspace membership already grants row access is wrong.

### 3.3 Target pattern

```sql
create or replace function public.accessible_client_ids()
returns setof uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select c.id
  from public.clients c
  join public.firm_members fm on fm.firm_id = c.firm_id
  where fm.user_id = auth.uid()
    and c.archived_at is null
    and (not c.restricted or exists (
      select 1 from public.client_assignments ca
      where ca.client_id = c.id and ca.user_id = auth.uid()))
$$;

revoke execute on function public.accessible_client_ids() from anon, public;
grant execute on function public.accessible_client_ids() to authenticated, service_role;
```

Every property is load-bearing: `SECURITY DEFINER` avoids RLS recursion (hence the pinned `search_path` and revokes per July); `STABLE` lets the planner evaluate once per statement as an InitPlan; `in (select …)` rather than a correlated `EXISTS` avoids per-row re-evaluation at 200 clients × 500k transactions.

Write policies additionally need a role check so a `viewer` cannot write. **~22 indexes required**, one per Tier A table, e.g. `(client_id, tax_year, transaction_date desc)` — without them the portfolio dashboard seq-scans every domain table.

---

## 4. API surface — 79 routes

| Category | Count |
|---|---|
| **(a) Needs client context** | **48** |
| **(b) Practitioner-scoped / unchanged** | **9** |
| **(c) No tenancy** | **22** |

(a) breaks down as: transactions & import 10, expenses 5, tax calculations & reports 8, filings & NRS forms 7, financial statements 4, invoicing 2, banking 3, export & audit 7, tax year 2.

**Notable exceptions:**

- **7 routes have no direct `.from()` call** (`v1/documents/*`, `ingest`, `expenses/ocr`, `ml/*`, `deadlines/upcoming`, `nrs-filing/deadlines`) — DB access is one layer down in `src/lib/`. Categorised (c) mechanically but **most are probably (a)**. Estimate assumes (a).
- **`auth/delete-account`** bypasses RLS and must be rewritten: deleting a practitioner must not orphan or cascade-delete 200 clients' statutory records. Legal-retention question, not just code.
- **`analytics/yoy/summary` + `reports/*`** — a practitioner will want cross-client portfolio roll-ups. That is **net-new product, not refactor.** Do not let it get scoped in silently.
- **14 pages/components query Supabase directly** from the client, bypassing the API layer and relying on RLS alone. They fail *silently* (empty lists) rather than loudly if the policy swap is wrong.

---

## 5. Migration strategy

### 5.1 Backfill

One firm + one client per existing user, mapped through a temp table, then batched `update … set client_id = m.client_id` per Tier A table. Preserves behaviour exactly: every current user becomes a one-client practice.

**`workspaces` backfill needs product sign-off.** Expenses with a `workspace_id` belong to a shared bucket with no single owning entity today; they likely map to the workspace-owner's default client. That is a **genuine data-semantics loss** — a wrong answer silently misattributes expenses between taxable entities.

### 5.2 Phasing

**Zero-downtime for web. Not cleanly for mobile** (risk #7).

| Phase | Action | Lock |
|---|---|---|
| 0 | Create tenancy tables + revokes + RLS | None |
| 1 | `add column client_id` nullable × 22 | No rewrite (PG 11+), sub-ms |
| 2 | Batched backfill | Row-level |
| 3 | `create index concurrently` × 22 | Non-blocking |
| 4 | FK `NOT VALID` → `validate constraint` | `SHARE UPDATE EXCLUSIVE` |
| 5 | Deploy release N: **dual-write** | None |
| 6 | Soak; verify `count(*) where client_id is null = 0` | None |
| 7 | **Policy swap**, per table, one transaction | `ACCESS EXCLUSIVE`, ms |
| 8 | Deploy release N+1: read via `client_id` | None |
| 9 | `SET NOT NULL` via CHECK → VALIDATE → SET | Non-blocking |
| 10 | Rename `user_id` → `created_by_user_id`; drop workspaces | Brief |
| 11 | Storage object move + policy swap | **Own window** |

**The risk is not downtime — it is phase 7.** A half-applied swap leaves a table with either no matching policy (zero rows — loud, recoverable) or both old and new (**leakage — silent, not recoverable**). Capture a `pg_policies` snapshot before starting; it is the only rollback path from phase 7 onward. Phase 11 is hardest to reverse — do it last, and copy rather than move.

---

## 6. Risk register

| # | Risk | Likelihood | Impact | Early-warning signal |
|---|---|---|---|---|
| 1 | **Cross-tenant leakage from RLS swap** (L1/L2/L3/L6) | High | Catastrophic — regulated tax data, NDPR | CI negative-test suite: two firms with real JWTs, assert firm A sees exactly its rows and zero of B's for every table × every command. Plus `pg_policies` snapshot diff failing the build on any surviving bare `user_id`. **Must exist before phase 1, not after phase 7.** |
| 2 | **Schema drift — 9+ live tables invisible** | Certain | High — ±3 weeks | `supabase db pull` + `pg_policies` dump in week 0. **Currently blocked: project is INACTIVE.** |
| 3 | **Two competing schema definitions** | High | High — wrong migration written confidently | Quarantine `src/db/schema/` + `drizzle/` in the first commit |
| 4 | **Storage bucket migration** | Med-High | Catastrophic (leak) or High (files unreachable) | Per-object script asserting exactly one tenant can `select` it, before and after |
| 5 | **Invoice numbering corruption** — shared `UNIQUE(user_id, tax_year)` across clients | Med-High | High — NRS compliance, irreversible once `is_immutable` | Property test: N clients × M concurrent creations; assert per-client monotonic, gap-free, non-overlapping |
| 6 | **Security-lint regression** — new tables default anon-granted | High | Medium — undoes audited work | Supabase advisors as a **failing** CI gate, baseline 0 |
| 7 | **Mobile breakage** — `sync-engine.ts` writes `expenses` directly | High | Med-High | App-store review + upgrade tail is weeks, outside engineering control. Last build is 2026-03-04 — **check whether mobile is even live before spending here** |
| 8 | **Policy performance collapse at 200 clients** | Medium | Medium | Seed 200-client fixture; assert via `EXPLAIN ANALYZE` that helper appears as InitPlan, not per-row SubPlan |
| 9 | **`profiles` carries entity attributes**; `subscription_tier` drives billing | Medium | Medium — wrong TIN on a filed return is real-world harm | Test asserting every NRS form / invoice pulls TIN from `clients`, never `profiles` |
| 10 | **NDPR consent semantics unresolved** | Medium | Med-High — **legal** blocker, not engineering | Raise with counsel week 1; if unresolved by week 3, descope client-delegated consent from v1 |
| 11 | **Clerk↔Supabase dual identity** | Medium | Medium — doubles every policy | Complete auth consolidation **before** tenancy. Doing both at once multiplies them. |
| 12 | **`auth/delete-account` cascade** could delete 200 clients' statutory records | Low-Med | Catastrophic if it fires | Explicit test: delete a firm owner with clients, assert client records survive |
| 13 | `expenses.workspace_id` semantics loss | Low | Low-Med — silent misattribution | Count rows first; if small, migrate manually with product review |

---

## 7. Effort

| Workstream | Weeks |
|---|---|
| W0 — prod schema pull, drift reconciliation, quarantine Drizzle, `pg_policies` baseline | 0.5–1.0 |
| W1 — tenancy schema + workspace replacement | 1.0–1.5 |
| W2 — `client_id` columns, indexes, FKs, backfill + verification × 22 tables | 1.5–2.0 |
| W3 — RLS rewrite: helper + ~50 policies + 9 storage + role-aware writes | 1.5–2.5 |
| W4 — API: client context on 48 routes + `withAuth` extension | 2.0–3.0 |
| W5 — Frontend: client switcher + scoping across 66 pages / 54 components | 2.0–3.0 |
| W6 — Test infra: cross-tenant suite, snapshot test, advisors gate, perf fixture | 1.0–1.5 |
| W7 — Migration execution, storage move, rollback rehearsal | 0.5–1.0 |
| W8 — Mobile + dual-write window (only if mobile is live) | 0.5–1.0 |
| **Total** | **10.5–15.5** |

**10–14 engineer-weeks, medium-low confidence. Optimistic 9, pessimistic 18.**

Confidence is medium-*low* because of risk #2: between 7 and 11 live tables have no DDL and no visible RLS. If they are simple `user_id`-keyed tables the estimate holds at ~10–11; if any have unusual keying (as `transactions` did) or their own escape hatches, add 2–4. Secondary drag: if the Clerk↔Supabase consolidation must finish first, add 2–3 weeks *before* week 1.

### Against the ~6-week threshold

**Not met.** Realistic range is ~2x the threshold; even the optimistic case exceeds it by 50%.

This is not shaded in either direction. The number is driven by three countable things: **22 tables** needing a new FK and backfill, **~50 RLS policies** (+9 storage) needing rewrite, and **48 of 79 API routes** needing a client context — on a codebase where the schema source of truth is ambiguous and 9+ live tables are invisible to static analysis. Any one alone is 2–3 weeks. There is no version where all three plus the frontend fit in six.

### The honest 6-week alternative

**Not** a partial version of this refactor — a half-applied tenancy model is the worst outcome available, because it produces exactly the L1 leakage above.

The defensible narrow product is a **practitioner console over unchanged per-user tenancy**:

- Add `firms`, `firm_members`, and `client_grants(firm_id, client_user_id, granted_at, granted_by)`. Each client remains a real Supabase user account, exactly as today.
- The practitioner path goes through route handlers using `createAdminClient()`, each performing an explicit server-side membership check against `client_grants`.
- **Zero existing RLS policies change.** All 60+ policies, the six security migrations, and the storage policies stay exactly as audited. Existing single-SME users are unaffected.
- **~4–5 weeks:** new tables + grant/invite flow + ~15 console routes + client-list UI.

**The cost, stated plainly:** authorization for the practitioner path moves from RLS (declarative, database-enforced, defence-in-depth) to application code (imperative, one missed check from a leak). That is a real downgrade and must be a conscious decision — mitigated by a single mandatory `withClientAccess` wrapper every practitioner route must use, plus a lint rule failing any route that imports `createAdminClient` without it.

It is a bridge, not the end state. Converting it to real tenancy later still costs the full 10–14 weeks, plus migrating whatever the console accumulated.

---

## 8. Explicit uncertainties

1. **Row counts unknown** — backfill duration and phase-2 lock exposure unestimatable.
2. **Whether `bank_accounts` / `customers` exist in production at all.** Drizzle-only. If `bank_accounts` does not exist, the three `banking/mono/*` routes are dead code — which would *reduce* scope.
3. **Which invoice RLS generation is live.** Three migrations define overlapping `invoices` policies with the same names. Only a prod `pg_policies` dump resolves it.
4. **The 7 routes with no direct `.from()`** — believed (a), assumed as such in the estimate.
5. **Whether the mobile app is live.** Last AAB 2026-03-04. If not shipped, W8 disappears and risk #7 evaporates.
6. **Status of the Clerk→Supabase migration** (`docs/AUTH_MIGRATION_PLAN.md` exists, currency unassessed). Hard dependency.
7. **NDPR consent is a legal question**, flagged not resolved.
8. **Cross-client portfolio views are net-new product**, excluded from the estimate.
