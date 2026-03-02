# OCR FMEA Action Plan (High/Critical Controls)

Use this tracker to move high-risk OCR controls from policy to implementation.

Status values: `todo`, `in_progress`, `done`, `blocked`  
Priority values: `critical`, `high`

## Control Tracker

| ID | Failure Mode | Priority | Required Detection | Required Containment | Required Audit Evidence | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OCR-FMEA-01 | Double processing | high | Duplicate claim/duplicate job metrics and alert | Atomic claim + idempotent job ID + skip guards | Processing event stream proving single completion per document | Backend | done |
| OCR-FMEA-02 | Supabase failure | high | DB health and write/read error-rate alerts | Retry (bounded) + fail-safe state transition to `failed` | Failure events with operation code and timestamp | Backend/Infra | todo |
| OCR-FMEA-03 | Redis memory saturation | high | Redis memory and queue-depth alerts | Queue cleanup policy + backpressure + autoscaling | Alert history + queue lag snapshots | Infra | todo |
| OCR-FMEA-04 | Incorrect VAT extraction | critical | Validation mismatch ratio alert | Block finalization + manual review fallback | Validation error logs + manual review actions | Backend/Compliance | done |
| OCR-FMEA-05 | Sensitive data leak in logs | critical | Automated log scanning in CI and runtime sampling | Redaction policy enforcement + denylist checks | Scan reports + redaction test outputs | Security/Backend | in_progress |
| OCR-FMEA-06 | Extraction drift across invoice templates | critical | Structured hash drift detection via golden corpus snapshots | Deterministic extraction mapping + confidence distribution monitoring + manual review fallback | Snapshot test artifacts + confidence bucket metrics + deterministic hash evidence | Backend/Compliance | done |

## Work Packages

### OCR-FMEA-01 - Double Processing

- [x] Add alert/metric hook for duplicate processing attempts per `documentId`. (`ProcessingMetricsAdapter.recordDuplicateClaim`)
- [x] Add test: concurrent worker claims produce single completion. (`tests/document-intelligence-duplicate-processing.test.ts`)
- [x] Verify queue job IDs are stable and idempotent (`jobId = documentId`). (`infrastructure/queue/bullmq.adapter.ts`)
- [ ] Capture evidence in `Evidence` section.

### OCR-FMEA-02 - Supabase Failure

- [ ] Add alert on DB operation failure rate for worker operations.
- [ ] Ensure bounded retries and terminal fail state are exercised in tests.
- [ ] Add incident tag/classification for DB outage events.
- [ ] Capture evidence in `Evidence` section.

### OCR-FMEA-03 - Redis Memory Saturation

- [ ] Add Redis memory threshold alert.
- [ ] Add queue depth and queue lag alerts.
- [ ] Document queue cleanup strategy (`removeOnComplete`, retention window).
- [ ] Capture evidence in `Evidence` section.

### OCR-FMEA-04 - Incorrect VAT Extraction

- [x] Add metric for VAT reconciliation failure ratio. (`ProcessingMetricsAdapter.recordValidationMismatch`)
- [x] Enforce blocking behavior when validation fails. (`markNeedsReview` path in `document-processor.ts`)
- [x] Add manual review queue route/process for failed financial validations. (`infrastructure/review/review-queue.stub.ts`)
- [ ] Capture evidence in `Evidence` section.

### OCR-FMEA-05 - Sensitive Data Leak in Logs

- [x] Add CI guard: scan logs/tests for prohibited raw OCR fields (`rawText`, unmasked account data). (`scripts/scan-ocr-log-safety.js`, `pnpm security:scan-ocr-logs`)
- [x] Add runtime guard tests verifying sensitive fields are redacted. (`tests/document-intelligence-queue-worker.test.ts`)
- [x] Add developer guidance for safe log fields in OCR worker. (`docs/ocr/LOGGING_POLICY.md`)
- [ ] Capture evidence in `Evidence` section.

### OCR-FMEA-06 - Extraction Drift Across Templates

- [x] Isolate extraction functions into pure application module. (`src/modules/document-intelligence/application/extraction/*`)
- [x] Add deterministic structured output hash metadata for regression detection. (`structured-output-hash.ts`, `document-processor.ts`)
- [x] Add golden corpus snapshot regression tests (identical input => identical structured JSON/hash). (`tests/document-intelligence-extraction-regression.test.ts`, `tests/fixtures/invoices/*`)
- [x] Emit confidence distribution buckets for drift monitoring. (`MetricsPort.recordConfidenceDistribution`, `processing-metrics.ts`)
- [ ] Capture evidence in `Evidence` section.

## Alert Query Placeholders

Replace these placeholders with actual dashboard/alert rules:

- `ALERT_DUPLICATE_PROCESSING`: duplicate processing attempts > threshold / 5 min
- `ALERT_DB_FAILURE_RATE`: worker DB failures > threshold / 5 min
- `ALERT_REDIS_MEMORY`: Redis memory > threshold / 5 min
- `ALERT_QUEUE_DEPTH`: queue depth > threshold / 5 min
- `ALERT_VALIDATION_FAILURE_RATIO`: VAT/total validation failures > baseline
- `ALERT_LOG_SENSITIVE_FIELDS`: sensitive log pattern match > 0
- `ALERT_EXTRACTION_HASH_DRIFT`: structured hash mismatch against golden corpus baseline

## Evidence

Attach links/screenshots/PR references for each control when done:

- OCR-FMEA-01: `tests/document-intelligence-duplicate-processing.test.ts` (concurrent race simulation), `document-processor.ts` metric hooks, `bullmq.adapter.ts` job idempotency (`jobId=documentId`)
- OCR-FMEA-02:
- OCR-FMEA-03:
- OCR-FMEA-04: `tests/document-intelligence-validation-review.test.ts` (VAT mismatch -> review), `document-processor.ts` validation mismatch + low-confidence metrics, `review-queue.stub.ts`
- OCR-FMEA-05: `pnpm security:scan-ocr-logs` (local pass), `tests/document-intelligence-queue-worker.test.ts`, `docs/ocr/LOGGING_POLICY.md`
- OCR-FMEA-06: `tests/document-intelligence-extraction-regression.test.ts` (snapshot + deterministic hash assertions), `tests/fixtures/invoices/*`, `src/modules/document-intelligence/application/extraction/*`, `processing-metrics.ts` confidence bucket logging

## Sign-Off

- Engineering Lead: ____________________
- Security Lead: ____________________
- Compliance Lead: ____________________
- Date: ____________________
