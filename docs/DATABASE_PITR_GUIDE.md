# Supabase Point-in-Time Recovery (PITR) Setup Guide

## Overview

Point-in-Time Recovery (PITR) allows you to restore your Supabase PostgreSQL database to any specific point in time within a retention window. This is critical for production deployments to protect against:

- Accidental data deletion or corruption
- Failed migrations or schema changes
- Application bugs that modify data incorrectly
- Security incidents requiring rollback

**Status**: ⚠️ **REQUIRED FOR MVP LAUNCH**

---

## Prerequisites

### Supabase Plan Requirements

PITR is available on:

- ✅ **Pro Plan** ($25/month) - 7 days retention
- ✅ **Team Plan** ($599/month) - 14 days retention
- ✅ **Enterprise Plan** (custom) - 30+ days retention

❌ PITR is **NOT available** on the Free tier.

### Current Project

- **Project ID**: `frlcvkmjuhnjcicwywrh`
- **Recommended Plan**: Pro Plan (7 days retention)
- **Estimated Cost**: $25/month base + compute usage

---

## Step-by-Step Setup Instructions

### Step 1: Verify Supabase Plan

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `frlcvkmjuhnjcicwywrh`
3. Click **Settings** (⚙️ icon in left sidebar)
4. Click **Billing** → **Plan & Add-ons**
5. Verify you are on **Pro Plan** or higher
   - If on Free tier, click **Upgrade to Pro**
   - Complete payment setup

### Step 2: Enable PITR

1. In Supabase Dashboard, navigate to:

   ```
   Project → Database → Backups
   ```

2. Look for the **Point-in-Time Recovery** section

3. Click **Enable PITR**

4. Configure retention settings:
   - **Retention Period**:
     - MVP/Staging: **7 days** (included with Pro plan)
     - Production: **14-30 days** (requires Team/Enterprise)
   - **Backup Frequency**: Continuous (automatic)

5. Click **Confirm** to enable

6. Wait 2-5 minutes for PITR to initialize

### Step 3: Verify PITR is Active

1. Return to **Database → Backups**

2. You should see:
   - ✅ **PITR Status**: `Enabled`
   - ✅ **Recovery Window**: `Last 7 days` (or your configured retention)
   - ✅ **Earliest Recovery Point**: Timestamp of when PITR was enabled

3. Bookmark this page for emergency recovery access

---

## How to Perform a Point-in-Time Recovery

### When to Use PITR

Use PITR when you need to restore the database to a previous state due to:

- Accidental `DELETE` or `UPDATE` without `WHERE` clause
- Failed migration that corrupted data
- Application bug that modified data incorrectly
- Security incident requiring rollback to before attack

### Recovery Process

⚠️ **WARNING**: Database recovery will:

- Replace ALL current database data with data from the recovery point
- Cannot be undone (unless you have another backup)
- Requires downtime (5-30 minutes depending on database size)

#### Step 1: Identify Recovery Point

1. Determine the exact timestamp you want to recover to
   - Example: `2026-02-10 14:35:00 UTC` (before the bad migration)

2. Verify this timestamp is within your retention window

#### Step 2: Perform Recovery

1. Go to Supabase Dashboard → **Database → Backups**

2. In the **Point-in-Time Recovery** section:
   - Click **Restore to Point in Time**

3. Enter the recovery timestamp:

   ```
   Date: YYYY-MM-DD
   Time: HH:MM:SS (UTC)
   ```

4. Click **Preview** to see what will be restored

5. **CRITICAL**: Read and understand the warning message

6. Click **Restore Database**

7. Wait for the restoration process to complete (5-30 minutes)

#### Step 3: Verify Recovery

1. Check the database status in the dashboard

2. Run verification queries to confirm data is correct:

   ```sql
   -- Check row counts
   SELECT 'users' as table_name, count(*) FROM users
   UNION ALL
   SELECT 'transactions', count(*) FROM transactions
   UNION ALL
   SELECT 'tax_rules', count(*) FROM tax_rules;

   -- Check latest record timestamps
   SELECT max(created_at) as latest_user FROM users;
   SELECT max(created_at) as latest_transaction FROM transactions;
   ```

