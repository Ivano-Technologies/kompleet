# 02 Data Flow Diagram

## Logical Flow

```mermaid
flowchart LR
  client[Client]
  api[Upload API Route]
  db[(Supabase Documents)]
  queue[BullMQ Queue]
  worker[Document Worker]
  ocr[Tesseract Adapter]
  extract[Extraction Output]
  validate[Validation]
  review[Manual Review Queue Stub]
  search[(Search Index)]

  client --> api
  api --> db
  api --> queue
  queue --> worker
  worker --> db
  worker --> ocr
  ocr --> extract
  extract --> validate
  validate --> db
  validate -->|Mismatch/Low confidence| review
  validate -->|Valid| search
```

## Data Classification Notes

- Raw OCR output (`rawText`, `boundingBoxes`) is internal-only.
- Persisted output is sanitized structured data + deterministic hash.
- Manual review reason and transitions are audited.
