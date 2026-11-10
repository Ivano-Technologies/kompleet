# Kompleet security policies

These notes support Ivano Technologies’ NDPC registration pack. They describe **Kompleet as of November 2026** on the `dev` line (Next.js on Vercel, Convex backend, Convex Auth, Resend, Sentry).

Stale Supabase-era files (`docs/SECURITY.md`, `docs/INCIDENT_RESPONSE.md`) are **not** the source of truth.

| Document | Status |
|---|---|
| [Incident response](./incident-response.md) | In force for NDPC 72-hour notification. On-call tooling still needs owner confirmation. |
| [Data retention](./data-retention.md) | Matches shipped account-deletion code. Cron purge is in a sibling PR until merged and Convex-deployed. |
| [Backup and recovery](./backup-and-recovery.md) | **Draft — needs owner approval.** |
| [Sub-processors](./sub-processors.md) | Processors named in code and env. Regions need owner confirmation. |
| [Access control](./access-control.md) | Matches Convex `getCurrentUser` and `platformRole`. |

Contact for this pack: `support@ivanotechnologies.com`. DPO: David Inalegwu.
