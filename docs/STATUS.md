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
| Cleared by Phase 2 deletions (detector-visible) | 8 |
| Application bug (`users` → fix against `profiles`) | 1 |
| Still missing after Phase 2 (detector) | **18** |
| Build in Phase 3 | 18 + `merchant_categorizations` = **19** new tables |

**Standing rule:** the drift detector's count is authoritative. Any figure in planning docs that disagrees is stale — correct the doc, do not reconcile to it.

---

## Phase 1

- Drift / migration / advisor scripts + CI jobs landed.
- First live drift run: **27** missing (gate cleared after inventory correction).
- Security advisor baseline: **4** WARN (`scripts/security-advisor-baseline.json`).
- CI schema jobs must skip on fork PRs (secrets not passed to forks).

## Phase 2 gate

`pnpm check:schema-drift` lists **18** missing tables (authoritative).

Clearances from the 27 = 8 deletions (`bank_accounts`, `email_connections`, `workspaces`, `workspace_members`, `ml_models`, `ml_retraining_jobs`, `ml_drift_alerts`, `ml_corrections`) + `users` resolved via `profiles` = **9**. 27 − 9 = **18**. Phase 3 creates those 18 plus `merchant_categorizations` = **19** tables. (`records`/`customers` lived only in Drizzle schema files — zero `.from()` refs — so the detector never counted them.)

| Cleared from detector | Still missing (Phase 3) |
| --- | --- |
| bank_accounts, email_connections, ml_corrections, ml_drift_alerts, ml_models, ml_retraining_jobs, workspaces, workspace_members, users | categorization_feedback, categorization_predictions, data_migration_logs, deadline_reminders, documents, filing_audit_logs, filing_deadlines, filing_status, import_batches, invoice_archives, invoice_audit_logs, ml_inference_logs, nrs_forms, recurring_patterns, tax_calculations, user_keys, user_learning_profiles, user_tax_years |

**AWS console (manual):** delete S3 bucket `kompleet-ml-models` and the IAM user for the leaked key — Phase 2.3 security dividend.

## Accepted risks

- Credential rotation deferred; history purge declined. Secret-scan covers working tree only.
- `SUPABASE_ACCESS_TOKEN` is account-wide — reaches every project in the org.
- Keep-alive / Pro upgrade — Phase 6.
- Domain cutover — Phase 7 (code in PR #55).
