# Incident response (NDPC)

**In force for personal-data breaches.** Last reviewed: 2026-11-10.  
**Needs owner confirmation:** paging tool, secondary phone numbers, and who files the NDPC form.

## Contacts

| Role | Who | How |
|---|---|---|
| User / public reports | Ivano Technologies support | `support@ivanotechnologies.com` |
| Data Protection Officer | David Inalegwu | via `support@ivanotechnologies.com` until a DPO mailbox is published |
| Engineering | Kompleet maintainers | GitHub + Vercel / Convex / Sentry dashboards |

**Needs owner confirmation:** whether a dedicated DPO email, Slack channel, or pager exists. An older playbook mentions PagerDuty; that is **not** confirmed in the current repo.

## NDPC 72-hour rule

Nigeria Data Protection Act / NDPC guidance: if a personal-data breach is likely to result in a risk to data subjects, notify the Nigeria Data Protection Commission **without undue delay and not later than 72 hours** after becoming aware.

1. Record **when** the team became aware (UTC).
2. Contain (rotate secrets, disable a route, revoke sessions, take a Convex/Vercel incident snapshot).
3. DPO (David Inalegwu) decides if the incident is a notifiable breach.
4. If yes, file with NDPC before hour 72. Copy `support@ivanotechnologies.com`.
5. Tell affected users when the DPO decides there is a high risk to them.

Do not wait for a full forensic report to start the 72-hour clock.

## Severity (working)

| Level | Meaning | First action |
|---|---|---|
| P1 | Confirmed or likely personal-data breach, auth bypass, or production outage with data risk | DPO + support mailbox + contain |
| P2 | Security control degraded (Sentry flood, auth provider down, leaked env in a preview) | Engineering lead; DPO if personal data may have left the system |
| P3 | Vulnerability with no evidence of access | Patch on `dev`, then production |
| P4 | Policy or documentation gap | Backlog |

## Detection sources that exist in the product today

- Sentry (`@sentry/nextjs`)
- Vercel runtime logs and deployment events
- Convex dashboard logs / function failures
- GitHub Actions `secret-scan` (gitleaks) on PRs to `dev` and `main`

**Needs owner confirmation:** whether production Sentry alerts page a human 24/7.

## After-action

Write what happened, what data was involved, NDPC reference if any, and the patch PR. Store with the DPO, not in the public repo.
