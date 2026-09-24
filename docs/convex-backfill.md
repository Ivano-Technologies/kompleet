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
| `export_history` | 113 | |
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

| Entity | Convex rows | Match? |
| --- | ---: | --- |
| users | *blocked — CA CLI not logged in as techivano* | |
| transactions + sum(amount) | *same* | |
| categories / import_* / export_history / expense_categories / sources / rule_versions / tax_rules | *same* | |

Re-run after login:

```bash
npx convex run internal.backfillCounts.checksums
```

Expected: users 5, transactions 214, sumAmount 29231279.25, categories 23, importSessions 46, importErrors 101, exportHistory 113, expenseCategories 8, sources 8, ruleVersions 2, taxRules 35, empty domain tables 0.

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

- [ ] Approve Convex device login for this cloud-agent VM (code in the PR comment / agent report)
- [ ] CA: `npx convex deployment select techivano:kompleet:dev/main` then `npx convex dev --once`
- [ ] CA: run backfill; paste Convex checksums into the table above
- [ ] Shipping: set `NEXT_PUBLIC_CONVEX_URL=https://shiny-cricket-316.convex.cloud` on Vercel **staging/preview**
- [ ] Shipping: keep all Supabase Auth env vars
- [ ] CoS: soak on staging; production go is a separate decision
- [ ] Do **not** tear down `frlcvkmjuhnjcicwywrh`
- [ ] Do **not** run `npx convex deploy` (production) from this work
