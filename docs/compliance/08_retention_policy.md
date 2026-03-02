# 08 Retention Policy

## Retention Objective

Support auditability and tax/compliance obligations with controlled data lifecycle.

## Policy Summary

- Target retention horizon: 7 years for compliance-relevant records.
- Structured extraction data retained per policy.
- Audit trail metadata retained for legal/operational traceability.

## Deletion Workflow Requirements

On valid deletion request:

1. Delete or anonymize active document payloads per policy.
2. Remove related search index entries.
3. Preserve compliance-safe audit records where legally required.

## Access and Export Requirements

- Users must be able to access/export structured document history and audit-related records as required by policy.

## NDPR Operational Notes

- Consent capture for processing must be present.
- Breach response must support 72-hour notification workflow where required.

## References

- `docs/ocr/COMPLIANCE_MAPPING_SOC2_NDPR.md`
- `docs/ocr/PRODUCTION_SIGNOFF.md`
