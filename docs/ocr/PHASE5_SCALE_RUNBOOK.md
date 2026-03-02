# Phase 5 Scale Runbook

This runbook operationalizes Phase 5 controls for scale, cost, and multi-entity growth without weakening idempotency, recovery, or extraction drift controls.

## Scope

- Infrastructure-only rollout controls
- Worker horizontal scaling and queue memory safety
- Supabase pooling and tenant-isolation query posture
- Load-test evidence generation and cost reporting

## Runtime Knobs

Use these environment variables in worker deployments:

- `DOCUMENT_WORKER_CONCURRENCY` (default: `2`)
  - Horizontal worker throughput control in `document-processor.worker.ts`
- `MAX_PROCESSING_ATTEMPTS` (default: `3`)
  - Attempt ceiling in repositories (`processing_attempt_count`)
- `SUPABASE_POOLER_URL` (optional, recommended in production)
  - If set, workers prefer pooler endpoint over `SUPABASE_URL`

## Queue and Redis Tuning

`BullMQAdapter` now supports retention tuning for memory stability:

- `attempts` (default `3`)
- `backoffDelayMs` (default `2000`)
- `removeOnComplete.age` (default `600` seconds)
- `removeOnComplete.count` (default `1000`)
- `removeOnFail.age` (default `3600` seconds)
- `removeOnFail.count` (default `1000`)

Operational guidance:

- Keep `jobId=documentId` unchanged for idempotent queue semantics.
- Increase worker replicas before dramatically increasing per-worker concurrency.
- Treat rising queue depth + rising Redis memory as a retention/concurrency rebalance signal.

## Attempt Ceiling Control

Schema support:

- Migration: `20260302143000_documents_attempt_ceiling_and_isolation.sql`
- Column: `processing_attempt_count integer not null default 0`
- Constraint: non-negative attempt count
- Index: `(user_id, status, updated_at desc)` for entity-scoped reads

Behavior:

- Claim increments `processing_attempt_count`.
- If attempts exceed `MAX_PROCESSING_ATTEMPTS`, document is marked `failed` with `max_processing_attempts_exceeded`.
- Worker emits metric-class warning with operation `worker.document.metrics.max_attempts_exceeded`.

## Load Test Procedure

Run:

`pnpm exec vitest run tests/load/document-load-simulation.test.ts`

What the harness validates:

- 1,000+ document cycles (currently 1,200)
- Duplicate-race simulation with no duplicate completion
- Timing telemetry:
  - queue latency
  - OCR duration
  - extraction duration
  - total pipeline duration
- Tenant isolation check (cross-tenant job processing must be skipped)
- Template cluster output for vendor-pattern diversity monitoring

Artifacts generated:

- `tests/load/output/document-load-summary.json`
- `tests/load/output/document-cost-report.json`

## Cost and Capacity Reporting

Cost estimator module:

- `src/modules/document-intelligence/infrastructure/cost/cost-per-document-estimator.ts`

Inputs:

- avg OCR time
- avg CPU time
- avg pipeline time

Outputs:

- estimated USD per document
- estimated USD per 1,000 documents

Use these artifacts to set monthly cost forecasts and alert thresholds for budget variance.

## Worker Telemetry and Percentiles

Telemetry module:

- `src/modules/document-intelligence/infrastructure/metrics/worker-resource-telemetry.ts`

Per-job metrics:

- CPU duration (via `process.hrtime.bigint()`)
- memory RSS delta
- queue/ocr/extraction/total timings

Percentiles:

- p50, p95, p99 snapshots logged periodically for CPU, memory, and total pipeline latency.

## Production Rollout Sequence

1. Apply migration `20260302143000_documents_attempt_ceiling_and_isolation.sql`.
2. Deploy worker code with unchanged queue job ID semantics.
3. Configure `SUPABASE_POOLER_URL` in production worker environments.
4. Set initial `DOCUMENT_WORKER_CONCURRENCY` and validate queue depth stability.
5. Run load harness and archive summary + cost artifacts.
6. Confirm extraction regression snapshots remain stable.
7. Enable alerts for queue depth, Redis memory, duplicate rate, mismatch rate, and processing latency percentiles.

## Rollback Plan

- Reduce `DOCUMENT_WORKER_CONCURRENCY` first if saturation is observed.
- Keep migration in place (attempt ceiling is protective and safe).
- Revert worker image only if necessary; preserve data written by new telemetry/cost paths.
- Do not disable idempotency/recovery/drift controls during rollback.
