# Production Deployment Checklist

**Release Manager**: Manus AI  
**Date**: February 04, 2026  
**Deployment Target**: Vercel Production Environment  
**Database**: Supabase (frlcvkmjuhnjcicwywrh)

---

## Pre-Deployment Checks

### Security ✅

- [ ] **RLS policies enabled on all tables**
  - Verify in Supabase Dashboard > Database > Tables
  - Check `RLS_VALIDATION.md` for policy details
  - Status: ****\_\_\_****

- [ ] **No service role keys in frontend code**
  - Run: `grep -r "service_role" src/app src/components`
  - Expected: No results
  - Status: ****\_\_\_****

- [ ] **All secrets stored in environment variables**
  - Verify in Vercel Dashboard > Settings > Environment Variables
  - Required: 9 variables (see list below)
  - Status: ****\_\_\_****

- [ ] **Admin routes protected by middleware**
  - Check `src/middleware.ts` for route protection
  - Test: Try accessing `/dashboard` without login
  - Status: ****\_\_\_****

- [ ] **RBAC implemented** ⚠️ REQUIRED FIX
  - Add role field to profiles table
  - Implement role checks in middleware
  - Status: ****\_\_\_****

- [ ] **Rate limiting enabled** ⚠️ REQUIRED FIX
  - Install `@upstash/ratelimit`
  - Protect `/login`, `/signup`, `/api/*`
  - Status: ****\_\_\_****

### Quality ✅

- [ ] **All tests passing**
  - Run: `npm test -- --run`
  - Expected: 48/48 tests passing
  - Status: ****\_\_\_****

- [ ] **Linting clean**
  - Run: `npm run lint`
  - Expected: No errors
  - Status: ****\_\_\_****

- [ ] **Build succeeds**
  - Run: `npm run build`
  - Expected: No errors
  - Status: ****\_\_\_****

- [ ] **TypeScript compilation clean**
  - Run: `npm run typecheck`
  - Expected: No errors
  - Status: ****\_\_\_****

### Data ✅

- [ ] **Database migrations applied**
  - Check Supabase Dashboard > Database > Migrations
  - Verify all migrations are applied
  - Status: ****\_\_\_****

- [ ] **No destructive schema changes without backups**
  - Verify PITR enabled in Supabase
  - Last backup timestamp: ****\_\_\_****
  - Status: ****\_\_\_****

- [ ] **Production environment verified**
  - Check Supabase project status: ACTIVE_HEALTHY
  - Verify database connection string
  - Status: ****\_\_\_****

### Infrastructure ✅

- [ ] **Rate limiting enabled** (see Security section)
  - Status: ****\_\_\_****

- [ ] **CORS configured**
  - Check `next.config.js` for CORS headers
  - Whitelist production domain only
  - Status: ****\_\_\_****

- [ ] **Environment variables configured correctly**
  - Verify all 9 required variables in Vercel
  - Mark sensitive variables as "Secret"
  - Status: ****\_\_\_****

---

## Required Environment Variables

| Variable                        | Required | Sensitive | Verified |
| ------------------------------- | -------- | --------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅       | No        | [ ]      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅       | No        | [ ]      |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅       | Yes       | [ ]      |
| `STRIPE_SECRET_KEY`             | ✅       | Yes       | [ ]      |
| `STRIPE_WEBHOOK_SECRET`         | ✅       | Yes       | [ ]      |
| `STRIPE_PRICE_PRO`              | ✅       | No        | [ ]      |
| `STRIPE_PRICE_ENTERPRISE`       | ✅       | No        | [ ]      |
| `OPENAI_API_KEY`                | ✅       | Yes       | [ ]      |
| `DATABASE_URL`                  | ✅       | Yes       | [ ]      |

---

## Blocking Issues

### Critical (Must Fix Before Deployment)

1. **RBAC Not Implemented**
   - Risk: All authenticated users have equal access
   - Fix: Add role checks in middleware and RLS policies
   - ETA: ****\_\_\_****
   - Status: [ ] Fixed [ ] In Progress [ ] Not Started

2. **Rate Limiting Not Implemented**
   - Risk: Brute force attacks on auth endpoints
   - Fix: Install and configure `@upstash/ratelimit`
   - ETA: ****\_\_\_****
   - Status: [ ] Fixed [ ] In Progress [ ] Not Started

3. **CORS Not Configured**
   - Risk: Unauthorized cross-origin requests
   - Fix: Add CORS headers in `next.config.js`
   - ETA: ****\_\_\_****
   - Status: [ ] Fixed [ ] In Progress [ ] Not Started

### Non-Blocking (Can Fix Post-Launch)

4. **Session Timeout Not Enforced**
   - Risk: Long-lived sessions
   - Fix: Configure JWT expiry in Supabase (1 hour recommended)
   - Priority: Medium
   - Status: [ ] Fixed [ ] In Progress [ ] Not Started

---

## Deployment Steps

### Step 1: Final Code Review

