# KOMPLEET Platform (Web)

**KOMPLEET** is a financial management platform for Nigerian businesses and individuals, built around the Nigeria Tax Act 2025/2026.

Live: [ivanotechnologies.com](https://ivanotechnologies.com)

## Overview

- **Authentication** — Convex Auth (`@convex-dev/auth`) email + password for the web app.
- **Application database** — Convex. Public API IDs stay UUID `externalId` values.
- **File storage** — Convex file storage (`ctx.storage`). Supabase buckets were empty; no file backfill.
- **Transactions, expenses, invoices, profiles** — Convex queries/mutations.
- **Tax calculators, NRS forms, reports** — existing feature set; keep-alive still pings Supabase `tax_rules`.

## Tech Stack

| Layer | What is live |
| --- | --- |
| Web | Next.js App Router (`src/app`), TypeScript, Tailwind |
| Auth | Convex Auth (`@convex-dev/auth` cookies). Mobile may still send Supabase JWTs. |
| App data | Convex (`convex/`) |
| Storage | Convex file storage |
| Deploy | Vercel |
| Package manager | pnpm |

## IVA-60 (leave Path B — Auth + Storage on Convex)

Kezie (via CoS, 2026-09-24): keep Convex as the app DB, and move **Auth and Storage** onto Convex. Production `NEXT_PUBLIC_CONVEX_URL` stays **OFF** until Kezie says so.

- Web auth: `@convex-dev/auth` Password provider. See [docs/convex-auth-storage.md](docs/convex-auth-storage.md).
- Identity remap: existing Convex `users` rows are linked **by email**. `supabaseUserId` / old `externalId` stay as migration aids.
- Existing passwords **cannot** be ported. The ~5 live users sign up again with the **same email** (new password) to reclaim transactions.
- File uploads write to Convex storage. Supabase buckets had 0 objects — backfill skipped (`scripts/backfill-supabase-storage-to-convex.mjs`).
- Do **not** tear down the Supabase project. Do **not** set Production `NEXT_PUBLIC_CONVEX_URL`. Do **not** run `npx convex deploy` except for production.

## Setup

### Prerequisites

- Node.js 20+ and pnpm
- Supabase project (Auth + existing KOMPLEET project `frlcvkmjuhnjcicwywrh`)
- Convex project (dev deployment). Cloud agents: `CONVEX_AGENT_MODE=anonymous npx convex dev`

### Environment variables

Copy `.env.example` to `.env.local`:

```bash
# Convex (app DB + Auth + Storage)
NEXT_PUBLIC_CONVEX_URL=https://shiny-cricket-316.convex.cloud

# Leftover Postgres / keep-alive (do not delete the project)
NEXT_PUBLIC_SUPABASE_URL=https://frlcvkmjuhnjcicwywrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Convex deployment env (dashboard / `npx convex env set`), not Next.js:

- `JWT_PRIVATE_KEY` + `JWKS` — generate with `node scripts/generate-convex-auth-keys.mjs`
- `SITE_URL` — staging origin, e.g. `https://kompleet-git-staging-techivano.vercel.app`
- `AUTH_RESEND_KEY` (optional) — enables `/forgot-password` emails

See [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md).

### Install and run

```bash
pnpm install
CONVEX_AGENT_MODE=anonymous npx convex dev   # generates convex/_generated; use your own login locally
pnpm dev
```

Open http://localhost:3000

## Project structure

```
kompleet-platform/
├── convex/                     # Schema + queries/mutations (app data)
│   ├── schema.ts
│   ├── auth.ts                 # Convex Auth (Password)
│   ├── auth.config.ts          # Convex Auth + leftover Supabase JWT (mobile)
│   ├── users.ts                # profiles (email remap)
│   ├── transactions.ts
│   └── ...
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── login / signup      # Convex Auth email+password
│   │   ├── (dashboard)/
│   │   └── api/                # Route handlers → Convex for app data
│   ├── lib/
│   │   ├── convex/             # Http client + request auth bridge
│   │   └── supabase/           # Leftover Postgres data client (not web auth)
├── scripts/backfill-supabase-to-convex.mjs
└── docs/convex-migration-plan.md
```

## Authentication flow (live)

1. Browser: `useAuthActions()` (Password) → Convex Auth cookies via `/api/auth`
2. Server/RSC: `convexAuthNextjsToken()` / `requireAuth()`
3. API routes: Convex Auth cookie **or** `Authorization: Bearer`, then `ConvexHttpClient.setAuth`
4. `createOrUpdateUser` + `getCurrentUser` map identity to the existing `users` row by email

## What stays on Supabase (do not delete)

- Leftover Postgres tables still used by some API routes (service-role + `user.id` filter)
- Keep-alive (`GET /api/health/db` → `tax_rules`) so the Free project does not pause
- CI jobs that still target Postgres (schema-drift, migrations-applied, rls-negative, security-advisors)
- Mobile app Auth/Storage until a follow-up cutover

## Development vs production Convex

- Development: `npx convex dev` (or `CONVEX_AGENT_MODE=anonymous` for cloud agents)
- Production only: `npx convex deploy` — never use this to “try it out”

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
```

RLS-negative tests still run against **local** Supabase (tenancy spine). They do not replace Convex ownership wrappers.

## Related docs

- [docs/convex-migration-plan.md](docs/convex-migration-plan.md)
- [docs/convex-backfill.md](docs/convex-backfill.md)
- [docs/convex-auth-storage.md](docs/convex-auth-storage.md) — Auth + Storage cutover, reset flow, rollback
- [docs/SUPABASE_CUTOVER_KILL_LIST.md](docs/SUPABASE_CUTOVER_KILL_LIST.md) — leftover Supabase surfaces by domain (strip plan)
- [docs/AUTH_MIGRATION_PLAN.md](docs/AUTH_MIGRATION_PLAN.md) — historical; Clerk is deferred/stale
- [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)

## License

Proprietary — Ivano Technologies Ltd © 2026
