# Vercel Deployment Compatibility

This document outlines the Vercel-specific considerations for the Kompleet Platform.

## Runtime Compatibility

### Edge Runtime vs Node.js Runtime

The application uses both Edge and Node.js runtimes appropriately:

#### Edge Runtime (Middleware)

- **File**: `src/middleware.ts`
- **Runtime**: Vercel Edge (automatically detected)
- **Constraints**:
  - No Node.js APIs (fs, path, crypto)
  - No native modules
  - Limited to Web APIs only
- **Current Usage**: ✅ Compatible
  - Uses `@supabase/supabase-js` (Edge-compatible)
  - Uses Next.js `cookies()` (Edge-compatible)
  - No Node.js-specific APIs

#### Node.js Runtime (Routes & Components)

- **Files**: Server Components, Route Handlers, Server Actions
- **Runtime**: Node.js 18.x (Vercel default)
- **Constraints**: None (full Node.js API access)
- **Current Usage**: ✅ Compatible
  - All server-side code uses standard Node.js APIs
  - Supabase client works in both runtimes

## Environment Variables

### Vercel Environment Variable Setup

All environment variables must be configured in Vercel project settings:

1. **Production Variables**:
   - Set in Vercel Dashboard → Project → Settings → Environment Variables
   - Select "Production" environment

2. **Preview Variables**:
   - Set in Vercel Dashboard → Project → Settings → Environment Variables
   - Select "Preview" environment
   - Can differ from production (e.g., test Stripe keys)

3. **Development Variables**:
   - Use `.env.local` for local development
   - Not committed to Git
   - See `.env.example` for reference

### Required Variables for Vercel

```bash
# Supabase (public - safe for client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (encrypted by Vercel)
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

## Build Configuration

### Next.js Build on Vercel

The application is configured for optimal Vercel deployment:

- **Framework**: Next.js 16 (App Router)
- **Build Command**: `npm run build` (automatic)
- **Output Directory**: `.next` (automatic)
- **Install Command**: `npm install` (automatic)

### Build Checks

Before deployment, ensure these pass locally:

```bash
npm run build      # Next.js production build
npm run typecheck  # TypeScript type checking
npm run test       # Unit tests
```

## Edge Function Limitations

### What Works on Edge

✅ Supabase client (auth, database queries)  
✅ Fetch API  
✅ Web Crypto API  
✅ Next.js cookies, headers  
✅ JSON parsing/stringifying

### What Doesn't Work on Edge

❌ Node.js `fs` module  
❌ Node.js `crypto` module  
❌ Native modules (bcrypt, sharp, etc.)  
❌ Child processes  
❌ File system access

### Current Implementation Status

✅ **Middleware**: Fully Edge-compatible  
✅ **Server Components**: Node.js runtime (no Edge constraints)  
✅ **Route Handlers**: Node.js runtime (no Edge constraints)

## Vercel-Specific Features

### Automatic HTTPS

- All Vercel deployments use HTTPS by default
- No additional SSL configuration needed
- Supabase redirect URLs must use `https://`

### Preview Deployments

- Every Git push creates a preview deployment
- Preview URLs: `https://kompleet-platform-git-[branch]-[team].vercel.app`
- Use preview environment variables for testing

### Production Deployments

- Triggered by pushes to `main` branch (default)
- Production URL: `https://kompleet-platform.vercel.app` (or custom domain)
- Use production environment variables

## Supabase Integration on Vercel

### Auth Redirect URLs

Configure these in Supabase Dashboard → Authentication → URL Configuration:

**Production**:

```
https://your-domain.com/auth/callback
https://your-domain.com/auth/confirm
```

**Preview** (wildcard for all preview deployments):

```
https://*-your-team.vercel.app/auth/callback
https://*-your-team.vercel.app/auth/confirm
```

**Development**:

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
```

### Cookie Configuration

Vercel automatically handles cookies for auth:

- Secure flag: Enabled on HTTPS (automatic)
- SameSite: Lax (default)
- Domain: Automatic (matches deployment URL)

## Performance Optimization

### Edge Caching

- Static assets cached at Edge locations globally
- API routes can opt into caching with headers
- Middleware runs at Edge (low latency)

### Serverless Functions

- Server Components and Route Handlers run as serverless functions
- Cold start: ~100-300ms (acceptable for most use cases)
- Warm instances reused for subsequent requests

## Troubleshooting

### Common Issues

**Issue**: "Module not found" in middleware  
**Solution**: Ensure all middleware imports are Edge-compatible (no Node.js APIs)

**Issue**: Environment variables not available  
**Solution**: Check Vercel Dashboard → Environment Variables → Redeploy

**Issue**: Supabase auth redirect fails  
**Solution**: Add deployment URL to Supabase redirect allowlist

**Issue**: Build fails on Vercel but works locally  
**Solution**: Run `npm run build` locally to reproduce, check TypeScript errors

## Deployment Checklist

Before deploying to Vercel:

- [ ] All environment variables configured in Vercel Dashboard
- [ ] Supabase redirect URLs include Vercel deployment URLs
- [ ] `npm run build` passes locally
- [ ] `npm run typecheck` passes locally
- [ ] `npm run test` passes locally
- [ ] No Node.js APIs in middleware
- [ ] No secrets in `NEXT_PUBLIC_` variables

## Monitoring

### Vercel Analytics

- Enable in Vercel Dashboard → Analytics
- Tracks page views, performance, Web Vitals

### Vercel Logs

- Access in Vercel Dashboard → Deployments → [Deployment] → Logs
- Shows serverless function logs
- Useful for debugging production issues

## Resources

- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions/edge-runtime)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
