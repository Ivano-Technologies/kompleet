# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KOMPLEET is a tax compliance and financial management platform for Nigerian businesses and individuals, built in compliance with the Nigerian Tax Act 2026. It's a Next.js 16 (App Router) + TypeScript application with Clerk authentication, Supabase PostgreSQL, and Drizzle ORM.

## Essential Commands

```bash
# Development
pnpm dev                    # Start dev server at http://localhost:3000
pnpm build                  # Build for production
pnpm start                  # Start production server

# Testing
pnpm test                   # Run all tests (Vitest)
pnpm test:watch            # Watch mode for development

# Code Quality
pnpm lint                   # ESLint
pnpm typecheck             # TypeScript checking
pnpm format                # Prettier formatting

# CI/CD
pnpm ci                    # Full CI pipeline (lint + typecheck + test + build)
pnpm precommit            # Pre-commit hook (runs automatically via Husky)
```

## Architecture Overview

### Authentication & Security Pattern

The app uses a **Clerk → Supabase JWT integration**:
1. Clerk handles all authentication (OAuth, email/password, magic links)
2. Clerk webhook (`/api/webhooks/clerk`) syncs users to `clerk_users` table
3. Middleware (`src/app/middleware.ts`) protects dashboard routes
4. Supabase client extracts Clerk JWT from session for API calls
5. Row Level Security (RLS) policies use `get_clerk_user_id()` helper to enforce data isolation

**Critical**: All user data tables use RLS. Never bypass RLS by using the service role key in client-facing code.

### Database Layer

- **ORM**: Drizzle ORM with TypeScript schemas in `src/db/schema/`
- **Client**: `src/db/client.ts` provides the Drizzle instance
- **Supabase Clients**:
  - `src/lib/supabase/server.ts` - Server-side (uses Clerk JWT)
  - `src/lib/supabase/client.ts` - Browser-side
- **Migrations**: Auto-generated in `drizzle/` - apply with `drizzle-kit push:pg`

### Project Structure Philosophy

```
src/
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Protected routes with shared layout
│   ├── (auth)/                # Public auth pages
│   ├── (public)/              # Public pages
│   ├── api/                   # API routes (serverless functions)
│   └── middleware.ts          # Auth enforcement
├── components/                # React components (shadcn/ui in ui/)
├── lib/                       # Utilities & services
│   ├── services/              # Business logic (tax-computation, financial-statements, etc.)
│   ├── supabase/              # Supabase client factories
│   ├── env.ts                 # Zod-validated environment variables
│   └── logger.ts              # Pino structured logging with redaction
├── db/                        # Drizzle schema & client
├── types/                     # Shared TypeScript types
└── hooks/                     # React hooks
```

### Key Business Domain Patterns

**Tax Calculators**: Located in `src/lib/services/tax-computation-service.ts`. Each calculator (CIT, PIT, VAT, etc.) follows Nigerian Tax Act 2026 rules. Tax rates and thresholds are configurable via database tables.

**Transaction Categorization**: Two-tier system:
1. Rules-based engine (`src/lib/services/rules-engine.ts`) - deterministic, fast
2. AI-powered fallback (`src/lib/services/categorization-service.ts`) - uses OpenAI (primary) or Anthropic (fallback)

**Financial Statements**: Generated via `src/lib/services/financial-statements-service.ts` using transaction data. Supports balance sheets, P&L statements, and tax summaries.

**Form Generation**: NRS (Nigerian Revenue Service) forms are prefilled using templates in `src/lib/nrs-filing/`. Forms are generated as PDFs or Excel files.

### Environment Variables

Required variables are in `.env.example`. Key ones:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase connection
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations only
- `OPENAI_API_KEY` - AI categorization
- `APP_SECRET` - Min 32 chars for encryption
- Feature flags: `NEXT_PUBLIC_ENABLE_AI_CATEGORIZATION`, `NEXT_PUBLIC_ENABLE_PDF_PARSING`

Validate with `src/lib/env.ts` (uses Zod).

### Logging

Use structured logging via Pino (`src/lib/logger.ts`):
```typescript
import { logger } from '@/lib/logger';
logger.info('User action', { userId, action, result });
logger.error('Payment failed', { error, orderId });
```

Automatically redacts sensitive data (passwords, tokens, API keys, TIN, etc.).

### Testing

Tests use Vitest + jsdom. Key test files:
- `tests/smoke.test.ts` - Basic smoke tests
- `tests/sprint*.test.ts` - Feature-specific tests
- `tests/critical-path-integration.test.ts` - E2E flows
- `tests/ml-system.test.ts` - AI integration tests

Some test suites are excluded by default for speed (see `vitest.config.ts`).

### Styling

- Tailwind CSS 4 with PostCSS
- Dark mode via class-based strategy
- Primary brand color: Nigerian green (#008751)
- shadcn/ui components in `src/components/ui/`
- Design system documented in `docs/DESIGN_SYSTEM_PROPOSAL_V2.md`

### API Routes

All API routes are serverless functions in `src/app/api/`:
- Authentication required unless route is `/api/webhooks/*`
- Use `await auth()` from `@clerk/nextjs/server` to get user context
- Return proper HTTP status codes
- Use structured logging for all requests

### Critical Files for Setup

1. `src/app/middleware.ts` - Route protection logic
2. `src/lib/supabase/server.ts` - Server-side Supabase client with Clerk JWT
3. `src/db/schema/*` - Database schema definitions
4. `drizzle.config.ts` - Database connection config
5. `next.config.js` - Build and deployment settings

### Nigerian Tax Compliance Context

When working on tax-related features, understand:
- Nigeria uses **fiscal year = calendar year** (Jan 1 - Dec 31)
- **CIT (Corporate Income Tax)**: 30% standard rate, with SME relief tiers
- **VAT**: 7.5% standard rate with exemptions for basic goods
- **Tax deadlines**: Quarterly prepayments + annual filing
- Compliance forms use Nigerian Revenue Service (NRS) templates

See tax logic in `src/lib/services/tax-computation-service.ts` for implementation details.

### Related Documentation

- Setup: `README.md`
- Clerk integration: `CLERK_INTEGRATION_GUIDE.md`, `CLERK_DEVELOPER_GUIDE.md`
- Deployment: `DEPLOYMENT.md`, `DEPLOYMENT_CHECKLIST.md`
- ML governance: `docs/ml-governance/`
- Security: `SECURITY_AUDIT_REPORT.md`