3. Test the application to ensure functionality is restored

4. Review logs for any issues

---

## Best Practices

### Before Risky Operations

Before performing any risky database operations (migrations, bulk updates, schema changes):

1. **Record the current timestamp**:

   ```sql
   SELECT NOW() AT TIME ZONE 'UTC' as recovery_point;
   ```

   Example output: `2026-02-10 15:23:45.123456+00`

2. **Save this timestamp** in your deployment notes

3. **Perform the operation**

4. If something goes wrong, you can restore to the saved timestamp

### Regular Testing

- **Monthly**: Test PITR recovery on a staging/clone database
- **Quarterly**: Full disaster recovery drill

### Monitoring

- **Weekly**: Check PITR status in Supabase dashboard
- **After critical operations**: Verify backups are still active

### Documentation

- Document all PITR recovery events in `docs/INCIDENT_LOG.md`
- Include: timestamp, reason, who performed it, outcome

---

## Cost Implications

### Supabase Pro Plan PITR Costs

| Component               | Cost            |
| ----------------------- | --------------- |
| Pro Plan Base           | $25/month       |
| PITR (7 days retention) | Included ✅     |
| Database Storage        | $0.125/GB/month |
| Database Egress         | $0.09/GB        |

**Estimated Monthly Cost for MVP**:

- Pro Plan: $25
- Database (5GB): $0.63
- PITR: $0 (included)
- **Total**: ~$26/month

### Extended Retention Costs

For longer retention periods:

- **14 days**: Team Plan - $599/month
- **30+ days**: Enterprise Plan - Custom pricing

**Recommendation**: Start with 7 days (Pro Plan) for MVP. Upgrade to 14-30 days after validating product-market fit.

---

## Rollback Plan Integration

PITR is integrated into the production deployment checklist:

### Pre-Deployment

1. Verify PITR is enabled
2. Record current timestamp as recovery point
3. Proceed with deployment

### Post-Deployment Issues

If deployment causes data issues:

1. **Immediate** (< 5 min): Roll back application code via Vercel
2. **Database Recovery** (if needed):
   - Use PITR to restore to pre-deployment timestamp
   - Follow recovery process above

See [PRODUCTION_DEPLOYMENT_CHECKLIST.md](../PRODUCTION_DEPLOYMENT_CHECKLIST.md#rollback-plan) for full rollback procedure.

---

## Troubleshooting

### PITR Not Available

**Issue**: "Enable PITR" button is grayed out

**Solutions**:

1. Verify you're on Pro Plan or higher
2. Check if project is paused (resume it)
3. Contact Supabase support if issue persists

### PITR Failed to Enable

**Issue**: Error message when enabling PITR

**Solutions**:

1. Wait 5 minutes and try again
2. Check project status (must be ACTIVE_HEALTHY)
3. Contact Supabase support with project ID

### Recovery Failed

**Issue**: Recovery process failed or timed out

**Solutions**:

1. Check Supabase status page for incidents
2. Try a different recovery timestamp
3. Contact Supabase support immediately

---

## Verification Checklist

After completing this guide, verify:

- [ ] Supabase plan is Pro or higher
- [ ] PITR is enabled in Database → Backups
- [ ] Recovery window shows last 7+ days
- [ ] Team knows how to perform recovery
- [ ] Recovery timestamp recorded before deployments
- [ ] PITR status checked weekly
- [ ] Documentation updated in deployment checklist

---

## Next Steps

1. ✅ Enable PITR in Supabase Dashboard (30 minutes)
2. ✅ Update PRODUCTION_DEPLOYMENT_CHECKLIST.md with PITR timestamp
3. ✅ Test PITR recovery on a staging clone (optional but recommended)
4. ✅ Document recovery procedure in team runbook
5. ✅ Add PITR status check to weekly ops checklist

---

## Resources

- [Supabase PITR Documentation](https://supabase.com/docs/guides/platform/backups)
- [Supabase Pricing](https://supabase.com/pricing)
- [PostgreSQL PITR Concepts](https://www.postgresql.org/docs/current/continuous-archiving.html)

---

**Last Updated**: February 11, 2026
**Owner**: DevOps / Database Team
**Review Frequency**: Quarterly
