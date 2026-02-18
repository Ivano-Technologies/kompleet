# KOMPLEET Rollback Playbook

**Version:** 1.0  
**Last Updated:** February 17, 2026  
**Status:** Active

---

## Table of Contents

1. [Overview](#overview)
2. [Rollback Principles](#rollback-principles)
3. [Incident Triggers](#incident-triggers)
4. [Quick Rollback Guide](#quick-rollback-guide)
5. [Detailed Rollback Procedures](#detailed-rollback-procedures)
6. [Verification Checklist](#verification-checklist)
7. [Post-Rollback Actions](#post-rollback-actions)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The KOMPLEET rollback system enables fast, safe restoration of the platform to a previous stable state. All rollbacks are:

- **Fast:** < 5 minutes to restore previous state
- **Safe:** Non-destructive and fully reversible
- **Auditable:** All actions logged for compliance
- **Automated:** One-command execution with human gates

### Rollback Components

| Component | Mechanism | Trigger Time |
|-----------|-----------|--------------|
| **Code** | Git version control + Vercel deployment | 2-3 minutes |
| **Database** | Migration-based reversible changes | 1-2 minutes |
| **Configuration** | Environment variable snapshots | < 1 minute |

---

## Rollback Principles

### 1. Fast Restoration

**Target:** < 5 minutes from incident detection to previous stable state

**How:** Pre-generated rollback scripts, automated deployment, immutable snapshots

### 2. Non-Destructive

**Principle:** Rollback must never delete data or corrupt state

**Implementation:** 
- Database rollbacks use migration down scripts
- Code rollbacks revert to previous commits
- Config rollbacks restore from snapshots

### 3. Reversible

**Principle:** Rollback itself must be reversible

**Implementation:**
- All changes are logged
- Rollback can be undone by rolling forward
- Data is preserved throughout process

### 4. Auditable

**Principle:** Every rollback action is logged for compliance

**Implementation:**
- GitHub Actions logs all steps
- Incident reports generated automatically
- Post-incident reviews scheduled

### 5. No Manual SQL

**Principle:** Production rollbacks never require manual SQL editing

**Implementation:**
- All migrations have pre-generated down scripts
- Rollback scripts are version-controlled
- SQL is reviewed before release

---

## Incident Triggers

Rollback should be triggered for:

| Incident Type | Severity | Action |
|---------------|----------|--------|
| **Production Outage** | CRITICAL | Rollback immediately |
| **Auth Failure** | CRITICAL | Rollback immediately |
| **Data Leakage Risk** | CRITICAL | Rollback immediately |
| **Compliance Breach** | CRITICAL | Rollback immediately |
| **Critical Bug** | HIGH | Rollback after 30-min investigation |
| **Performance Regression** | HIGH | Rollback after 1-hour investigation |
| **Minor Bug** | MEDIUM | Fix forward instead of rollback |

---

## Quick Rollback Guide

### Staging Rollback (No Approval Required)

```bash
# 1. Trigger rollback workflow
gh workflow run rollback.yml \
  -f environment=staging \
  -f target_release=release-2026-02-17

# 2. Monitor workflow in GitHub Actions
# Expected time: 3-5 minutes

# 3. Verify application
curl https://staging.kompleet-platform.vercel.app/api/health
```

### Production Rollback (Requires Approval)

```bash
# 1. Document incident reason
REASON="Auth endpoint returning 500 errors"

# 2. Trigger rollback workflow
gh workflow run rollback.yml \
  -f environment=production \
  -f target_release=release-2026-02-17 \
  -f reason="$REASON"

# 3. Monitor workflow in GitHub Actions
# Expected time: 5-10 minutes (includes verification)

# 4. Verify application
curl https://techivano.com/api/health

# 5. Notify stakeholders
# Post-incident review scheduled automatically
```

### Automatic Rollback to Last-Known-Good

```bash
# If no specific release is specified, uses last-known-good tag
gh workflow run rollback.yml \
  -f environment=production \
  -f reason="Critical incident - rolling back to last-known-good"

# This automatically finds and uses the last-known-good release tag
```

---

## Detailed Rollback Procedures

### Code Rollback Procedure

**Time Required:** 2-3 minutes  
**Risk Level:** LOW  
**Reversibility:** FULL

#### Step 1: Identify Target Release

```bash
# List recent releases
git tag -l 'release-*' --sort=-version:refname | head -10

# Get details of specific release
git show release-2026-02-17

# View changes in release
git log release-2026-02-16..release-2026-02-17
```

#### Step 2: Trigger Code Rollback

```bash
# Via GitHub Actions (recommended)
gh workflow run rollback.yml \
  -f environment=production \
  -f target_release=release-2026-02-17 \
  -f reason="Critical bug in VAT calculation"

# Monitor progress
gh run list --workflow=rollback.yml --limit=1
```

#### Step 3: Verify Deployment

```bash
# Check deployment status
curl -I https://techivano.com

# Verify version
curl https://techivano.com/api/health | jq '.version'

# Expected: Should match target release version
```

### Database Rollback Procedure

**Time Required:** 1-2 minutes  
**Risk Level:** MEDIUM  
**Reversibility:** FULL (with backup)

#### Step 1: Identify Target Migration Version

```bash
# List migration history
ls -la src/supabase/migrations/ | grep -E '^\d{4}-\d{2}-\d{2}'

# Get current migration version
# (Stored in Supabase schema_migrations table)
```

#### Step 2: Create Backup

```bash
# Supabase automatically creates backups
# Verify backup exists in Supabase dashboard:
# Settings → Backups → View backups

# Manual backup (optional)
supabase db pull --db-url "$SUPABASE_URL"
```

#### Step 3: Execute Rollback

```bash
# Dry run (preview changes)
./scripts/db-rollback.sh \
  --environment production \
  --target-version 2026-02-16 \
  --dry-run

# Execute rollback
./scripts/db-rollback.sh \
  --environment production \
  --target-version 2026-02-16 \
  --confirm
```

#### Step 4: Verify Database State

```bash
# Check migration history
supabase migration list

# Verify data integrity
# Run smoke tests against database
npm run test:smoke

# Check row counts
psql "$SUPABASE_URL" -c "SELECT COUNT(*) FROM transactions;"
```

### Configuration Rollback Procedure

**Time Required:** < 1 minute  
**Risk Level:** LOW  
**Reversibility:** FULL

#### Step 1: List Available Snapshots

```bash
# View environment snapshots
ls -la .env-snapshots/

# Show snapshot details
cat .env-snapshots/production-release-2026-02-17.json
```

#### Step 2: Restore Snapshot

```bash
# Restore environment variables
./scripts/env-snapshot.sh \
  --environment production \
  --release release-2026-02-17 \
  --restore

# Verify restoration
env | grep -E "^(NEXT_|REACT_|VITE_)" | head -10
```

#### Step 3: Redeploy Application

```bash
# Redeploy to pick up new environment variables
gh workflow run rollback.yml \
  -f environment=production \
  -f target_release=release-2026-02-17
```

---

## Verification Checklist

After rollback, verify all critical systems:

### Health Checks (< 2 minutes)

- [ ] Health endpoint responds: `curl /api/health`
- [ ] No 5xx errors in logs
- [ ] Application loads in browser
- [ ] Database is accessible

### Authentication (< 5 minutes)

- [ ] Login works with test account
- [ ] Session persists across requests
- [ ] Logout works correctly
- [ ] Password reset flow works

### Core Features (< 10 minutes)

- [ ] Dashboard loads without errors
- [ ] Transactions can be viewed
- [ ] Tax calculations work
- [ ] Exports generate successfully
- [ ] API endpoints respond correctly

### Data Integrity (< 15 minutes)

- [ ] Row counts match expected values
- [ ] No orphaned records
- [ ] Referential integrity intact
- [ ] No data corruption detected

### Performance (< 5 minutes)

- [ ] Page load times acceptable (< 3s)
- [ ] API response times normal (< 500ms)
- [ ] No memory leaks
- [ ] CPU usage normal

### Monitoring (Continuous)

- [ ] Error rate back to baseline
- [ ] No spike in 5xx errors
- [ ] User activity resuming
- [ ] No alerts firing

---

## Post-Rollback Actions

### Immediate (< 30 minutes)

1. **Notify Stakeholders**
   ```bash
   # Automated notification sent via GitHub Actions
   # Manual notification to:
   # - Engineering team
   # - Product team
   # - Customer success team
   ```

2. **Create Incident Report**
   ```bash
   # Automatically generated by GitHub Actions
   # Location: GitHub Actions logs
   # Contents: Rollback details, timing, verification results
   ```

3. **Stabilize System**
   - Monitor error rates
   - Watch for secondary issues
   - Be ready for immediate re-rollback if needed

### Short-term (1-4 hours)

1. **Investigate Root Cause**
   - Review changes in rolled-back release
   - Identify specific problematic commit
   - Document findings

2. **Prepare Fix**
   - Create fix on feature branch
   - Test thoroughly in staging
   - Prepare for re-release

3. **Schedule Post-Incident Review**
   - Within 24 hours of incident
   - Include all relevant teams
   - Document preventive measures

### Long-term (1-7 days)

1. **Post-Incident Review**
   - What happened?
   - Why did it happen?
   - What will prevent it next time?
   - Action items assigned

2. **Implement Preventive Measures**
   - Improve testing
   - Add monitoring/alerts
   - Update processes
   - Document learnings

3. **Release Fix**
   - Deploy fixed version
   - Monitor closely
   - Verify no regression

---

## Troubleshooting

### Rollback Fails to Complete

**Symptom:** Rollback workflow times out or fails

**Diagnosis:**
```bash
# Check workflow logs
gh run view <run-id> --log

# Check deployment status
vercel deployments list

# Check database status
supabase status
```

**Recovery:**
1. Check what failed (code, DB, or config)
2. Manually complete the failed component
3. Re-run verification checklist
4. Document what failed and why

### Application Still Broken After Rollback

**Symptom:** Errors persist after rollback completes

**Diagnosis:**
```bash
# Check if rollback actually completed
git log --oneline | head -5

# Verify database state
supabase migration list

# Check environment variables
env | grep NEXT_
```

**Recovery:**
1. Check if rollback was actually deployed
2. Verify all three components (code, DB, config) were rolled back
3. Check for cached data/CDN issues
4. Clear caches and restart application
5. If still broken, escalate to engineering team

### Rollback Script Fails

**Symptom:** `./scripts/db-rollback.sh` fails with error

**Diagnosis:**
```bash
# Check script syntax
bash -n ./scripts/db-rollback.sh

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check migration files exist
ls -la src/supabase/migrations/
```

**Recovery:**
1. Verify all environment variables are set
2. Verify migration files exist
3. Verify rollback scripts exist for each migration
4. Run with `--dry-run` first to see what would happen
5. If still failing, use manual Supabase dashboard rollback

### Cannot Determine Target Release

**Symptom:** "No release tags found" error

**Diagnosis:**
```bash
# Check for release tags
git tag -l 'release-*'

# Check for last-known-good tag
git tag -l 'last-known-good'
```

**Recovery:**
1. If no tags exist, create one: `git tag release-$(date +%Y-%m-%d)`
2. If last-known-good missing, create it: `git tag last-known-good`
3. Push tags: `git push origin --tags`
4. Re-run rollback workflow

---

## Emergency Contacts

**On-Call Engineer:** [Contact info]  
**Engineering Lead:** [Contact info]  
**Product Manager:** [Contact info]  
**Customer Success:** [Contact info]

---

## Testing Rollback

### Monthly Rollback Drill

Run monthly to ensure rollback procedures work:

```bash
# 1. Create test release
git tag release-test-$(date +%Y-%m-%d)
git push origin release-test-$(date +%Y-%m-%d)

# 2. Deploy test release to staging
gh workflow run release.yml \
  -f environment=staging \
  -f description="Test release for rollback drill"

# 3. Wait for deployment
sleep 300

# 4. Execute rollback
gh workflow run rollback.yml \
  -f environment=staging \
  -f target_release=release-test-$(date +%Y-%m-%d)

# 5. Verify rollback success
# Check all verification checklist items

# 6. Document results
# Record timing, any issues, lessons learned
```

---

## Related Documentation

- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) - Incident response procedures
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [MONITORING.md](./MONITORING.md) - Monitoring and alerting
- [SECURITY.md](./SECURITY.md) - Security procedures

