# 01 System Architecture

## Scope

Subsystem: Document Intelligence (OCR + extraction + validation + review fallback)

Pipeline:

`API -> DB -> Queue -> Worker -> OCR -> Extraction -> Validation -> DB -> Search`

## Architectural Boundaries

- API routes are thin wrappers and never perform OCR directly.
- Application/domain layers stay framework-agnostic.
- Queue and worker concerns remain in infrastructure/runtime layers.
- OCR adapter is infrastructure-only and does not perform tax mapping or persistence.

## Control Points

- Idempotency control:
  - Queue-level job id (`jobId=documentId`)
  - DB-level atomic claim
  - Worker duplicate/skip metrics
- Processing integrity:
  - Deterministic OCR invocation settings
  - Validation before completion
  - Manual review routing on mismatch/low confidence
- Confidentiality:
  - Raw OCR payload sanitized before persistence
  - OCR log-safety scanner in CI

## Audit-Defense Statement

System is designed to prevent silent duplicate processing and silent financial field drift by combining:

1. deterministic processing,
2. state-machine transitions,
3. metrics and alerts,
4. auditable review fallback.
