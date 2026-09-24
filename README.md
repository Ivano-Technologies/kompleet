# KOMPLEET Platform (Web)

**KOMPLEET** is a financial management platform for Nigerian businesses and individuals, built around the Nigeria Tax Act 2025/2026.

Live: [ivanotechnologies.com](https://ivanotechnologies.com)

## Overview

- **Authentication** — Supabase Auth (email/password; OAuth helpers exist). Clerk is **not** in use.
- **Application database** — Convex (path B). Public API IDs stay UUID `externalId` values.
- **Auth + Storage** — still Supabase through soak. Do not migrate Auth or Storage yet.
- **Transactions, expenses, invoices, profiles** — Convex queries/mutations.
- **Tax calculators, NRS forms, reports** — existing feature set; keep-alive still pings Supabase `tax_rules`.

## Tech Stack

| Layer | What is live |
| --- | --- |
| Web | Next.js App Router (`src/app`), TypeScript, Tailwind |
| Auth | Supabase Auth (`@supabase/ssr` cookies + Bearer for mobile) |
| App data | Convex (`convex/`) |
| Storage | Supabase Storage (empty; keep until first receipt) |
| Deploy | Vercel |
| Package manager | pnpm |

## Path B (IVA-60)

Kezie locked **path B**: Convex for application tables; keep Supabase Auth and Storage through soak.

- Convex verifies GoTrue JWTs (`convex/auth.config.ts`, ES256 / JWKS). HS256 legacy tokens will not verify.
- After login, `/api/auth/ensure-profile` upserts the Convex `users` row (`users.externalId` = `auth.users.id`).
- One-time backfill of the 5 profiles + 208 transactions: [docs/convex-backfill.md](docs/convex-backfill.md).
- Full inventory and cutover notes: [docs/convex-migration-plan.md](docs/convex-migration-plan.md).
- Do **not** tear down the Supabase project. Do **not** run `npx convex deploy` except for production.

## Setup

### Prerequisites

- Node.js 20+ and pnpm
- Supabase project (Auth + existing KOMPLEET project `frlcvkmjuhnjcicwywrh`)
- Convex project (dev deployment). Cloud agents: `CONVEX_AGENT_MODE=anonymous npx convex dev`

### Environment variables

Copy `.env.example` to `.env.local`:

```bash
# Auth (keep)
NEXT_PUBLIC_SUPABASE_URL=https://frlcvkmjuhnjcicwywrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# App database (Convex)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

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
│   ├── auth.config.ts          # Supabase Auth JWT (ES256)
│   ├── users.ts                # profiles
│   ├── transactions.ts
│   └── ...
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login / signup (Supabase Auth UI)
│   │   ├── (dashboard)/
│   │   └── api/                # Route handlers → Convex for app data
│   ├── lib/
│   │   ├── convex/             # Http client + request auth bridge
│   │   └── supabase/           # Auth session / SSR only
├── scripts/backfill-supabase-to-convex.mjs
└── docs/convex-migration-plan.md
```

## Authentication flow (live)

1. Browser: `@supabase/ssr` cookie session (`src/lib/supabase/client.ts`)
2. Server/RSC: `createServerClient()` / `requireAuth()`
3. API routes: `getSupabaseForRequest` (cookies **or** `Authorization: Bearer`) then `ConvexHttpClient.setAuth(access_token)`
4. Convex wrappers enforce ownership (`getCurrentUser` in `convex/lib/auth.ts`)

## What stays on Supabase

- Login, signup, email confirm, password change, account delete (Auth admin)
- Storage buckets (0 objects today)
- Keep-alive (`GET /api/health/db` → `tax_rules`) so the Free project does not pause
- CI jobs that still target Postgres (schema-drift, migrations-applied, rls-negative, security-advisors)

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
- [docs/AUTH_MIGRATION_PLAN.md](docs/AUTH_MIGRATION_PLAN.md) — Supabase Auth is current; Clerk is deferred/stale
- [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)

## License

Proprietary — Ivano Technologies Ltd © 2026
