-- =========================================
-- KOMPLEET SECURITY HARDENING ROLLBACK
-- =========================================
-- This migration rolls back the security hardening changes
-- and restores the previous broad permissions.
--
-- USE WITH CAUTION: This should only be used in emergency situations.

-- =========================================
-- STEP 1: Drop Helper Functions
-- =========================================

DROP FUNCTION IF EXISTS public.bulk_insert_transactions;

-- =========================================
-- STEP 2: Drop RLS Policies
-- =========================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
DROP POLICY IF EXISTS "bank_configs_select_active" ON public.bank_configs;
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
DROP POLICY IF EXISTS "clerk_users_select_own" ON public.clerk_users;

-- =========================================
-- STEP 3: Restore Broad Permissions
-- =========================================

-- Restore service_role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Restore authenticated role permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Restore anon permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
