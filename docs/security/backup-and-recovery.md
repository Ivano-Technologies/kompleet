# Backup and recovery

**Status: draft — needs owner approval before it is treated as policy.**

Kompleet’s system of record is **Convex** (documents + `_storage`). The web app is **Next.js on Vercel** (iad1). There is no application Postgres in the current `dev` tree.

## What we believe today (unconfirmed)

| Layer | Likely control | Confirm with |
|---|---|---|
| Convex documents | Convex cloud backups / point-in-time as offered on the current Convex plan | Convex dashboard + Ivano billing owner |
| Convex `_storage` | Same Convex plan; restore of blobs is **not** scripted in this repo | Convex |
| Vercel deployments | Git `main` / `dev` + Vercel deployment history; instant rollback of a deployment | Vercel |
| Source code | GitHub `Ivano-Technologies/kompleet` | GitHub |
| Email (Resend) | Transactional only; not a backup of user books | Resend |
| Sentry | Error events, not a data backup | Sentry |

Older docs (`docs/DATABASE_PITR_GUIDE.md`) describe **Supabase/Postgres PITR**. That stack is retired. Do not use those steps.

## Recovery objectives (proposed, not approved)

| Item | Proposed | Status |
|---|---|---|
| RPO (data loss window) | Convex plan default | **Needs owner approval** |
| RTO (time to restore Kompleet) | Redeploy Vercel from a known-good SHA + Convex restore | **Needs owner approval** |
| Restore test | Quarterly restore drill of a non-production Convex deployment | **Needs owner approval** |
| Who can restore | Named Ivano operators only | **Needs owner approval** |

## Do not

- Treat Vercel preview deployments as backups of customer books.
- Restore production Convex from an unverified export.
- Commit database dumps to git.

## Owner sign-off

- [ ] Convex plan backup/PITR documented with real RPO
- [ ] Restore drill date and operator named
- [ ] This draft replaced with an approved version
