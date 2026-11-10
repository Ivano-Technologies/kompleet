# Data retention

**Matches shipped code** on `dev` (`convex/lib/eraseAccount.ts`, Settings → Delete account).  
Cron-based purge of leftover auth rows is documented here and implemented in a sibling PR; it does **not** run until that PR is merged **and Convex is deployed**.

## What we store (application)

Kompleet stores account profile, books (transactions, expenses, invoices, tax calculations), uploaded files in Convex `_storage`, and Convex Auth sessions / email OTPs.

## User self-service deletion

Settings → Delete account. The user must type `delete my account`.

Immediate erasure includes profile fields, library files, documents, receipts, avatars, logos, exports, import sessions, drafts, and the matching Convex `_storage` blobs. Auth sessions, accounts, and verification codes for that user are deleted.

Issued invoices are **kept for six years** as tax records. Names, emails, phones and addresses on those invoices (and archive snapshots) are replaced with a placeholder. The user row is anonymised (`deleted-{id}@deleted.invalid`).

## Windows

| Record | Window | Source |
|---|---|---|
| Account, files, `_storage`, drafts | Immediate on confirmed delete | `eraseMineHandler` |
| Issued invoices (deleted accounts) | 6 years from issue/create, then eligible to purge | `ISSUED_INVOICE_RETENTION_YEARS` |
| Anonymised user row | 30 days after `deletedAt` once no invoices remain | sibling retention cron, if deployed |
| Email OTPs / magic-link codes | 24 hours after Convex Auth `expirationTime` | sibling retention cron, if deployed |
| Auth sessions / refresh tokens | At Convex Auth `expirationTime` | sibling retention cron, if deployed |
| Active (not deleted) books | Until the user deletes the account | no automatic purge of live books |

## Legal hold

**Needs owner confirmation:** process for pausing deletion when a tax audit or legal hold applies.

## Processors

See [sub-processors](./sub-processors.md). Object files live in Convex `_storage`. Logs may exist in Vercel and Sentry for their own product retention (**needs owner confirmation** of those vendors’ periods).
