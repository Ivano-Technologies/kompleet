# Environment Variables Reference

This document lists all environment variables required for the KOMPLEET platform across different environments.

---

## Required for All Environments

### Public (Client-Side)

These variables are prefixed with `NEXT_PUBLIC_` and are exposed to the browser.

- **`NEXT_PUBLIC_SUPABASE_URL`** - Supabase project URL
  - Example: `https://frlcvkmjuhnjcicwywrh.supabase.co`
  - Required: Yes
  - Get from: Supabase Dashboard → Settings → API → Project URL

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** - Supabase anonymous key (public)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Required: Yes
  - Get from: Supabase Dashboard → Settings → API → anon public key

- **`NEXT_PUBLIC_SITE_URL`** - Application URL
  - Example: `https://kompleet.ng`
  - Required: No (defaults to `http://localhost:3000` in development)
  - Used for: OAuth redirects, email links

### Secret (Server-Side)

These variables are NEVER exposed to the browser. They are only available on the server.

- **`SUPABASE_SERVICE_ROLE_KEY`** - Supabase service role key
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (starts with `eyJ`)
  - Required: Yes (except in CI)
  - **⚠️ CRITICAL**: Never expose this in frontend code or commit to git
  - Get from: Supabase Dashboard → Settings → API → service_role key (click "Reveal")

- **`OPENAI_API_KEY`** - OpenAI API key for AI features
  - Example: `sk-...` (starts with `sk-`)
  - Required: Yes (except in CI)
  - **⚠️ CRITICAL**: Never expose this in frontend code or commit to git
  - Get from: https://platform.openai.com/api-keys

- **`DATABASE_URL`** (optional) - PostgreSQL connection string
  - Example: `postgresql://postgres:[PASSWORD]@db.frlcvkmjuhnjcicwywrh.supabase.co:5432/postgres`
  - Required: No (Supabase client uses URL + keys instead)
  - Get from: Supabase Dashboard → Settings → Database → Connection string → URI

---

## Environment-Specific Configuration

### Local Development (.env.local)

Create a `.env.local` file in the project root:

```bash
# Public
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# Secret (development placeholders are auto-provided)
SUPABASE_SERVICE_ROLE_KEY=eyJ_dev_placeholder
OPENAI_API_KEY=sk-dev_placeholder
```

**Note**: The `src/lib/env.ts` file provides fallback placeholder values in development mode, so you can run the app even without real API keys.

---

### GitHub Actions CI

**Where to set**: GitHub → Repository Settings → Secrets and Variables → Actions → Repository secrets

**Required secrets**:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Note**: Other server-side variables use placeholder values in CI (configured in `.github/workflows/ci.yml`):

- `SUPABASE_SERVICE_ROLE_KEY: 'eyJ_ci_placeholder_for_build'`
- `OPENAI_API_KEY: 'sk-ci_placeholder_for_build'`
- `DATABASE_URL: 'postgresql://ci:placeholder@localhost:5432/ci_build'`

This allows the build to pass without exposing real secrets in CI.

---

### Vercel Production

**Where to set**: Vercel Dashboard → Project Settings → Environment Variables

**Required for Production**:

| Variable                        | Environment | Value                                      |
| ------------------------------- | ----------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Production  | `https://frlcvkmjuhnjcicwywrh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production  | `[Your anon key]`                          |
| `NEXT_PUBLIC_SITE_URL`          | Production  | `https://kompleet.ng`                      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Production  | `[Your service role key]`                  |
| `OPENAI_API_KEY`                | Production  | `[Your OpenAI key]`                        |

**Steps to add**:

1. Go to: https://vercel.com/dashboard
2. Navigate to: Your Project → Settings → Environment Variables
3. Click: "Add New"
4. Name: `NEXT_PUBLIC_SUPABASE_URL`
5. Value: `https://frlcvkmjuhnjcicwywrh.supabase.co`
6. Environment: Check "Production"
7. Click: "Save"
8. Repeat for all variables above

