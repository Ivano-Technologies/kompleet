# OCR Logging Safety Policy

## Objective

Prevent sensitive OCR payload leakage through application/worker logs.

## Prohibited in Logs

- Raw OCR text (`rawText`)
- OCR bounding box payloads (`boundingBoxes`)
- Full account numbers
- National identifiers and tax identifiers where avoidable

## Allowed in Logs

- `documentId`
- `userId` (where required for traceability)
- operation name
- error code/message (without sensitive payload)
- durations and aggregate metrics

## Enforcement

- Automated scanner: `pnpm security:scan-ocr-logs`
- CI recommendation: run scanner in pull request checks
- Code review rule: reject OCR logging that includes raw payload fields

## Incident Handling

If sensitive logging is detected:

1. Block release until fixed.
2. Remove offending logs and rotate affected logging streams where applicable.
3. Record security incident and remediation evidence.