- [ ] Review all open PRs
- [ ] Merge approved PRs to `main`
- [ ] Tag release: `git tag -a v1.0.0 -m "Production launch"`
- [ ] Push tag: `git push origin v1.0.0`

### Step 2: Supabase Configuration

- [ ] Enable PITR (Point-in-Time Recovery)
  - **CRITICAL**: Follow `docs/DATABASE_PITR_GUIDE.md` for step-by-step instructions
  - Requires: Supabase Pro Plan ($25/month)
  - Configuration: 7-day retention (recommended for MVP)
  - Time estimate: 30 minutes
  - Verification: Check Dashboard → Database → Backups shows "PITR: Enabled"
- [ ] Enable Leaked Password Protection
- [ ] Review team access levels
- [ ] Verify RLS policies

### Step 3: Vercel Deployment

- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables (all 9)
- [ ] Mark sensitive variables as "Secret"
- [ ] Trigger deployment
- [ ] Wait for deployment to complete

### Step 4: Post-Deployment Verification

- [ ] Check deployment status in Vercel
- [ ] Test health check: `https://your-domain.com/api/health`
- [ ] Run smoke tests (see `SMOKE_TESTS.md`)
- [ ] Verify authentication flows
- [ ] Test protected routes
- [ ] Check RLS enforcement

### Step 5: Monitoring Setup

- [ ] Configure Vercel Analytics
- [ ] Set up Supabase Logs monitoring
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Set up error tracking (Sentry)
- [ ] Create alert rules

---

## Rollback Plan

### Immediate Rollback (< 5 minutes)

If critical issues are discovered:

1. **Vercel Rollback**
   - Go to Vercel Dashboard > Deployments
   - Find the previous stable deployment
   - Click "Promote to Production"
   - Verify rollback successful

2. **Database Rollback** (if needed)
   - Go to Supabase Dashboard > Database > Backups
   - Select recovery point before deployment
   - Click "Restore"
   - Wait for restoration to complete

### Hotfix Process (< 30 minutes)

For minor issues that don't require full rollback:

1. Create hotfix branch: `git checkout -b hotfix/issue-description`
2. Fix the issue
3. Run tests: `npm test -- --run`
4. Commit and push
5. Create PR with "HOTFIX" label
6. Fast-track review and merge
7. Vercel will auto-deploy

---

## Go/No-Go Decision

### Go Criteria (All Must Be Met)

- ✅ All security checks passed
- ✅ All quality checks passed
- ✅ All data checks passed
- ✅ All infrastructure checks passed
- ✅ No critical blocking issues
- ✅ Rollback plan documented and tested
- ✅ Team notified and ready

### No-Go Criteria (Any One Triggers)

- ❌ Any security check failed
- ❌ Tests failing
- ❌ Build errors
- ❌ Critical blocking issues unresolved
- ❌ Environment variables missing
- ❌ RLS policies not enabled

---

## Decision

**Deployment Status**: [ ] GO [ ] NO-GO

**Decision Maker**: ****\_\_\_****  
**Date**: ****\_\_\_****  
**Time**: ****\_\_\_****

**Reasoning**:

---

---

---

**Blocking Issues (if NO-GO)**:

1. ***
2. ***
3. ***

**Next Steps**:

---

---

---

---

## Post-Deployment Monitoring

### First 24 Hours

- [ ] Monitor error rates in Vercel
- [ ] Check Supabase logs for anomalies
- [ ] Review authentication success/failure rates
- [ ] Monitor API response times
- [ ] Check for any security alerts

### First Week

- [ ] Review user feedback
- [ ] Analyze performance metrics
- [ ] Check for any security incidents
- [ ] Review RLS policy effectiveness
- [ ] Update documentation based on learnings

### First Month

- [ ] Conduct security review
- [ ] Analyze usage patterns
- [ ] Optimize performance bottlenecks
- [ ] Review and update monitoring alerts
- [ ] Plan next release

---

## Emergency Contacts

| Role             | Name         | Contact      |
| ---------------- | ------------ | ------------ |
| Release Manager  | ****\_\_**** | ****\_\_**** |
| Security Lead    | ****\_\_**** | ****\_\_**** |
| DevOps Lead      | ****\_\_**** | ****\_\_**** |
| Database Admin   | ****\_\_**** | ****\_\_**** |
| On-Call Engineer | ****\_\_**** | ****\_\_**** |

---

## Sign-Off

**Release Manager**: ****\_\_\_**** Signature: ****\_\_\_**** Date: ****\_\_\_****

**Security Lead**: ****\_\_\_**** Signature: ****\_\_\_**** Date: ****\_\_\_****

**Technical Lead**: ****\_\_\_**** Signature: ****\_\_\_**** Date: ****\_\_\_****

---

**Deployment Approved**: [ ] YES [ ] NO

**Deployment Date**: ****\_\_\_****  
**Deployment Time**: ****\_\_\_****  
**Expected Duration**: ****\_\_\_****
