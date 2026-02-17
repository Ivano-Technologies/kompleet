-- RLS Policy Verification Script
-- This script verifies that all sensitive tables have RLS policies enabled
-- Run this against your Supabase database to verify RLS configuration

-- ============================================================================
-- VERIFY RLS IS ENABLED ON ALL SENSITIVE TABLES
-- ============================================================================

-- Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'transactions',
    'invoices',
    'tax_reports',
    'audit_logs',
    'vat_transactions',
    'vat_calculations',
    'vat_summaries',
    'vat_forms',
    'vat_compliance',
    'vat_audit_log',
    'records',
    'categories',
    'notifications',
    'settings',
    'users'
  )
ORDER BY tablename;

-- ============================================================================
-- VERIFY RLS POLICIES EXIST
-- ============================================================================

-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as policy_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'transactions',
    'invoices',
    'tax_reports',
    'audit_logs',
    'vat_transactions',
    'vat_calculations',
    'vat_summaries',
    'vat_forms',
    'vat_compliance',
    'vat_audit_log',
    'records',
    'categories',
    'notifications',
    'settings'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- VERIFY USER ISOLATION POLICIES
-- ============================================================================

-- Check transactions table RLS
SELECT
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'transactions'
  AND schemaname = 'public';

-- Check invoices table RLS
SELECT
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'invoices'
  AND schemaname = 'public';

-- Check tax_reports table RLS
SELECT
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'tax_reports'
  AND schemaname = 'public';

-- Check audit_logs table RLS
SELECT
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'audit_logs'
  AND schemaname = 'public';

-- Check vat_transactions table RLS
SELECT
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'vat_transactions'
  AND schemaname = 'public';

-- Check vat_summaries table RLS
SELECT
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'vat_summaries'
  AND schemaname = 'public';

-- Check records table RLS
SELECT
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'records'
  AND schemaname = 'public';

-- ============================================================================
-- VERIFY SYSTEM CATEGORIES ARE ACCESSIBLE
-- ============================================================================

-- Check categories table RLS (should allow system categories)
SELECT
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'categories'
  AND schemaname = 'public';

-- ============================================================================
-- IDENTIFY MISSING RLS POLICIES
-- ============================================================================

-- List tables that should have RLS but don't
SELECT
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'transactions',
    'invoices',
    'tax_reports',
    'audit_logs',
    'vat_transactions',
    'vat_calculations',
    'vat_summaries',
    'vat_forms',
    'vat_compliance',
    'vat_audit_log',
    'records',
    'categories',
    'notifications',
    'settings'
  )
  AND rowsecurity = false
ORDER BY tablename;

-- ============================================================================
-- VERIFY AUTH.UID() FUNCTION EXISTS
-- ============================================================================

-- Check if auth.uid() function exists
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name = 'uid';

-- ============================================================================
-- TEST RLS POLICIES (Requires authenticated session)
-- ============================================================================

-- These queries should only return the current user's data
-- Run as different users to verify isolation

-- Test 1: Current user's transactions
-- SELECT * FROM transactions WHERE user_id = auth.uid();

-- Test 2: Current user's invoices
-- SELECT * FROM invoices WHERE user_id = auth.uid();

-- Test 3: Current user's tax reports
-- SELECT * FROM tax_reports WHERE user_id = auth.uid();

-- Test 4: Current user's audit logs
-- SELECT * FROM audit_logs WHERE user_id = auth.uid();

-- Test 5: Current user's VAT transactions
-- SELECT * FROM vat_transactions WHERE user_id = auth.uid();

-- Test 6: Current user's VAT summaries
-- SELECT * FROM vat_summaries WHERE user_id = auth.uid();

-- Test 7: Current user's records
-- SELECT * FROM records WHERE user_id = auth.uid();

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

-- Generate RLS policy summary
SELECT
  'RLS Verification Report' as report_type,
  COUNT(*) as total_sensitive_tables,
  SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as tables_with_rls_enabled,
  SUM(CASE WHEN NOT rowsecurity THEN 1 ELSE 0 END) as tables_missing_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'transactions',
    'invoices',
    'tax_reports',
    'audit_logs',
    'vat_transactions',
    'vat_calculations',
    'vat_summaries',
    'vat_forms',
    'vat_compliance',
    'vat_audit_log',
    'records',
    'categories',
    'notifications',
    'settings'
  );
