# Access control

**Matches Convex code** (`convex/lib/auth.ts`, `platformRole` on `users`).

## Authentication

- Convex Auth email + password (Password provider).
- Email verification and password reset use Resend OTP when Resend keys are present.
- Sessions are Convex Auth JWTs + `authSessions` / `authRefreshTokens`.
- **Needs owner confirmation:** production session lifetime vs library defaults (a sibling PR shortens JWT/session when merged and Convex-deployed).

## Authorisation

Every Convex query/mutation that touches tenant data goes through `getCurrentUser`. Soft-deleted users (`deletedAt` set) cannot sign in as that row.

`platformRole` values in schema: `owner`, `admin`, `tax_consultant`, `user`, `viewer`. Missing role means `user`. Platform-admin APIs (`users.listAll` and similar) require admin/owner checks in code.

Tenancy: books, files and invoices are scoped to the authenticated user (and firm membership where used). Storage IDs cannot be attached unless `assertStorageAssignableToUser` passes.

## Operator access (needs owner confirmation)

| Surface | Who should have it | Confirm |
|---|---|---|
| GitHub `Ivano-Technologies/kompleet` | Named engineers | Owner |
| Vercel project | Named engineers | Owner |
| Convex production deployment | Named engineers | Owner |
| Resend | Named engineers | Owner |
| Sentry | Named engineers | Owner |
| NDPC / DPO records | David Inalegwu | Owner |

No end-user passwords are stored in git or Vercel env as plaintext user secrets; Convex Auth stores credentials in `authAccounts`.

## Joiner / mover / leaver

**Needs owner confirmation:** checklist for adding or removing GitHub, Vercel, Convex, Resend and Sentry access. Product-side: user self-deletes via Settings, or an operator follows that same `eraseMine` path only with explicit authority.
