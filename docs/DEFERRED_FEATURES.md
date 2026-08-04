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

## Expo SDK 57 mobile bump — deferred 2026-08-04

**Status:** deferred.  
**Open PR:** [#60](https://github.com/Ivano-Technologies/kompleet/pull/60) (`dependabot/…/expo-sdk-9da05cfd37`) — grouped replacement for the closed individual #45/#53 majors.

`apps/mobile` is on **Expo SDK 54**. The proper upgrade path is `expo install --fix` + `expo-doctor` + EAS rebuild (not piecemeal Dependabot majors). Last mobile artifact is the March 2026 internal AAB and was never distributed — there is no live OTA/client fleet to protect, and Wave A (tenancy spine) is the near-term focus.

**When to revive:** schedule as its own mobile milestone before any Play/TestFlight distribution. Do not merge #60 into the web release train.

---

## Mono open banking — cancelled 2026-08-03

Contract is not live. Integration deleted outright. **Do not revive** without a new commercial decision. Never create `bank_accounts` for Mono. Statement upload (`transactions/upload-v2` + bank adapters) is the product ingestion path.
