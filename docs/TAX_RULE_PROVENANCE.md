# Tax Rule Provenance & Verification

**Date:** 2026-08-05
**Purpose:** make every tax figure the product produces traceable to a dated, cited, human-verified rule — and make a later correction discoverable.

This is a platform standard, not a WHT feature. It applies to VAT, CIT, PIT, WHT, capital allowances, stamp duty and property tax alike.

---

## 1. The architecture already exists

Verified live on `frlcvkmjuhnjcicwywrh`:

| Table | Columns that matter | Status |
|---|---|---|
| `sources` | `name`, `type`, `url`, `check_frequency_days`, `last_checked_at` | Regulatory source register with staleness tracking |
| `rule_versions` | `version_number`, `effective_from`, `effective_to`, `is_active`, **`approved_by`**, **`approved_at`** | Versioned rulesets with human approval |
| `tax_rules` | `rule_version_id`, `source_id`, `rule_type`, `rule_key`, `rule_value jsonb`, **`confidence_level`**, **`last_reviewed_at`**, `notes` | 27 rows seeded |
| `review_queue` | `source_id`, `change_summary`, `proposed_rule_changes jsonb`, `status`, `priority`, `assigned_to`, `reviewed_by`, `reviewed_at`, `review_notes` | Full review workflow |
| `review_actions` | `review_queue_id`, `action_type`, `action_by`, `action_details` | Audit trail |

Effective dating, source citation, approval, confidence and a review queue are all present. `rule_value` being `jsonb` is what makes the awkward cases expressible — the TIN-doubling modifier, exemption thresholds, treaty bands, resident/non-resident splits.

`hooks/useTaxRules.ts` already feeds the business-tax, individual-tax and VAT calculator pages, and `lib/services/rules-engine.ts` reads the table.

**This is a wiring job, not a build.**

---

## 2. The gap that matters

`src/lib/services/vat-service.ts:93`:

```ts
private static readonly STANDARD_RATE = 0.075; // 7.5%
```

The VAT rate is defined in **two places** — the `tax_rules` table and a class constant. The service layer wins.

So if a tax practitioner reviews the rate table and corrects a figure, **the computation does not change.** The review produces a data update that the code silently ignores. That makes the whole verification exercise theatre.

This is the same duplication pattern found elsewhere in the codebase — two AI stacks, two schema sources, two identity systems. Same fix each time: delete the shadow copy.

**Action:** audit every service in `src/lib/services/` and `src/lib/tax/` for hardcoded rates, thresholds and bands. Every one becomes a `tax_rules` lookup. Where a service genuinely needs a fallback (rules unavailable), it must **fail loudly** rather than silently substituting a constant — a tax figure computed from an unknown rate is worse than an error.

---

## 3. What to add

Small additions to a structure that mostly exists.

### 3.1 Provenance on saved calculations — the highest-value item

When `tax_calculations` is created (Wave E), it carries:

```sql
rule_version_id uuid references public.rule_versions(id),
rules_used      jsonb not null default '[]'::jsonb,  -- [{rule_id, rule_key, rule_value, confidence_level}]
```

**Why this matters more than anything else here.** If a rate is later found wrong, this is what lets you answer "which calculations used it, and which of those were filed?" Without it, a correction is undiscoverable — you know the table is now right and have no way to find what the old value produced. For a product whose output becomes a tax return, that is the difference between a correctable error and an unbounded one.

### 3.2 Exemptions as first-class outcomes

An exemption is not a 0% rate. `rule_value` should express outcome type:

```json
{ "outcome": "exempt", "reason": "turnover_below_threshold",
  "threshold": { "annual_turnover_ngn": 50000000, "monthly_transaction_ngn": 2000000 },
  "citation": "NTA 2025 s.___" }
```

The calculator returns *exempt* with the reason, not ₦0. For your target users — practitioners serving small clients — exemption is the common case, and "₦0" reads as a bug where "exempt because turnover is below ₦50M" reads as an answer.

### 3.3 Surface confidence in the UI

`tax_rules.confidence_level` exists and is invisible. Any calculation drawing on a rule that is not verified shows a badge: *"Based on unverified rates — confirm with your tax advisor."* Once a practitioner approves the `rule_version`, the badge disappears for every calculation using it.

This is what lets you **ship before verification**. Unverified is a visible state, not a hidden risk.

### 3.4 Standing disclaimer

Calculators state that output is a computation aid, not tax advice, and the user should confirm with their advisor. Standard for the category, and appropriate given the product produces figures that go onto returns.

---

## 4. The verification session

When the practitioner reviews, their work becomes data — not a code change and not an email.

1. Seed the rate set as a new `rule_versions` row: `is_active = false`, `approved_by = null`, child `tax_rules` at `confidence_level = 'unverified'`, each with `source_id` and a `notes` citation.
2. Raise a `review_queue` entry per rule group — `change_type = 'rate_verification'`, `proposed_rule_changes` holding the rows.
3. The practitioner works a review screen: approve, correct, or dispute, with notes. Each decision writes a `review_actions` row against their user id.
4. On full approval, set `rule_versions.approved_by` / `approved_at` and `is_active = true`, and promote child rules to `confidence_level = 'verified'`.
5. Anything disputed stays unverified and keeps its badge. It does not block the rest.

Two products fall out of this for free: an auditable record of who approved which rate on what date, and a natural first engagement with your target buyer.

---

## 5. Rate-change monitoring

`sources.check_frequency_days` and `last_checked_at` exist and nothing uses them. Once rates are verified, a scheduled job can flag sources not checked within their window and raise a `review_queue` entry.

Tax rates are a wasting asset — the NTA 2025 came into force in January 2026 and superseded the 2024 Withholding Regulations within a year. A product whose correctness depends on current rates needs a mechanism that notices when they age. Not urgent; record it as a follow-up.

---

## 6. Applies to

Everything, not just WHT: VAT (7.5% standard, exempt, zero-rated, out-of-scope), CIT and the small-company threshold, PIT bands, the development levy, capital allowances, stamp duty, property tax, and WHT once seeded.

The WHT work is the first table built this way. It is also the test of whether the pattern holds.
