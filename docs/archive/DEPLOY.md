# 🚀 Quick Deployment Guide

**Status**: Production Ready ✅
**Time to Deploy**: ~30 minutes
**Date**: February 11, 2026

---

## ⚡ Fast Track (30 Minutes)

### Step 1: Verify (5 min)

```bash
# Navigate to project
cd c:\Users\Windows\OneDrive\Documents\Antigravity\Projects\kompleet-platform

# Run automated checks
bash scripts/pre-deploy-check.sh

# Expected: "✓ All checks passed! Ready for deployment."
```

### Step 2: Prepare Supabase (5 min)

```bash
# 1. Login to Supabase Dashboard
https://supabase.com/dashboard

# 2. Select your project: frlcvkmjuhnjcicwywrh

# 3. Enable PITR:
Settings → Database → Point in Time Recovery → Enable (7-day retention)

# 4. Copy credentials (needed for Vercel):
Settings → API → Copy these values:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
```

### Step 3: Deploy to Vercel (15 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables (paste from Supabase)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://frlcvkmjuhnjcicwywrh.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: your-anon-key

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: your-service-role-key

# Optional: Add OpenAI key (if using AI features)
vercel env add OPENAI_API_KEY production
# Paste: sk-...

# Deploy to production
vercel --prod
```

### Step 4: Verify Deployment (5 min)

```bash
# Get your deployment URL from Vercel output
# Example: https://kompleet-platform.vercel.app

# Test health check
curl https://YOUR-DOMAIN.vercel.app/api/health

# Expected: {"status":"ok","timestamp":"2026-02-11T..."}
```

**Manual Testing:**

1. Open https://YOUR-DOMAIN.vercel.app
2. Sign up new account
3. Navigate to `/calculators`
4. Use Business Tax calculator
5. Save calculation
6. View in history
7. Export PDF

✅ **If all steps pass → YOU'RE LIVE!**

---

## 📋 Environment Variables Checklist

Copy these from Supabase → Settings → API:

```bash
# Required (from Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://frlcvkmjuhnjcicwywrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (copy from Supabase)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (copy from Supabase)

# Optional (AI features)
OPENAI_API_KEY=sk-... (if using AI categorization)

# Optional (Analytics)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-... (if using Google Analytics)
SENTRY_DSN=https://... (if using Sentry)
```

**Where to set them:**

- **Vercel CLI**: `vercel env add KEY_NAME production`
- **Vercel Dashboard**: Settings → Environment Variables

---

## 🔄 Rollback (If Needed)

### Vercel Rollback (< 2 min)

**Option 1: Dashboard**

1. Vercel → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

**Option 2: CLI**

```bash
vercel rollback
```

### Database Rollback (5-15 min)

**Only if schema changed:**

1. Supabase → Database → Backups
2. Select restore point (within 7 days)
3. Click "Restore to Point in Time"

---

## 📊 Post-Deployment Monitoring

### Vercel Dashboard

```
https://vercel.com/dashboard
```

**Check:**

- ✅ Deployment status: "Ready"
- ✅ Function logs: No errors
- ✅ Analytics: Page views tracking

### Supabase Dashboard

```
https://supabase.com/dashboard/project/frlcvkmjuhnjcicwywrh
```

**Check:**

- ✅ Database logs: No connection errors
- ✅ Auth logs: User signups working
- ✅ CPU usage: < 60%

### Success Metrics (First 24 Hours)

| Metric       | Target  | Where to Check                               |
| ------------ | ------- | -------------------------------------------- |
| Uptime       | > 99.5% | Vercel Analytics                             |
| Error Rate   | < 1%    | Vercel Function Logs                         |
| API Response | < 500ms | Vercel Analytics → Web Vitals                |
| User Signups | 5+      | Supabase → Table Editor → `users`            |
| Calculations | 10+     | Supabase → Table Editor → `tax_calculations` |

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Check build locally first
pnpm build

# If fails, check:
1. TypeScript errors: pnpm typecheck
2. ESLint errors: pnpm lint
3. Missing dependencies: pnpm install
```

### 500 Errors After Deployment

**Check Vercel Function Logs:**

1. Vercel Dashboard → Deployments → Latest → Functions
2. Look for error stack traces

**Common causes:**

- Missing environment variables
- Database connection failed (check Supabase credentials)
- Service role key not set

### Database Connection Failed

**Verify credentials in Vercel:**

```bash
vercel env ls
```

**Expected variables:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**If missing, add them:**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

### Authentication Not Working

**Check:**

1. Supabase → Authentication → Settings
2. Site URL: Should match your Vercel domain
3. Redirect URLs: Add `https://YOUR-DOMAIN.vercel.app/**`

**Update redirect URLs:**

```
https://YOUR-DOMAIN.vercel.app/auth/callback
https://YOUR-DOMAIN.vercel.app/**
```

---

## 📞 Get Help

### Documentation

- **Full Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md` (comprehensive)
- **PITR Setup**: `docs/DATABASE_PITR_GUIDE.md`
- **API Docs**: `docs/API_CALCULATIONS.md`
- **Test Status**: `docs/TEST_STATUS.md`
- **MVP Status**: `MVP_COMPLETION_STATUS.md`

### External Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

---

## ✅ Pre-Launch Checklist

**Before Going Live:**

- [ ] Run `./scripts/pre-deploy-check.sh` → All checks pass
- [ ] Environment variables set in Vercel
- [ ] PITR enabled in Supabase (7-day retention)
- [ ] Deployed to Vercel production
- [ ] Health check returns 200 OK
- [ ] Manual test: Signup → Calculator → Save → Export
- [ ] Vercel Analytics enabled
- [ ] Custom domain configured (optional)
- [ ] Error monitoring set up (Sentry recommended)
- [ ] Team notified of deployment

**Week 1 Monitoring:**

- [ ] Day 1: Monitor error rates hourly (target: < 1%)
- [ ] Day 2: Check database CPU (target: < 60%)
- [ ] Day 3: Review user signups (target: 5+)
- [ ] Day 7: Analyze performance metrics
- [ ] Day 7: Collect user feedback

---

## 🎉 Success!

Once deployed and verified:

✅ **KOMPLEET MVP is live!**
✅ Users can sign up and use tax calculators
✅ Calculations are saved to accounts
✅ PDF exports working
✅ All security features active (RBAC, RLS, Rate Limiting)

**Next Steps:**

1. Monitor performance for 48 hours
2. Collect user feedback
3. Plan Phase 2 features (see `docs/PHASE_3_ROADMAP.md`)

---

**Last Updated**: February 11, 2026
**Estimated Deploy Time**: 30 minutes
**Confidence**: 95% ready
