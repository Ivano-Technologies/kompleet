# FMEA Matrix Snapshot (Latest)

Source: `docs/ocr/FMEA.md`

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
