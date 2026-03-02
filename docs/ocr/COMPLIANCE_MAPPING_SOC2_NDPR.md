# OCR Subsystem Compliance Mapping (SOC 2 + NDPR)

## Scope

This document maps controls for the OCR/document-intelligence subsystem handling financial and personal data.

## SOC 2 Mapping

### Security

- Controls
  - TLS in transit for all ingress/egress.
  - Encrypted storage at rest.
  - Role-based access to processing resources.
  - Worker runtime isolation with least-privilege credentials.
- Evidence
  - Environment configuration checklist
  - Access policy reviews
  - Infra encryption settings

### Processing Integrity

- Controls
  - Deterministic extraction and validation sequence.
  - Idempotent queue/job execution.
  - Status transition guards (`queued -> processing -> completed/failed`).
  - Immutable audit events for processing lifecycle.
- Evidence
  - State transition tests
  - Retry/idempotency tests
  - Audit log records sampled per release

### Confidentiality

- Controls
  - No raw OCR text in application logs.
  - Mask or exclude sensitive fields from search index.
  - Token/secret redaction policy in logger pipeline.
- Evidence
  - Log scans
  - Search index schema review
  - Redaction rule tests

## NDPR Mapping

### Consent

- Requirement
  - Data subjects must accept processing terms for document extraction.
- Implementation requirement
  - Capture consent version and timestamp per processing user/workspace.

### Right of Access

- Requirement
  - User can retrieve structured extracted data and document processing history.
- Implementation requirement
  - Export endpoint/report for processed document outputs + audit history.

### Right to Deletion

- Requirement
  - Deletion request must remove active document artifacts while retaining lawful compliance evidence.
- Implementation requirement
  - Delete document and structured outputs.
  - Delete search index record.
  - Preserve compliance-safe audit trail metadata per retention policy.

### Retention

- Requirement
  - Retain records in line with tax-law obligations (7 years target policy).
- Implementation requirement
  - Lifecycle policy and archival schedule with verifiable timestamps.

### Breach Notification

- Requirement
  - Incident detection, containment, forensic retention, and notification within legal timelines.
- Implementation requirement
  - Playbook: detect -> freeze pipeline -> investigate -> notify within 72 hours where required.

## Non-Negotiable Logging Rules

- Do not log raw OCR text payload.
- Do not log full account identifiers or personal identifiers when avoidable.
- Log event IDs, document IDs, and error codes only.

## Compliance Gates (Release Blocking)

- Consent capture validated
- Access export validated
- Deletion workflow tested end-to-end
- Retention policy verified
- Incident playbook runbook tested
