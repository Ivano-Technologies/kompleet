# Deployment Guide - Kompleet Platform

This guide covers deploying the Kompleet Platform to production with Supabase and Vercel.

## Prerequisites

Before deploying, ensure you have:

- [ ] Supabase project created
- [ ] Vercel account with project connected to GitHub
- [ ] All required environment variables ready
- [ ] Local build passes (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] TypeScript check passes (`npm run typecheck`)

## Step 1: Supabase Project Setup

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: kompleet-platform
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Wait for project to be provisioned (~2 minutes)

### 1.2 Run Database Migrations

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Alternatively, run migrations manually in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order:
   - `src/supabase/migrations/001_extensions.sql`
   - `src/supabase/migrations/002_enums.sql`
   - `src/supabase/migrations/003_core_tables.sql`
   - `src/supabase/migrations/004_rls.sql`
   - `src/supabase/migrations/005_functions.sql`
   - `src/supabase/migrations/006_triggers.sql`
   - `src/supabase/migrations/007_seed.sql`

### 1.3 Configure Authentication

1. Go to Supabase Dashboard → Authentication → Settings
2. Configure **Site URL**:
   - Production: `https://your-domain.com`
   - Development: `http://localhost:3000`
3. Configure **Redirect URLs** (add all):
   ```
   https://your-domain.com/auth/callback
   https://your-domain.com/auth/confirm
   https://*-your-vercel-team.vercel.app/auth/callback
   https://*-your-vercel-team.vercel.app/auth/confirm
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/confirm
   ```
4. Enable **Email Auth** (or other providers as needed)
5. Configure **Email Templates** (optional but recommended)

### 1.4 Get Supabase Credentials

From Supabase Dashboard → Settings → API:

- **Project URL**: `https://your-project.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (public, safe for client)
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (secret, server-only)

⚠️ **Important**: Only use Anon Key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 2: External Service Setup

### 2.1 Stripe Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API keys from Developers → API keys:
   - **Secret Key**: `sk_live_...` (production) or `sk_test_...` (development)
3. Create products and pricing:
   - Create "Pro" plan → Copy Price ID
   - Create "Enterprise" plan → Copy Price ID
4. Set up webhook endpoint:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy **Webhook Signing Secret**: `whsec_...`

### 2.2 OpenAI Configuration

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys
3. Create new secret key
4. Copy API key: `sk-...`

## Step 3: Environment Variables

### 3.1 Required Environment Variables

Create `.env.local` for local development (never commit this file):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...

# AI Configuration
OPENAI_API_KEY=sk-...

# Database (optional, Supabase SDK handles this)
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

### 3.2 Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable above
3. Select appropriate environments:
   - **Production**: Use production keys (live Stripe, etc.)
   - **Preview**: Use test keys for safe testing
   - **Development**: Optional (use `.env.local` instead)

### 3.3 Validation

Run environment validation locally:

```bash
npm run dev
```

If any variables are missing or invalid, you'll see clear error messages.

## Step 4: Vercel Deployment

### 4.1 Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### 4.2 Configure Deployment Settings

1. Go to Project Settings → Git
2. **Production Branch**: `main` (or your preferred branch)
3. **Automatic Deployments**: Enabled
4. **Preview Deployments**: Enabled (for all branches)

### 4.3 Deploy

1. Push to `main` branch:
   ```bash
   git push origin main
   ```
2. Vercel automatically builds and deploys
3. Monitor deployment in Vercel Dashboard → Deployments
4. Once complete, visit your production URL

### 4.4 Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update Supabase redirect URLs with your custom domain

## Step 5: Post-Deployment Verification

### 5.1 Smoke Tests

Manually verify these critical flows:

1. **Homepage loads**
   - Visit `https://your-domain.com`
   - Check for errors in browser console

2. **User Registration**
   - Go to `/signup`
   - Create a test account
   - Verify email confirmation (if enabled)

3. **User Login**
   - Go to `/login`
   - Log in with test account
   - Verify redirect to `/dashboard`

