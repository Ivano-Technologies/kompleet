# Tax Rule Evolution Architecture (Document Intelligence)

## Objective

Support controlled tax-rule changes without redeploying OCR/extraction code, while preserving historical correctness.

## Separation of Concerns

- OCR adapter: raw OCR artifacts only.
- Extraction layer: deterministic field extraction.
- Validation layer: rule application against extracted fields.
- Tax rule resolution: version lookup by effective date.

Never hardcode VAT/tax rates inside OCR adapter or extraction adapter code.

## Proposed Data Model

```sql
CREATE TABLE IF NOT EXISTS tax_rules (
  id UUID PRIMARY KEY,
  rule_type TEXT NOT NULL,
  version INT NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rule_type, version)
);
```

## Runtime Resolution

For each document:

1. Read `issueDate` from structured extraction output.
2. Resolve matching rule where:
   - `effective_from <= issueDate`
   - and (`effective_to IS NULL` or `issueDate <= effective_to`)
3. Apply resolved rule version in validation/mapping phase.

## Historical Integrity

- Old documents keep old rules.
- New rule versions are append-only.
- No retroactive mutation of prior processed outputs.

## Admin Update Flow

1. Create new rule version.
2. Set `effective_from` (and optional `effective_to` on prior rule).
3. Validate with staging sample documents.
4. Publish without service redeploy.

## Required Interface

Introduce a tax rule access boundary as a port (implementation detail in future phase):

- `TaxRulePort.getRuleForDate(ruleType, issueDate)`

This keeps rule storage decoupled from validation logic and supports testing.

## Guardrails

- Reject overlapping active windows for same `rule_type`.
- Require schema validation for `config`.
- Audit every rule create/update action.