---

## Optional Environment Variables

### AI Configuration

- **`ANTHROPIC_API_KEY`** - Anthropic Claude API key (fallback)
  - Example: `sk-ant-...`
  - Required: No
  - Used when: `AI_PRIMARY_PROVIDER=anthropic` or as fallback

- **`AI_ENABLED`** - Enable/disable AI features
  - Example: `true` or `false`
  - Default: `true`

- **`AI_PRIMARY_PROVIDER`** - Primary AI provider
  - Example: `openai` or `anthropic`
  - Default: `openai`

### Rate Limiting

- **`RATE_LIMIT_REQUESTS_PER_MINUTE`** - API rate limit per user
  - Example: `60`
  - Default: `60`
  - Range: 1-1000

### Payments (Paystack)

- **`PAYSTACK_SECRET_KEY`** - Paystack secret key
  - Example: `sk_...`
  - Required: No (unless using payments)
  - **⚠️ SECRET**: Never expose in frontend

- **`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`** - Paystack public key
  - Example: `pk_...`
  - Required: No (unless using payments)

### Analytics

- **`NEXT_PUBLIC_GA_MEASUREMENT_ID`** - Google Analytics measurement ID
  - Example: `G-XXXXXXXXXX`
  - Required: No

- **`SENTRY_DSN`** - Sentry error tracking DSN
  - Example: `https://examplePublicKey@o0.ingest.sentry.io/0`
  - Required: No (recommended for production)

---

## Security Best Practices

### ⚠️ Never Commit Secrets

**DO NOT** commit these to git:

- ❌ `.env.local` (added to `.gitignore`)
- ❌ `.env.production`
- ❌ Any file containing API keys

**DO** commit:

- ✅ `.env.example` (with placeholder values)
- ✅ This documentation file

### Secret Rotation

If any secret is exposed:

1. **Immediately** revoke it in the provider dashboard
2. Generate a new secret
3. Update in Vercel/GitHub Actions
4. Redeploy

### Environment Separation

- **Development**: Use placeholder/test keys
- **CI/CD**: Use placeholder keys for build
- **Production**: Use real production keys

**Never** use production keys in development or CI!

---

## Troubleshooting

### Build Fails with "Environment validation failed"

**Error**: `❌ Environment validation failed: SUPABASE_SERVICE_ROLE_KEY is required`

**Solution**:

- **Local dev**: Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` or let it use the placeholder
- **CI**: Verify placeholders are set in `.github/workflows/ci.yml`
- **Production (Vercel)**: Add the variable in Vercel dashboard

### Tests Fail with Missing Environment Variables

**Solution**: Environment variables are mocked in `src/test/setup.ts`. If tests still fail:

1. Check that `process.env.CI = 'true'` is set in test setup
2. Verify placeholders are provided in GitHub Actions workflow
3. Run tests locally with: `pnpm test`

### Vercel Deployment Fails: "Environment Variable references Secret which does not exist"

**Solution**: This happens when `vercel.json` uses `@secret-name` syntax but the secret doesn't exist.

- **Fixed in**: This project no longer uses secret references in `vercel.json`
- **Variables are set directly** in Vercel dashboard instead

---

## Quick Reference

**Get Supabase Credentials**:

```
https://supabase.com/dashboard/project/frlcvkmjuhnjcicwywrh
→ Settings → API
```

**Get OpenAI Key**:

```
https://platform.openai.com/api-keys
```

**Configure Vercel Variables**:

```
https://vercel.com/dashboard
→ Your Project → Settings → Environment Variables
```

**Configure GitHub Secrets**:

```
https://github.com/Ivano-Technologies/KOMPLEET-PLATFORM
→ Settings → Secrets and Variables → Actions
```

---

**Last Updated**: February 11, 2026
**Maintained By**: KOMPLEET Engineering Team
