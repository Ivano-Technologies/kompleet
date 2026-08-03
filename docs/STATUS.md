# KOMPLEET — Status

**Date:** 2026-08-03 (updated 2026-08-04)  
**Phase 1:** [PR #56](https://github.com/Ivano-Technologies/kompleet/pull/56)  
**Phase 2 branch:** `chore/phase-2-delete-before-build`  
**Prep:** [PR #55](https://github.com/Ivano-Technologies/kompleet/pull/55)

---

## Decisions (locked)

### Tenancy — practitioner / multi-client

KOMPLEET targets **accountants managing many client entities**.

- Every Phase 3 domain table carries `client_id` from birth. No user_id-only domain tables intended for retrofit.
- Tenancy spine **before** any domain table: `firms` → `firm_members` (owner|admin|staff|viewer) → `clients` → `client_assignments`, plus `accessible_client_ids()` SECURITY DEFINER helper (`docs/TENANCY_DESIGN.md` §3.3). Every domain policy references that helper only.
- Entity attributes on `profiles` (`tin`, `rc_number`, `company_name`, `entity_type`, `fiscal_year_start`) move to `clients`. The practitioner is not a taxable entity.
- Cross-tenant negative test suite is a **prerequisite**, not a follow-up: two firms, real JWTs, assert firm A sees exactly its rows and zero of firm B's for every table × every command — before the first domain table.

### Inventory — detector is authoritative

Original hand-built list of 14 was wrong (missed `src/modules/` and several services). **27** missing `.from()` targets is ground truth. Revised triage in `docs/MISSING_TABLES_RECOVERY_PLAN.md`:

| Disposition | Count |
| --- | --- |
| Cleared by Phase 2 deletions | 10 |
| Application bug (`users` → fix against `profiles`) | 1 |
| Build in Phase 3 | 16 (+ `merchant_categorizations` = 17 new tables) |

---

## Phase 1

- Drift / migration / advisor scripts + CI jobs landed.
- First live drift run: **27** missing (gate cleared after inventory correction).
- Security advisor baseline: **4** WARN (`scripts/security-advisor-baseline.json`).
- CI schema jobs must skip on fork PRs (secrets not passed to forks).

## Phase 2 gate

`pnpm check:schema-drift` lists **18** missing tables (authoritative).

The brief asked for 17. Arithmetic check: the “10 deleted” figure included `records` + `customers`, which had **zero** `.from()` refs and were never in the detector’s 27. Real removals from the 27 = **9** (Mono, email, four ML tables, workspaces pair, `users` bug). 27 − 9 = **18**. Those 18 are exactly the Phase 3 build set.

| Cleared from detector | Still missing (Phase 3) |
| --- | --- |
| bank_accounts, email_connections, ml_corrections, ml_drift_alerts, ml_models, ml_retraining_jobs, workspaces, workspace_members, users | categorization_feedback, categorization_predictions, data_migration_logs, deadline_reminders, documents, filing_audit_logs, filing_deadlines, filing_status, import_batches, invoice_archives, invoice_audit_logs, ml_inference_logs, nrs_forms, recurring_patterns, tax_calculations, user_keys, user_learning_profiles, user_tax_years |

**AWS console (manual):** delete S3 bucket `kompleet-ml-models` and the IAM user for the leaked key — Phase 2.3 security dividend.

## Accepted risks

- Credential rotation deferred; history purge declined. Secret-scan covers working tree only.
- `SUPABASE_ACCESS_TOKEN` is account-wide — reaches every project in the org.
- Keep-alive / Pro upgrade — Phase 6.
- Domain cutover — Phase 7 (code in PR #55).
