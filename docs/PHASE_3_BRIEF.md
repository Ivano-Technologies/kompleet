# Phase 3 Brief — Tenancy Spine, Invoicing First

**Revision 2 — 2026-08-05.** Supersedes revision 1. Rescoped after owner direction: target is **accountants serving 2–10 clients**, not mid-size practices; **first customer is the owner's own business**, needing e-invoicing immediately; **mobile is required** for receipt capture.

**Prereq:** `main` = `staging` (merge-commit promotion, per `docs/STATUS.md`). Guardrails green: drift 18, baseline 18, advisors 4 WARN, 504 tests.

---

## 0. What changed from revision 1

| Was | Now | Why |
|---|---|---|
| Designed for 20–200 clients | **2–10 clients** | Owner direction. Removes the need for per-client access restriction and perf tuning. |
| `client_assignments` in Wave A | **Deferred** | A two-person firm does not restrict staff to a subset of six clients. Add when someone asks. |
| Roles `owner\|admin\|staff\|viewer` | **`owner\|staff`** | Two roles cover a small practice. Widening later is a CHECK-constraint change. |
| Perf fixture (200 clients × 500k rows) | **Dropped** | Not a real risk at this scale. Keep the indexes; skip the fixture. |
| Invoicing in Wave F (6th) | **Wave C (3rd)** | First real user is the owner, issuing e-invoices. This is now the shortest path to production use. |
| `documents` in Wave E | **Wave D** | Mobile receipt capture is a stated requirement. |
| Mobile deferred | **Back on the roadmap** | Receipt capture is the mobile use case. Expo SDK 54→57 still not Wave A blocking. |

**Unchanged and still non-negotiable:** every domain table carries `client_id` from birth; every new table's migration carries its own `revoke all … from anon`; the cross-tenant negative suite exists before the first domain table. Leakage between clients' tax records does not care that there are only six of them.

---

## 1. Ground rules

1. **All schema work verified locally first, then applied to production.** Run `pnpm supabase start` (local Postgres + Auth in Docker, free), apply the migration, run the negative suite and `supabase gen types` against it, then apply to production via `apply_migration`.

   **Do not use Supabase branches.** They are billed hourly and the owner has ruled out paid Supabase services. They were specified in an earlier revision of this brief; that was the wrong call here. A branch protects production *data* during schema change — production holds 4 test accounts and zero customer records, and Wave A is purely additive. The real safety net is the negative suite (§5) and a tested rollback migration, neither of which needs a branch.

   Every migration ships with a matching `down` migration, tested locally before the `up` is applied to production.
2. **`client_id` at creation.** No `user_id`-only domain table intended for retrofit.
3. **Every new table's migration contains `revoke all … from anon`.** `20260715144130` is a hardcoded list of 9 tables and covers nothing new.
4. **Tables that already exist need policy replacement, not addition.** See §3 — this is the highest-risk operation in the phase.
5. One migration per wave. Negative suite before the first domain table.
6. Promotion: squash feature → `staging`, **merge commit** `staging` → `main`. Never force-push `staging`.

---

## 2. Tenancy spine (Wave A)

```
firms (id, name, owner_user_id, subscription_tier, created_at)
  └── firm_members (firm_id, user_id, role ∈ owner|staff)
  └── clients (id, firm_id, legal_name, tin, rc_number, entity_type,
               fiscal_year_start, address, status, archived_at)
```

Plus two `SECURITY DEFINER` helpers, both `STABLE`, both `SET search_path = public, pg_temp`, both `revoke execute … from anon, public`:

```sql
create or replace function public.accessible_client_ids()
returns setof uuid language sql stable security definer
set search_path = public, pg_temp as $$
  select c.id from public.clients c
  join public.firm_members fm on fm.firm_id = c.firm_id
  where fm.user_id = auth.uid() and c.archived_at is null
$$;
```

`my_firm_ids()` follows the same shape against `firm_members`.

Policies use `client_id in (select public.accessible_client_ids())` — the subquery form, evaluated once per statement as an InitPlan. Not a correlated `EXISTS`.

Write policies additionally require `role = 'owner'` or `'staff'`; there is no viewer role yet, so any member may write.

---

## 3. Existing tables — policy replacement, read before Wave C

Waves C and D modify tables that **already exist with live `user_id`-scoped policies**: `invoices`, `invoice_sequences`, `expenses`, `transactions`, `file_uploads`, `tax_filings`, `tax_reports`, `financial_statements`, `export_history`, `import_sessions`.

This is the retrofit case, and it is where the leakage risks in `docs/TENANCY_DESIGN.md` §3.2 live. Two rules:

**Drop and create in the same transaction.** All policies here are `PERMISSIVE`, so same-command policies combine with **OR**. Adding a client-scoped policy alongside an existing `user_id` policy does not narrow access — it widens it. Every table's migration must `DROP POLICY` the old family and `CREATE POLICY` the new one atomically.

**`transactions` carries two policy families** (`*_own` and `*_clerk`) and both are live. Drop both. The Clerk family is a second authorization path on your most sensitive table.

Zero rows means backfill is trivial (`update … set client_id = <default client>` or simply none), but it does **not** make the policy swap safe by itself.

---

## 4. Wave order

Each wave: migration → `supabase gen types` → `pnpm typecheck` → negative suite → relevant E2E → commit → decrement `.schema-drift-baseline`.

