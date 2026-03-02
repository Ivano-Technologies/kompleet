# 04 Processing Integrity Controls

## Deterministic Processing

- OCR invocation is fixed (`--oem 1`, `--psm 6`, `-l eng`).
- Structured payload hash is computed deterministically.
- Same input is expected to produce same structured output.

## Validation Before Completion

- Validation checks run before `completeProcessing`.
- Mismatch or low confidence routes to manual review, not silent completion.

## State Machine Controls

- Allowed transitions:
  - `queued -> processing`
  - `processing -> completed`
  - `processing -> failed`
  - `processing -> needs_review`

## Auditability

- Processing outcomes log to audit trail (`document_processed`, `document_needs_review`, `document_processing_failed`).
- Review queue enqueues produce auditable records.
