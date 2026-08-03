# Phase 3 Brief — Tenancy Spine + 19 Tables

**Date:** 2026-08-04
**Prereq:** #55 → #56 → #57 merged; `DATABASE_URL` + `SUPABASE_ACCESS_TOKEN` repo secrets set.
**Scope:** the tenancy spine, a cross-tenant test harness, and 19 tables built multi-tenant from birth.

This is the largest phase in the plan and the only one that is expensive to get wrong. Work in waves, gate each one, and stop at anything marked **ASK**.

---

## 1. Ground rules

1. **All work on a Supabase branch.** `create_branch` → apply → verify → `merge_branch`. Never against production.
2. **Every domain table carries `client_id` at creation.** No `user_id`-only table intended for retrofit. Retrofitting is where the L1–L8 leakage risks in `docs/TENANCY_DESIGN.md` §3.2 live.
3. **Every migration that creates a table also contains its own `revoke all … from anon`.** Supabase grants `anon` by default; `20260715144130` is a hardcoded list of 9 tables and will not cover anything new. Miss this and the July security work silently regresses.
4. **One migration per wave**, not per table — keeps policy creation atomic per wave.
5. **The negative test suite exists before the first domain table.** Not after.

---

## 2. Scoping decisions — read before writing any DDL

The most common way to get multi-tenancy wrong is scoping a table to the wrong axis. Three axes exist:

| Axis | Meaning | Policy predicate |
|---|---|---|
| **client** | Belongs to a taxable entity | `client_id in (select accessible_client_ids())` |
| **firm** | Belongs to the practice, shared across its clients | `firm_id in (select my_firm_ids())` |
| **actor** | Records who did something | `user_id = auth.uid()` **plus** `client_id` as context |

### Table-by-table

| Table | Axis | Note |
|---|---|---|
| `tax_calculations` | client | |
| `nrs_forms` | client | |
| `filing_status` | client | |
| `filing_audit_logs` | client + actor | Keep `user_id` as *who filed*; add `client_id` as *for whom*. Do not swap. |
| `filing_deadlines` | client | Deadline definitions |
| `deadline_reminders` | client | Reminders actually sent |
| `invoice_archives` | client | |
| `invoice_audit_logs` | client + actor | Same pattern as `filing_audit_logs` |
| `documents` | client | 13 refs — see §5 |
| `import_batches` | client | |
| `data_migration_logs` | client + actor | |
| `recurring_patterns` | client | Detected per entity, not per practice |
| `categorization_predictions` | client | |
| `ml_inference_logs` | actor + client context | Observability. Writes **non-fatal**. |
| `merchant_categorizations` | **firm** | A practice's learned categorizations apply across its own clients — but must never leak across firms |
| `categorization_feedback` | **firm** + actor | The practitioner's corrections are practice knowledge |
| `user_learning_profiles` | **firm** | Rename → `firm_learning_profiles` |
| `user_tax_years` | client | Rename → `client_tax_years` — fiscal year is an entity property |
| `user_keys` | client | Rename → `client_keys` — see §5 |

### Renames — do these now, not later

Three tables carry `user_` prefixes that will be actively misleading under the practitioner model:

- `user_tax_years` → **`client_tax_years`**
- `user_keys` → **`client_keys`**
- `user_learning_profiles` → **`firm_learning_profiles`**

Update the call sites in the same commit. Renaming later means touching the policies again.

### Entity attributes moving off `profiles`

`tin`, `rc_number`, `company_name`, `entity_type`, `fiscal_year_start` describe a *taxable entity*, not a practitioner. They belong on `clients`. `subscription_tier` stays with `firms` and drives billing.

**ASK before migrating these** — `src/lib/expense-premium.ts` reads `subscription_tier` off `profiles`, and NRS form generation reads `tin`. Both need updating in lockstep or you will file returns with a missing or wrong TIN, which is real-world harm.

---

## 3. Wave order

Each wave: migration → `supabase gen types` → `pnpm typecheck` → negative suite → relevant E2E → commit.

| Wave | Contents | Why here |
|---|---|---|
| **A** | `firms`, `firm_members`, `clients`, `client_assignments`, `accessible_client_ids()`, `my_firm_ids()` | Everything else references these |
| **B** | Cross-tenant negative test harness (§4) | Must exist before any domain table |
| **C** | `tax_calculations`, `client_tax_years`, `merchant_categorizations` | `tax_calculations` is queried client-side by the dashboard landing page — the most visible breakage. `merchant_categorizations` unblocks the Claude cost control. |
| **D** | `nrs_forms`, `filing_status`, `filing_audit_logs`, `filing_deadlines`, `deadline_reminders` | The compliance output — the product's purpose |
| **E** | `documents` | Own wave; 13 refs, own module (§5) |
| **F** | `invoice_archives`, `invoice_audit_logs`, `client_keys` | `client_keys` needs deliberate design (§5) |
| **G** | `import_batches`, `data_migration_logs`, `recurring_patterns`, `categorization_predictions`, `ml_inference_logs`, `categorization_feedback`, `firm_learning_profiles` | Remainder |

**Gate after each wave:** drift count decreases by exactly the number of tables in that wave. Advisors unchanged from baseline. Negative suite green.

