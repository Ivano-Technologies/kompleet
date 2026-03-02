# 03 Security Controls

## Security Baseline (SOC2 Security)

- Encryption in transit: TLS for API and service communication.
- Encryption at rest: managed by underlying platform storage settings.
- Access control: authenticated requests + RLS-backed ownership checks.
- Worker runtime secrets:
  - `REDIS_URL`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - startup fail-fast on missing values.

## Sensitive Data Controls

- OCR raw payloads are not persisted in final structured records.
- OCR raw payloads are prohibited in logs.
- CI scanner enforces log safety:
  - script: `scripts/scan-ocr-log-safety.js`
  - command: `pnpm security:scan-ocr-logs`

## Operational Security Checks

- Worker failures emit structured error logs.
- Duplicate/race conditions emit metrics events.
- Review routing emits auditable events.
