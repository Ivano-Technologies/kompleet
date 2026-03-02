# 09 Alerting and Escalation Matrix

## Alert Levels

### Level 1 - Warning

Examples:

- OCR duration > 5s
- Confidence < 70
- Retry count > 1

Action:

- Log and trend review

### Level 2 - Operational Alert

Examples:

- Duplicate claim count spike
- Queue backlog above threshold
- Validation mismatch ratio > 15%

Action:

- On-call alert
- Operational triage

### Level 3 - Critical

Examples:

- Raw OCR text detected in logs
- DB write failure spike
- Worker crash loop
- Validation rule path disabled

Action:

- Freeze processing pipeline
- Escalate to incident protocol
- Preserve forensic logs

## Required Dashboards

- OCR duration histogram
- Queue depth and lag
- Duplicate claim counter
- Validation mismatch ratio
- Manual review backlog
- Worker memory and restart count