4. **Session Persistence**
   - Refresh the page
   - Verify still logged in
   - Check cookies in DevTools

5. **Protected Route Access**
   - Log out
   - Try to access `/dashboard`
   - Verify redirect to `/login`

6. **Logout**
   - Log in again
   - Click logout
   - Verify redirect to homepage

### 5.2 Database Verification

1. Go to Supabase Dashboard → Table Editor
2. Check that user profile was created in `profiles` table
3. Verify RLS policies are active (try accessing data without auth)

### 5.3 Monitoring

1. **Vercel Logs**:
   - Go to Vercel Dashboard → Deployments → [Latest] → Logs
   - Check for runtime errors

2. **Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Check for database errors or slow queries

3. **Stripe Webhooks**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Verify webhook endpoint is receiving events

## Common Deployment Issues

### Issue: Build fails with "Module not found"

**Cause**: Missing dependency or incorrect import path

**Solution**:

```bash
# Verify all dependencies are in package.json
npm install

# Check import paths use @/ alias correctly
# Example: import { createServerClient } from '@/lib/supabase/server'
```

### Issue: "Missing environment variables" error

**Cause**: Environment variables not set in Vercel

**Solution**:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add missing variables
3. Redeploy (Vercel → Deployments → [...] → Redeploy)

### Issue: Supabase auth redirect fails

**Cause**: Redirect URL not in Supabase allowlist

**Solution**:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your deployment URL to redirect URLs
3. Use wildcard for preview deployments: `https://*-your-team.vercel.app/auth/callback`

### Issue: "Failed to fetch" on API routes

**Cause**: CORS or network error

**Solution**:

1. Check Vercel function logs for errors
2. Verify environment variables are set
3. Check Supabase project is not paused (free tier auto-pauses after inactivity)

### Issue: Middleware causes infinite redirect loop

**Cause**: Middleware logic error or cookie issue

**Solution**:

1. Check `src/middleware.ts` route matching logic
2. Verify cookies are being set correctly
3. Check browser DevTools → Application → Cookies

### Issue: TypeScript errors in production build

**Cause**: Type errors not caught locally

**Solution**:

```bash
# Run typecheck locally
npm run typecheck

# Fix all errors before pushing
```

### Issue: Stripe webhook not receiving events

**Cause**: Webhook endpoint not reachable or signature verification fails

**Solution**:

1. Verify webhook URL is correct in Stripe Dashboard
2. Check `STRIPE_WEBHOOK_SECRET` is set correctly in Vercel
3. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to https://your-domain.com/api/webhooks/stripe
   ```

## Rollback Procedure

If a deployment causes issues:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click [...] → Promote to Production
4. Investigate issue in preview deployment before re-deploying

## Security Checklist

Before going live:

- [ ] All secrets use server-only variables (no `NEXT_PUBLIC_` prefix)
- [ ] Supabase RLS policies are enabled and tested
- [ ] Stripe webhook signature verification is enabled
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] Rate limiting is configured (if applicable)
- [ ] Error messages don't expose sensitive information
- [ ] Database backups are enabled (Supabase does this automatically)

## Monitoring & Maintenance

### Regular Checks

- **Weekly**: Review Vercel and Supabase logs for errors
- **Monthly**: Check Stripe webhook delivery status
- **Quarterly**: Review and update dependencies (`npm audit`)

### Scaling Considerations

- **Supabase**: Upgrade to Pro plan when approaching free tier limits
- **Vercel**: Monitor function execution time and bandwidth usage
- **Database**: Add indexes for frequently queried columns

## Support

If you encounter issues not covered here:

1. Check Vercel logs for detailed error messages
2. Review Supabase logs for database errors
3. Consult [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
4. Consult [Supabase Docs](https://supabase.com/docs)
5. Consult [Vercel Docs](https://vercel.com/docs)

## Next Steps

After successful deployment:

1. Set up monitoring (Sentry, LogRocket, etc.)
2. Configure analytics (Vercel Analytics, Google Analytics)
3. Set up automated backups
4. Create staging environment for testing
5. Document operational procedures
