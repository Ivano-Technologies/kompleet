# Convex Auth + Storage cutover (IVA-60)

**Decision lock (Kezie via CoS, 2026-09-24):** leave Path B. App DB stays on Convex (`shiny-cricket-316`). Move web **Auth** and **Storage** fully onto Convex. Do **not** enable Production Vercel `NEXT_PUBLIC_CONVEX_URL`.

## What changed

| Surface | Before (Path B) | After |
| --- | --- | --- |
| Web sign-in / sign-up / session / middleware | Supabase Auth (`@supabase/ssr`) | `@convex-dev/auth` Password |
| Password reset / change | Supabase email links | OTP via Resend (if configured) or reclaim-via-signup |
| `ctx.auth.getUserIdentity()` | Supabase JWT (`customJwt` ES256) | Convex Auth JWT (`CONVEX_SITE_URL`) |
| File uploads | In-memory parse; Storage unused | Convex `ctx.storage` (`storageId` on imports / docs / expenses / avatars) |

Supabase JWT verification remains in `convex/auth.config.ts` so the Expo app can keep calling Convex during soak. The **web** path does not use `@supabase/ssr` for login.

## Environment

### Next.js (Vercel Preview / Development only)

```
NEXT_PUBLIC_CONVEX_URL=https://shiny-cricket-316.convex.cloud
NEXT_PUBLIC_SITE_URL=https://kompleet-git-staging-techivano.vercel.app
```

Leave **Production** `NEXT_PUBLIC_CONVEX_URL` unset.

Supabase URL / keys stay set for leftover Postgres + keep-alive. They are not the live web auth source.

### Convex deployment (`techivano` / `kompleet` / `shiny-cricket-316`)

```
npx convex env set JWT_PRIVATE_KEY "..."
npx convex env set JWKS "..."
npx convex env set SITE_URL https://kompleet-git-staging-techivano.vercel.app
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
4. `createOrUpdateUser` links the new Convex Auth account to that profile. Transactions stay attached via `userId`.

Do **not** invent credentials. After reclaim, `/forgot-password` works if `AUTH_RESEND_KEY` is set (8-digit code → `/reset-password`). If Resend is unset, the reset code is written to Convex logs for a one-time CoS handoff.

List emails (after deploy):

```
npx convex run users:listEmailsInternal
```

## File storage backfill

`scripts/backfill-supabase-storage-to-convex.mjs` lists Supabase buckets. Path B recorded **0 objects**. If the script prints `nothing to copy`, skip. New uploads (bank statements, avatars, receipts) write Convex `storageId`s only.

## Rollback

1. Revert this PR on `staging`.
2. Web login returns to Supabase Auth; Convex data rows are unchanged.
3. Do not delete Convex Auth tables until soak is abandoned.
4. Do not pause or delete the Supabase project (later ticket).

## Out of scope

- Production Convex URL
- Supabase project teardown
- Mobile Auth/Storage cutover
- JUO campaign repos
- Security-advisors baseline bump
