# 07 Review Workflow Controls

## Review Trigger Conditions

- Validation mismatch (for example VAT/total reconciliation errors)
- Low confidence score below configured auto-completion threshold

## Backend Review Contract (Stub Phase)

- Worker marks document as `needs_review`.
- Worker enqueues review intent through infrastructure review queue stub.
- Worker records audit event: `document_needs_review`.

## Review API Contract (Target)

`GET /api/v1/documents?status=needs_review`

Response shape:

```json
[
  {
    "documentId": "uuid",
    "vendor": "ABC Ltd",
    "issueDate": "2026-01-01",
    "confidenceScore": 71.2,
    "reviewReason": "VAT mismatch"
  }
]
```

## Approval/Override Flow (Target)

- `needs_review -> approved -> completed`
- Override actions must persist immutable audit records with:
  - reviewer id
  - field changed
  - old/new value
  - reason
  - timestamp

## Evidence

- See `docs/compliance/evidence/validation_review_test_output.txt`
