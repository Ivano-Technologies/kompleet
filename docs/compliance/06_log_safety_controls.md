# 06 Log Safety Controls

## Objective

Prevent sensitive OCR and financial payload leakage into logs.

## Enforced Rules

- Prohibited log fields:
  - `rawText`
  - `boundingBoxes`
  - `ocrRawText`
- Sensitive identifier patterns are flagged by scanner.

## Enforcement Mechanism

- Script: `scripts/scan-ocr-log-safety.js`
- Package command: `pnpm security:scan-ocr-logs`
- Fails on prohibited logger context patterns in OCR/worker/test paths.

## Sanitization Control

- Worker sanitizes OCR output before persistence:
  - strips raw OCR text and bounding boxes.

## Evidence

- See `docs/compliance/evidence/log_scan_ci_output.txt`
