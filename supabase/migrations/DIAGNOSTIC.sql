-- KOMPLEET Database Diagnostic Script
-- Run this in Supabase SQL Editor to see current state

-- ============================================================================
-- PART 1: Check what tables exist
-- ============================================================================
SELECT 
  'EXISTING TABLES' as check_type,
  tablename as name,
  schemaname as schema
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- PART 2: Check what RLS policies exist
-- ============================================================================
SELECT 
  'EXISTING POLICIES' as check_type,
  schemaname as schema,
  tablename as table_name,
  policyname as policy_name,
  permissive as permissive,
  roles as roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- PART 3: Check if helper function exists
-- ============================================================================
SELECT 
  'EXISTING FUNCTIONS' as check_type,
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'get_current_user_id'
  AND pronamespace = 'public'::regnamespace;

-- ============================================================================
-- PART 4: Check table structure for key tables
-- ============================================================================
SELECT 
  'USERS TABLE STRUCTURE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

SELECT 
  'TRANSACTIONS TABLE STRUCTURE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'transactions'
ORDER BY ordinal_position;

SELECT 
  'BANK_ACCOUNTS TABLE STRUCTURE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bank_accounts'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 5: Test creating a simple policy to see exact error
-- ============================================================================
-- First, ensure RLS is enabled
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop test policy if it exists
DROP POLICY IF EXISTS test_policy ON public.transactions;

-- Try creating a simple test policy (this should show the exact error)
DO $$
BEGIN
  -- Test 1: Unqualified column name
  BEGIN
    CREATE POLICY test_policy ON public.transactions 
      FOR ALL 
      USING (
        EXISTS (
          SELECT 1 
          FROM public.bank_accounts 
          WHERE public.bank_accounts.id = bank_account_id
        )
      );
    RAISE NOTICE 'SUCCESS: Unqualified column name works!';
    DROP POLICY test_policy ON public.transactions;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: Unqualified column name - Error: %', SQLERRM;
  END;

  -- Test 2: Fully qualified column name
  BEGIN
    CREATE POLICY test_policy ON public.transactions 
      FOR ALL 
      USING (
        EXISTS (
          SELECT 1 
          FROM public.bank_accounts 
          WHERE public.bank_accounts.id = public.transactions.bank_account_id
        )
      );
    RAISE NOTICE 'SUCCESS: Fully qualified column name works!';
    DROP POLICY test_policy ON public.transactions;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: Fully qualified column name - Error: %', SQLERRM;
  END;

  -- Test 3: Table alias
  BEGIN
    CREATE POLICY test_policy ON public.transactions 
      FOR ALL 
      USING (
        EXISTS (
          SELECT 1 
          FROM public.bank_accounts ba
          WHERE ba.id = public.transactions.bank_account_id
        )
      );
    RAISE NOTICE 'SUCCESS: Table alias works!';
    DROP POLICY test_policy ON public.transactions;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: Table alias - Error: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- DIAGNOSTIC COMPLETE
-- ============================================================================
-- Review the output above to understand:
-- 1. What tables exist
-- 2. What policies exist
-- 3. What the exact error message is
-- 4. Which syntax pattern works for your Supabase instance
