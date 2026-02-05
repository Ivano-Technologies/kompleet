# Row Level Security (RLS) Deployment Guide

## Overview

This guide explains how to deploy the Row Level Security (RLS) policies to fix the critical security vulnerabilities identified in Supabase Security Advisor.

## Critical Issues Fixed

1. **RLS Disabled on Public Tables** - Enabled RLS on:
   - `public.rule_versions`
   - `public.tax_rules`
   - `public.sources`
   - `public.audit_logs`
   - `public.review_queue`

2. **Missing Indexes** - Added performance indexes on:
   - `audit_logs(user_id)`
   - `audit_logs(created_at)`
   - `rule_versions(rule_id)`
   - `tax_rules(category)`

## Deployment Options

### Option 1: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20260205_enable_rls_security.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the migration
6. Verify in **Security Advisor** that errors are resolved

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref frlcvkmjuhnjcicwywrh

# Run the migration
supabase db push

# Verify the migration
supabase db diff
```

### Option 3: Direct SQL Connection

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.frlcvkmjuhnjcicwywrh.supabase.co:5432/postgres"

# Run the migration file
\i supabase/migrations/20260205_enable_rls_security.sql
```

## Security Policies Implemented

### Rule Versions & Tax Rules
- ✅ Authenticated users can **read** all rules (needed for calculations)
- ✅ Service role can **manage** rules (admin operations)

### Sources
- ✅ Authenticated users can **read** all sources (needed for calculations)
- ✅ Service role can **manage** sources (admin operations)

### Audit Logs
- ✅ Users can **read** only their own audit logs (privacy)
- ✅ Users can **insert** their own audit logs (calculations)
- ✅ Service role can **manage** all logs (admin operations)

### Review Queue
- ✅ Authenticated users can **read** all review items
- ✅ Authenticated users can **insert** review items
- ✅ Service role can **manage** review queue (admin operations)

### Profiles (if exists)
- ✅ Users can **read** their own profile
- ✅ Users can **update** their own profile
- ✅ Service role can **manage** all profiles (admin operations)

## Verification Steps

After deployment, verify the security fixes:

1. **Check Security Advisor**
   - Go to **Advisors** → **Security Advisor**
   - Verify "RLS Disabled in Public" errors are gone
   - Should show **0 errors** instead of 6

2. **Test Authentication**
   - Login to the app
   - Verify you can access your own calculations
   - Verify you cannot access other users' data

3. **Check Performance**
   - Go to **Advisors** → **Performance Advisor**
   - Verify "Unindexed foreign keys" warnings are reduced

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Disable RLS (NOT RECOMMENDED - SECURITY RISK)
ALTER TABLE public.rule_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Allow authenticated users to read rule versions" ON public.rule_versions;
DROP POLICY IF EXISTS "Allow service role to manage rule versions" ON public.rule_versions;
-- ... (drop all other policies)
```

## Next Steps

After deploying RLS:

1. ✅ Monitor Security Advisor for remaining warnings
2. ✅ Test all calculator functionality
3. ✅ Verify user authentication and authorization
4. ✅ Proceed with Forgot Password feature implementation

## Support

If you encounter any issues:
- Check Supabase logs in Dashboard → Logs
- Review the SQL error messages
- Verify your service role key is set correctly in environment variables
