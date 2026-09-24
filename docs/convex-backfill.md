# Path B backfill: Supabase → Convex

**Project:** KOMPLEET Supabase `frlcvkmjuhnjcicwywrh`  
**Scope:** 5 `profiles` + 208 `transactions` (plus reference categories, import sessions/errors, export history).  
**Safety:** read-only on Supabase. No deletes, no Auth/Storage changes.

Run this only against a **dev/staging Convex deployment** after a write freeze. Production cutover is a CoS go.

## Prerequisites

1. `npx convex dev` has pushed the schema in `convex/` (do **not** use `npx convex deploy` unless this is production).
2. Local env:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://frlcvkmjuhnjcicwywrh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # or legacy service_role JWT
NEXT_PUBLIC_CONVEX_URL=https://<dev>.convex.cloud
CONVEX_DEPLOYMENT=dev:<name>              # from `npx convex dev`
```

3. You are logged into the Convex CLI **or** using `CONVEX_AGENT_MODE=anonymous` on a cloud agent (isolated, not the team prod deployment).

## Option A — one command (preferred)

Copies service-role credentials into the action args (they are not stored). Idempotent upserts by `externalId`.

```bash
npx convex run internal.backfill.fromSupabase '{
  "supabaseUrl": "https://frlcvkmjuhnjcicwywrh.supabase.co",
  "serviceRoleKey": "<SERVICE_ROLE>"
}'
```

Expected counts (snapshot 2026-09-24):

| Entity | Rows |
| --- | ---: |
| categories | whatever is in `public.categories` |
| users (from `profiles`) | 5 |
| transactions | 208 |
| import_sessions | 45 |
| import_errors | 101 |
| export_history | 100 |

Re-running the action patches existing `externalId`s — it does not duplicate.

## Option B — Node script

Same upserts, useful if you do not want to pass the service role through `convex run` args:

```bash
node scripts/backfill-supabase-to-convex.mjs
```

The script:

1. SELECTs from Supabase (service role).
2. Calls `npx convex run internal.*.upsertFromBackfill` per row.
3. Prints checksums: per-user transaction count and `sum(amount)`.
4. Never issues DELETE/UPDATE/TRUNCATE against Supabase.

## Verification

After either option:

```bash
npx convex run internal.backfill.fromSupabase   # second run; counts must match
```

Manually:

1. Sign in as each of the 5 users on staging.
2. `GET /api/transactions` returns that user’s rows; IDs match the old UUIDs.
3. Compare `sum(amount)` per `user_id` vs Supabase:

```sql
select user_id, count(*), sum(amount)
from public.transactions
group by user_id;
```

## What is not copied

- `auth.users` (Auth stays on Supabase)
- Storage objects (0)
- `clerk_users`
- Empty domain tables (`firms`, `clients`, `invoices`, `expenses`, `documents`) — Convex schema exists; no rows to copy
- `tax_rules` / keep-alive source (stays on Supabase)

## Rollback

Leave Supabase data intact. Point `NEXT_PUBLIC_CONVEX_URL` off and revert the Vercel deployment if needed. Do not delete the Supabase project.