**CI enforces the drift gate via `.schema-drift-baseline`.** The file holds the max allowed missing-table count (currently `18`). `pnpm check:schema-drift` fails only when the live count **exceeds** that number. Every wave’s PR must:

1. Add the tables for that wave.
2. Decrement `.schema-drift-baseline` by the same number (visible in the diff).
3. Leave the job failing if the count did not drop — do not raise the baseline to paper over missed tables.

Wave A (spine only) adds no detector-visible domain tables — baseline stays put. Wave B is tests only. Waves C–G each decrement by their table count.

---

## 4. Cross-tenant negative suite — Wave B, non-negotiable

The single highest-value artifact in this phase. Per `docs/TENANCY_DESIGN.md` risk #1.

**Shape:** seed two firms, each with two clients and a real Supabase JWT per member. For every table in a generated list, and for each of SELECT / INSERT / UPDATE / DELETE, assert:

- Firm A's member sees **exactly** firm A's rows
- Firm A's member sees **zero** of firm B's rows
- Firm A's member **cannot write** into firm B's client
- A `viewer` role cannot write at all
- A restricted client is invisible to a member without a `client_assignments` row

**Plus a policy snapshot test:** dump `pg_policies`, fail the build if any policy on a client-scoped table references bare `user_id` without a membership predicate. This is what catches the L1 permissive-OR failure mechanically rather than by review.

The suite must be **table-driven from a list**, so adding a table in a later wave automatically adds coverage. A hand-written per-table suite will drift.

---

## 5. The two tables needing design, not reconstruction

### `client_keys` (was `user_keys`)

Holds cryptographic signing material for NRS-compliant invoice QR codes (`src/lib/invoice-security.ts`).

- **Private key material must be encrypted at rest** — not a plain `text` column. Use Supabase Vault or application-level envelope encryption with the key in env, never in the table.
- RLS must be strictly client-scoped **and** write-restricted; a `viewer` must never read key material.
- Explicit `revoke all … from anon` and from `authenticated` where possible — prefer access via a `SECURITY DEFINER` function over direct table reads.
- **ASK** before implementing: confirm whether keys are per-client (invoice issued by the entity — most likely) or per-firm (practice signs on behalf). This determines whether a practitioner switching clients re-signs with different material, which has compliance implications.

### `documents`

13 references from `modules/document-intelligence/infrastructure/persistence/supabase-document.repository.ts` — the OCR pipeline, and the best-engineered module in the codebase.

- Read the repository port and the `document.entity.ts` domain model first; the entity is the schema specification here, more so than the `.from()` calls.
- Storage-object paths are involved. **Storage policies must keep `auth.uid()` inside the predicate** — see `docs/TENANCY_DESIGN.md` §3.2 L2. A policy of the form `(storage.foldername(name))[1] = <client_id>` with no `auth.uid()` makes whatever supplies the client id the entire authorization decision.
- There are no existing objects to migrate (0 rows), so choose the final path convention now: `<client_id>/<document_id>/…`.

---

## 6. Migration template

Every table follows this shape. Deviations should be deliberate and noted in the PR.

```sql
create table public.<table> (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  -- … columns reconstructed per docs/MISSING_TABLES_RECOVERY_PLAN.md §1 …
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Supabase grants anon by default; this is required on EVERY new table.
revoke all on public.<table> from anon;

alter table public.<table> enable row level security;

create policy "<table>_select" on public.<table>
  for select to authenticated
  using (client_id in (select public.accessible_client_ids()));

create policy "<table>_write" on public.<table>
  for all to authenticated
  using (client_id in (select public.writable_client_ids()))
  with check (client_id in (select public.writable_client_ids()));

create policy "<table>_service" on public.<table>
  for all to service_role using (true) with check (true);

create index idx_<table>_client on public.<table> (client_id, created_at desc);
```

Note `(select public.accessible_client_ids())` — **not** a correlated `EXISTS`. The subquery form is evaluated once per statement as an InitPlan; the correlated form re-evaluates per row and collapses at scale.

---

## 7. Also in scope

- **`profiles.deleted_at`** already landed in Phase 2. Finish the `delete-account` route: decide soft vs hard deletion deliberately, and **ASK** — under the practitioner model, deleting a firm owner must not cascade-delete their clients' statutory records (`docs/TENANCY_DESIGN.md` risk #12).
- **`get_next_invoice_number`** — signature becomes `(p_client_id, p_tax_year)`. The July identity guard must be *generalised*, not deleted: replace `v_caller <> p_user_id` with a membership check against `accessible_client_ids()`. Deleting it reopens the IDOR as a cross-tenant one. Also re-key `invoice_sequences` to `UNIQUE(client_id, tax_year)` — sharing a sequence across a practice's clients corrupts invoice numbering, which is irreversible once `is_immutable` invoices exist.
- **Practitioner UI is NOT in this phase.** Client switcher, client list, invite flow — all Phase 4+. Phase 3 is schema and policies only.

---

## 8. Stop and ask

- Before moving entity attributes off `profiles` (§2)
- Before implementing `client_keys` (§5)
- On the `delete-account` cascade decision (§7)
- If the negative suite cannot be made table-driven
- If any wave's drift-count decrease does not match the number of tables added
