# OCR Pipeline FMEA

## Scope

System boundary:

`API -> DB -> Queue -> Worker -> OCR -> Extraction -> Validation -> DB -> Search`

This FMEA applies to multi-tenant document intelligence processing for financial records.

## Failure Mode Matrix

| Failure Mode | Cause | Impact | Severity | Detection | Containment | Audit Trace |
| --- | --- | --- | --- | --- | --- | --- |
| Double processing | Worker race / duplicate enqueue | Duplicate financial records | High | Duplicate job ID + status conflict metrics | Atomic claim (`queued -> processing`) + idempotent job ID | `document_processing_skipped` / `document_processed` |
| OCR timeout | Corrupt or oversized input | Stuck/failed jobs | Medium | OCR duration metric + timeout events | 10s OCR timeout + retry max 3 + fail terminally | `document_processing_failed` with reason |
| Queue flood | Traffic spike | Backlog and delayed completion | Medium | Queue depth + lag metrics | Worker autoscaling + queue backpressure limits | Queue lag snapshots |
| Supabase outage | DB/network failure | Processing halt | High | DB health checks + write/read error rate | Fail-fast, retry bounded, move to failed state | Failure events with operation codes |
| Redis saturation | Backlog + memory pressure | Queue instability | High | Redis memory alerts | TTL + removeOnComplete + memory thresholds | Ops incident log + queue telemetry |
| Incorrect VAT extraction | Layout variance | Compliance risk | Critical | Validation mismatch rates | Block finalization + manual review fallback | Validation error records |
| OCR memory leak | Long process runtime | Worker crash/restarts | Medium | Worker memory telemetry + restart count | Concurrency caps + process isolation + restarts | Worker lifecycle events |
| Sensitive data in logs | Unsafe logging | Compliance breach | Critical | Log scanning + DLP checks | Strict redaction + CI checks + masked fields | Security audit events |

## Risk Priority Rules

- Severity `High` and `Critical` MUST include all of:
  - Automated detection
  - Automatic containment
  - Durable audit trace
- Critical financial/compliance failures MUST NOT depend on manual-only mitigation.

## Current Control Mapping (Phase 2 Status)

- Implemented:
  - Queue idempotency via job ID (`documentId`)
  - Atomic worker claim (`queued -> processing`)
  - Bounded retries
  - OCR timeout protection
  - Worker state guards (`completed` / `processing` skip)
- Pending for go-live:
  - Queue depth and OCR SLO dashboards
  - Log scanning policy enforcement in CI
  - Manual review queue with SLA tracking
  - Redis saturation auto-remediation playbook

## Required Alerts

- Queue depth > 1000 for 5 min
- Error rate > 2% for 5 min
- OCR duration p95 > 5s for 5 min
- Worker restarts > threshold per hour
- Validation failure ratio above configured baseline

## Ownership

- Engineering: control implementation + test evidence
- Security: confidentiality controls + breach process
- Compliance: retention + NDPR policy conformance
- Operations: alert response and incident escalation
