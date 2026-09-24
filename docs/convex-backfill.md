# Path B backfill: Supabase → Convex

**Project:** KOMPLEET Supabase `frlcvkmjuhnjcicwywrh`  
**Convex (CoS provisioned — do not create another):** team `techivano` / project `kompleet` / `dev/main`  
**Safety:** read-only on Supabase. No deletes, no Auth/Storage changes.

## Convex cloud (dev)

| Item | Value |
| --- | --- |
| Team | Ivano Technologies (`techivano`) |
| Project | `kompleet` |
| Deployment | `techivano:kompleet:dev/main` |
| Dashboard | https://dashboard.convex.dev/t/techivano/kompleet/shiny-cricket-316 |

### Vercel staging / preview (Shipping)

Set on the Vercel project. **Do not remove** existing Supabase Auth vars.

```bash
NEXT_PUBLIC_CONVEX_URL=https://shiny-cricket-316.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://shiny-cricket-316.convex.site
```

Keep:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://frlcvkmjuhnjcicwywrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable / sb_publishable_…>
# plus existing SUPABASE_SERVICE_ROLE_KEY for Auth admin / keep-alive / workers
```

CLI after login (dev only — never `npx convex deploy` for this cut):

```bash
npx convex deployment select techivano:kompleet:dev/main
npx convex dev --once
```

## Live checksums (Supabase before)

Snapshot via read-only SQL on `frlcvkmjuhnjcicwywrh` at **2026-09-24 11:25 UTC**. Earlier plan numbers (208 txns) are stale — e2e has written more rows.

| Entity | Supabase rows | Notes |
| --- | ---: | --- |
| `auth.users` | 5 | **Stay on Supabase Auth** |
| `profiles` | 5 | → Convex `users` (`externalId` = auth id) |
| `transactions` | **214** | `sum(amount) = 29231279.25`; all 214 belong to one `user_id` |
| `categories` | 23 | system categories |
| `import_sessions` | 46 | |
| `import_errors` | 101 | |
| `export_history` | **123** | grew from 113 during this cutover window |
| `expense_categories` | 8 | |
| `sources` | 8 | copied; keep-alive still reads Supabase `tax_rules` |
| `rule_versions` | 2 | |
| `tax_rules` | 35 | copied to Convex **and** left on Supabase for `/api/health/db` |
| `firms` / `clients` / `invoices` / `expenses` / `documents` | 0 | schema only |
| `storage.objects` | 0 | **Stay on Supabase Storage** |
| `bank_configs` | 15 | not in Convex schema (parser reference); left on Supabase |
| `clerk_users` | 1 | residue; not copied |

Per-user transaction checksum:

| user_id (auth) | n | sum(amount) |
| --- | ---: | ---: |
| `d0f86625-0df0-4505-a765-818bad833785` | 214 | 29231279.25 |

## Convex after backfill

Ran **2026-09-24 11:38 UTC** against `techivano:kompleet:dev/main` (`https://shiny-cricket-316.convex.cloud`).

Schema + functions: `npx convex dev --once` (not `deploy`).

Data: read-only SQL from `frlcvkmjuhnjcicwywrh` → `internal.backfill.fromSnapshot` (idempotent upserts by `externalId`). Auth users and Storage were not copied.

`npx convex run backfillCounts:checksums`:

| Entity | Convex rows | Match live Supabase? |
| --- | ---: | --- |
| users | 5 | yes (`externalId` = `profiles.id` / `auth.users.id`) |
| transactions | 214 | yes |
| sum(amount) | 29231279.25 | yes |
| categories | 23 | yes |
| importSessions | 46 | yes |
| importErrors | 101 | yes |
| exportHistory | 123 | yes (live count at cutover) |
| expenseCategories | 8 | yes |
| sources | 8 | yes |
| ruleVersions | 2 | yes |
| taxRules | 35 | yes |
| firms / clients / invoices / expenses / documents | 0 | yes (empty on both) |

Phase 4 (IVA-66) added `internal.documents.upsertFromBackfill` plus a `documents` section in `fromSupabase` / `fromSnapshot` / `pnpm backfill:convex`. If the Supabase `documents` table is missing or empty, the script skips and checksums stay 0. Re-run before Phase 6 teardown.

## Prerequisites

1. Logged into Convex CLI as a `techivano` member.
2. `npx convex dev --once` has pushed `convex/` to `shiny-cricket-316` (do **not** use `npx convex deploy`).
3. Local env:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://frlcvkmjuhnjcicwywrh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # or legacy service_role JWT
NEXT_PUBLIC_CONVEX_URL=https://shiny-cricket-316.convex.cloud
CONVEX_DEPLOYMENT=dev:shiny-cricket-316   # written by `deployment select`
```

## Option A — one command (preferred)

Copies service-role credentials into the action args (they are not stored). Idempotent upserts by `externalId`.

```bash
npx convex run internal.backfill.fromSupabase '{
  "supabaseUrl": "https://frlcvkmjuhnjcicwywrh.supabase.co",
  "serviceRoleKey": "<SERVICE_ROLE>"
}'
```

Re-running the action patches existing `externalId`s — it does not duplicate.

## Option C — snapshot (used for this cutover)

This VM had no `SUPABASE_SERVICE_ROLE_KEY`. Rows were SELECTed read-only via SQL, then upserted with:

```bash
npx convex run backfill:fromSnapshot '<json batch>'
```

Same upserts as Option A. Re-run is idempotent.

## Option B — Node script

```bash
node scripts/backfill-supabase-to-convex.mjs
```

1. SELECTs from Supabase (service role).
2. Calls `npx convex run internal.*.upsertFromBackfill` per row.
3. Prints checksums.
4. Never issues DELETE/UPDATE/TRUNCATE against Supabase.

## What is not copied

- `auth.users` (Auth stays on Supabase)
- Storage objects (0)
- `clerk_users`
- Empty domain tables — Convex schema exists; no rows to copy
- `bank_configs` (no Convex table)
- Keep-alive continues to hit Supabase `tax_rules` even after the copy

## Rollback

Leave Supabase data intact. Unset `NEXT_PUBLIC_CONVEX_URL` on Vercel or revert the preview. Do not delete the Supabase project.

## CoS / Shipping checklist (do not merge this PR from the agent)

- [x] CA logged in as `techivano`; selected `techivano:kompleet:dev/main`
- [x] CA: `npx convex dev --once` pushed schema + functions to `shiny-cricket-316`
- [x] CA: full app-data backfill + checksums recorded above
- [ ] Shipping: set `NEXT_PUBLIC_CONVEX_URL=https://shiny-cricket-316.convex.cloud` on Vercel **staging/preview**
- [ ] Shipping: optionally set `NEXT_PUBLIC_CONVEX_SITE_URL=https://shiny-cricket-316.convex.site`
- [ ] Shipping: keep all Supabase Auth env vars
- [ ] CoS: soak on staging; production go is a separate decision
- [ ] Do **not** tear down `frlcvkmjuhnjcicwywrh`
- [ ] Do **not** run `npx convex deploy` (production) from this work
- [ ] Do **not** bump the security-advisors baseline in this PR
