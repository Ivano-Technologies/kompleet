# KOMPLEET — Status

**Date:** 2026-08-03  
**Branch head (prep):** `chore/prep-secret-remediation-ci` → PR #55  
**Phase 1 branch:** `ci/phase-1-schema-guardrails`

---

## Decision gate — blocks Phase 3

**Does KOMPLEET target individual SMEs, or accountants managing many client entities?**

| Option | Consequence for Phase 3 |
| --- | --- |
| Individual SMEs | Tables stay `user_id`-scoped |
| Accountants / practitioners | Every new table carries `client_id` from day one (`firms` / `firm_members` per `docs/TENANCY_DESIGN.md`) |

Retrofitting `client_id` later is where the cross-tenant leakage risks in `TENANCY_DESIGN.md` §3.2 live. Phases 1–2 proceed either way.

**Owner answer:** _pending_

---

## Phase 1 gate — STOP

`scripts/check-schema-drift.mjs` ran against live project `frlcvkmjuhnjcicwywrh` on 2026-08-03.

| Expectation | Actual |
| --- | --- |
| Fail listing **exactly the 14** known missing tables | Fail listing **27** missing tables |

The prior inventory in `docs/MISSING_TABLES_RECOVERY_PLAN.md` is **incomplete**. Do not treat Phase 1 as green until the owner accepts an updated inventory.

### Known 14 (still missing)

`tax_calculations`, `user_tax_years`, `nrs_forms`, `filing_audit_logs`, `filing_status`, `email_connections`, `deadline_reminders`, `ml_inference_logs`, `categorization_predictions`, `bank_accounts`, `workspaces`, `workspace_members`  
(`customers`, `records` — zero `.from()` refs; Drizzle-only; detector correctly omits them)

### Extra 15 (not in prior inventory)

| Table | Sample call site |
| --- | --- |
| `categorization_feedback` | `src/lib/ai/feedbackService.ts` |
| `data_migration_logs` | `src/lib/data-migration-service.ts` |
| `documents` | document-intelligence supabase repository |
| `filing_deadlines` | `src/lib/deadline-service.ts` |
| `import_batches` | `src/lib/supabase/queries.ts` |
| `invoice_archives` | `src/lib/invoice-archiving.ts` |
| `invoice_audit_logs` | invoice-archiving / security / service |
| `ml_corrections` | `src/lib/ml/continuous-learning.ts` |
| `ml_drift_alerts` | `src/lib/ml/monitoring.ts` |
| `ml_models` | `src/lib/ml/continuous-learning.ts` |
| `ml_retraining_jobs` | `src/lib/ml/continuous-learning.ts` |
| `recurring_patterns` | `src/lib/ml/recurring-detection.ts` |
| `user_keys` | `src/lib/invoice-security.ts` |
| `user_learning_profiles` | `src/lib/ai/feedbackService.ts` |
| `users` | `delete-account` + `supabase/server.ts` — only `auth.users` exists; code uses `.from("users")` |

Phase 2 (Mono / email / ML deletions) will clear a large share of the ML extras. The invoice / documents / filing_deadlines / import_batches set still needs an explicit owner triage before Phase 3.

### Security advisor baseline

Live count **4 WARN** — committed in `scripts/security-advisor-baseline.json`. Performance advisors (**133**) deferred per plan.

---

## Accepted risks

- Credential rotation deferred by owner; history purge declined. Secret-scan CI covers the **working tree only** (see PR #55).
- Keep-alive / Pro upgrade — Phase 6; not started.
- Domain cutover to `kompleet.techivano.com` — Phase 7; code in PR #55, DNS/manual checklist pending.

---

## Next

1. Owner: answer SME vs practitioner (above).
2. Owner: accept updated missing-table inventory (27, not 14) and triage the extra 15.
3. Merge PR #55, then Phase 1 PR, then Phase 2 deletions (drift count should fall).