| Wave | Contents | Rationale |
|---|---|---|
| **A** | `firms`, `firm_members`, `clients`, `accessible_client_ids()`, `my_firm_ids()` | Everything references these. Baseline unchanged (no detector-visible domain tables). |
| **B** | Cross-tenant negative suite (§5) | Before any domain table. Tests only, baseline unchanged. |
| **C** | **Invoicing.** New: `invoice_archives`, `invoice_audit_logs`, `client_keys`. Modified: `invoices`, `invoice_sequences` (+`client_id`, policy replacement, re-key). | **Shortest path to the first real user.** `invoices` and `invoice_sequences` already exist — only three tables are genuinely missing. Baseline 18 → 15. |
| **D** | **Receipts / documents.** New: `documents`. Modified: `expenses`, `file_uploads` (+`client_id`). Storage policies. | Mobile receipt capture. Baseline 15 → 14. |
| **E** | `tax_calculations`, `client_tax_years`, `merchant_categorizations` | Dashboard landing page queries `tax_calculations` client-side. Baseline 14 → 11. |
| **F** | `nrs_forms`, `filing_status`, `filing_audit_logs`, `filing_deadlines`, `deadline_reminders` | Filing output. Baseline 11 → 6. |
| **G** | `import_batches`, `data_migration_logs`, `recurring_patterns`, `categorization_predictions`, `ml_inference_logs`, `categorization_feedback`, `firm_learning_profiles` | Remainder. Baseline 6 → 0 (with `merchant_categorizations` net-new). |

**Renames, done at creation:** `user_tax_years` → `client_tax_years`, `user_keys` → `client_keys`, `user_learning_profiles` → `firm_learning_profiles`. Update call sites in the same commit.

---

## 5. Cross-tenant negative suite — Wave B

Seed **two firms**, each with two clients and a real Supabase JWT per member. Table-driven from a list, so later waves gain coverage automatically. For every table and each of SELECT / INSERT / UPDATE / DELETE:

- Firm A's member sees exactly firm A's rows, and **zero** of firm B's
- Firm A's member cannot write into firm B's client
- Archived clients are excluded

**Plus a `pg_policies` snapshot test:** fail the build if any policy on a client-scoped table references bare `user_id` without a membership predicate. This catches the permissive-OR failure mechanically rather than by review.

---

## 6. Wave C detail — invoicing (the critical path)

### `client_keys` (was `user_keys`)

Cryptographic signing material for NRS-compliant invoice QR codes (`src/lib/invoice-security.ts`).

- **Scope: per client.** The invoice is issued by the taxable entity, so the signing key belongs to the entity, not the practice.
- **Encrypt private key material at rest** — Supabase Vault or application-level envelope encryption with the wrapping key in env. Never a plain `text` column.
- `revoke all … from anon`; prefer access via a `SECURITY DEFINER` function over direct table reads.

### `get_next_invoice_number`

Signature becomes `(p_client_id uuid, p_tax_year integer)`. **Generalise the July identity guard — do not delete it.** Replace `v_caller <> p_user_id` with:

```sql
IF NOT EXISTS (SELECT 1 FROM public.accessible_client_ids() a WHERE a = p_client_id) THEN
  RAISE EXCEPTION 'permission denied: client not accessible to caller';
END IF;
```

Deleting it reopens the IDOR that `20260716180723` closed, as a cross-tenant one.

### `invoice_sequences`

Re-key `UNIQUE(user_id, tax_year)` → `UNIQUE(client_id, tax_year)`. A shared sequence across a practice's clients produces duplicate invoice numbers across distinct taxable entities — an NRS compliance defect, irreversible once `is_immutable` invoices are issued.

### Acceptance for Wave C

The owner can create a client, issue a compliant e-invoice with a valid QR code, and archive it. That is the wave's definition of done — not just green migrations.

---

## 7. WHT calculator

Add withholding tax as a first-class calculator alongside the existing six.

- **Rates live in `tax_rules`, not in code.** That table exists with 27 seeded rows and a `rules-engine.ts` consumer. Add WHT rates as rows with effective dates so a rate change is a data change, not a deploy.
- Rates vary by payment type and payee type (company vs individual) — dividends, rent, royalties, professional/technical services, construction, contracts, commissions. Source the current schedule from the Nigeria Tax Act 2025 and **cite the source in the migration comment**.
- Service at `src/lib/services/wht-service.ts`, mirroring `vat-service.ts`'s shape.
- Page at `src/app/(dashboard)/calculators/wht/page.tsx`, following the existing calculator pattern.
- `tax_type` enum already admits `'wht'` in `src/lib/schemas/calculations.ts` — no schema change needed there.
- Unit tests per payment type, including the company/individual rate split.

**ASK before implementing** if the rate schedule is ambiguous. A wrong WHT rate produces a wrong remittance, which is real-world harm.

---

## 8. Deferred, recorded in `docs/DEFERRED_FEATURES.md`

- `client_assignments` — per-client access restriction. Revisit above ~10 clients per firm.
- `viewer` role.
- Cross-client portfolio roll-ups (`analytics/yoy/summary`, `reports/*` aggregation). Net-new product, not refactor.
- Mobile Expo SDK 54→57 migration — required eventually for receipt capture, but not Wave A blocking. Schedule as a mobile milestone with `expo install --fix` + `expo-doctor`, not a Dependabot bump.

---

## 9. Stop and ask

- Before moving `tin`, `rc_number`, `company_name`, `entity_type`, `fiscal_year_start` off `profiles` onto `clients` — NRS form generation reads `tin`, and `src/lib/expense-premium.ts` reads `subscription_tier`. Both need updating in lockstep or you file returns with a wrong TIN.
- On the `delete-account` cascade — deleting a firm owner must not cascade-delete clients' statutory records.
- If any wave's drift-count decrease does not match the tables added.
- If the WHT rate schedule is ambiguous.
