# Convex Auth + Storage cutover (IVA-60)

**Decision lock (Kezie via CoS, 2026-09-24; prod cutover IVA-183, 17 Oct 2026):** leave Path B. App DB, Auth and Storage are on Convex. Production is `wooden-toucan-837` (`https://wooden-toucan-837.convex.cloud`) at https://kompleet.techivano.com. Preview and Development use `shiny-cricket-316`.

## What changed

| Surface | Before (Path B) | After |
| --- | --- | --- |
| Web sign-in / sign-up / session / middleware | Supabase Auth (`@supabase/ssr`) | `@convex-dev/auth` Password |
| Password reset / change | Supabase email links | OTP via Resend (if configured) or reclaim-via-signup |
| `ctx.auth.getUserIdentity()` | Supabase JWT (`customJwt` ES256) | Convex Auth JWT (`CONVEX_SITE_URL`) |
| File uploads | In-memory parse; Storage unused | Convex `ctx.storage` (`storageId` on imports / docs / expenses / avatars) |

Supabase JWT verification remains in `convex/auth.config.ts` so the Expo app can keep calling Convex during soak. The **web** path does not use `@supabase/ssr` for login.

## Environment

### Next.js (Vercel)

```
NEXT_PUBLIC_CONVEX_URL=https://shiny-cricket-316.convex.cloud
NEXT_PUBLIC_SITE_URL=https://kompleet-git-dev-techivano.vercel.app
```

Production `NEXT_PUBLIC_CONVEX_URL` is `https://wooden-toucan-837.convex.cloud` (set since IVA-183 on 17 Oct 2026). Preview and Development stay on `shiny-cricket-316`.

Supabase URL / keys stay set for leftover Postgres + keep-alive. They are not the live web auth source.

### Convex deployment (`techivano` / `kompleet` / `shiny-cricket-316`)

```
npx convex env set JWT_PRIVATE_KEY "..."
npx convex env set JWKS "..."
npx convex env set SITE_URL https://kompleet-git-dev-techivano.vercel.app
# optional, enables /forgot-password email
npx convex env set AUTH_RESEND_KEY "re_..."
```

Generate keys:

```
node scripts/generate-convex-auth-keys.mjs
```

Push functions (when the CLI is logged in as the team):

```
npx convex dev --once --env-file .env.local
```

If the cloud agent cannot log in, CoS/Shipping: `npx convex login`, select team `techivano` project `kompleet`, set the env vars above, then `npx convex dev --once`.

## Existing ~5 users (passwords cannot be ported)

1. Open `/signup`.
2. Enter the **same email** already on the Convex `users` row.
3. Choose a new password (min 8 characters, one number).
4. Enter the 8 digit email code. `createOrUpdateUser` links the new Convex Auth account to that profile only after the code succeeds. Transactions stay attached via `userId`.

Accounts that already had a password before email verification shipped are treated as verified (no one time prompt). New signups must verify.

Do **not** invent credentials. After reclaim, `/forgot-password` works if `AUTH_RESEND_KEY` is set (8-digit code → `/reset-password`). If Resend is unset, the reset code is written to Convex logs for a one-time CoS handoff.

List emails (after deploy):

```
npx convex run users:listEmailsInternal
```

## File storage backfill

`scripts/backfill-supabase-storage-to-convex.mjs` lists Supabase buckets. Path B recorded **0 objects**. If the script prints `nothing to copy`, skip. New uploads (bank statements, avatars, receipts) write Convex `storageId`s only.

## Rollback

1. Revert this PR on `dev`.
2. Web login returns to Supabase Auth; Convex data rows are unchanged.
3. Do not delete Convex Auth tables until soak is abandoned.
4. Do not pause or delete the Supabase project (later ticket).

## Out of scope

- Further Production Convex URL changes (prod is `wooden-toucan-837` at kompleet.techivano.com since IVA-183)
- Supabase project teardown
- Mobile Auth/Storage cutover
- JUO campaign repos
- Security-advisors baseline bump
