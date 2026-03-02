# 05 Idempotency Controls

## Controls Implemented

### Queue-Level Idempotency

- BullMQ job IDs use document ID:
  - `jobId = documentId`
- Prevents duplicate queue jobs for same document.

### DB-Level Guard

- Atomic claim update in repository:
  - claim only when status is `queued`
  - second claimant gets no row
- Unique index for user/idempotency key in migration:
  - `documents(user_id, idempotency_key)`

### Worker-Level Guard

- Skip when status is already `completed`.
- Skip when status is already `processing`.
- Duplicate claim metric increments on claim failure.

## Evidence

- Test: `tests/document-intelligence-duplicate-processing.test.ts`
  - concurrent race simulation
  - only one completion path succeeds
  - duplicate claim metric increments
