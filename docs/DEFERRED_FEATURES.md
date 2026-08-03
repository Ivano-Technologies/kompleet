# Deferred Features

Features removed from the live surface so broken routes stop 500ing, but
intentionally preserved in git history for revival.

---

## Gmail / Outlook email ingestion — postponed 2026-08-03

**Status:** postponed, not cancelled.  
**Removed in:** Phase 2 (`chore/phase-2-delete-before-build`), commit `dd3cb4ec5`.  
**Reviving commit:** `dd3cb4ec5^` (parent of the deletion commit — restore `src/lib/email/gmail.ts` and related paths from there).

### What was removed

| Path | Role |
| --- | --- |
| `src/app/api/email/connect/gmail/route.ts` | Start Gmail OAuth |
| `src/app/api/email/connect/outlook/route.ts` | Start Outlook OAuth |
| `src/app/api/email/callback/gmail/route.ts` | Gmail OAuth callback; wrote `email_connections` |
| `src/lib/email/gmail.ts` | googleapis client |
| `src/lib/email/outlook.ts` | Azure identity + Microsoft Graph client |
| Email section of `dashboard/ml-settings` | UI that previously lied about a connected account |

Outlook callback route never existed.

### Dependencies removed with it

`googleapis`, `@azure/identity`, `@microsoft/microsoft-graph-client` — verified no other consumers.

### Revival requirements

1. Recreate `email_connections` with **OAuth tokens encrypted at rest** (designed in, not bolted on). Never store refresh/access tokens as plaintext columns.
2. Scope rows by `client_id` (practitioner tenancy) once the firms/clients spine exists.
3. `revoke all … from anon` in the same migration that creates the table.
4. Implement the missing Outlook callback.
5. Restore env vars (`GMAIL_*`, `OUTLOOK_*`) via Vercel/EAS secrets only — never commit them.

Do not revive against the cancelled Mono open-banking path; statement upload remains the ingestion path.

---

## Mono open banking — cancelled 2026-08-03

Contract is not live. Integration deleted outright. **Do not revive** without a new commercial decision. Never create `bank_accounts` for Mono. Statement upload (`transactions/upload-v2` + bank adapters) is the product ingestion path.
