-- =========================================
-- KOMPLEET SECURITY HARDENING MIGRATION
-- =========================================
-- This migration implements least-privilege access controls
-- while maintaining compatibility with existing application code.
--
-- ROLLBACK: See 20260219051749_security_hardening_rollback.sql

-- =========================================
-- STEP 1: Revoke Overly Broad Permissions
-- =========================================

-- Revoke ALL from service_role (too permissive)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM service_role;

-- Revoke broad permissions from authenticated role
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Revoke SELECT from anon (no anonymous access needed)
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;

-- =========================================
-- STEP 2: Grant Minimal Schema Access
-- =========================================

-- Allow usage of the public schema
GRANT USAGE ON SCHEMA public TO authenticated, service_role, anon;

-- Allow sequence usage for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =========================================
-- STEP 3: Grant Table-Level Permissions with RLS
-- =========================================

-- Profiles: authenticated users can read/write their own via RLS
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Transactions: authenticated users can CRUD their own via RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;

-- Categories: read-only for authenticated users
GRANT SELECT ON public.categories TO authenticated;

-- Bank configs: read-only for authenticated users
GRANT SELECT ON public.bank_configs TO authenticated;

-- Audit logs: read-only for authenticated users (their own via RLS)
GRANT SELECT ON public.audit_logs TO authenticated;

-- Clerk users: read-only for authenticated users
GRANT SELECT ON public.clerk_users TO authenticated;

-- =========================================
-- STEP 4: Service Role Restricted Access
-- =========================================
-- Grant service_role SELECT only for monitoring and debugging
-- In production, this can be further restricted or revoked

GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role;

-- Service role can execute functions for admin operations
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =========================================
-- STEP 5: Implement Granular RLS Policies
-- =========================================

-- Drop existing broad policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view bank configs" ON public.bank_configs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

-- Profiles: Users can only access their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Transactions: Users can only access their own transactions
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Categories: All authenticated users can read
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

-- Bank configs: All authenticated users can read active configs
DROP POLICY IF EXISTS "bank_configs_select_active" ON public.bank_configs;
CREATE POLICY "bank_configs_select_active"
  ON public.bank_configs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Audit logs: Users can only view their own logs
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Clerk users: Users can only view their own record
DROP POLICY IF EXISTS "clerk_users_select_own" ON public.clerk_users;
CREATE POLICY "clerk_users_select_own"
  ON public.clerk_users FOR SELECT
  TO authenticated
  USING (
    clerk_user_id = (
      SELECT clerk_user_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =========================================
-- STEP 6: Create Helper Functions (Optional)
-- =========================================
-- These functions provide additional validation and can be used
-- by the application for complex operations

-- Function: Bulk insert transactions (for CSV import)
CREATE OR REPLACE FUNCTION public.bulk_insert_transactions(
  p_transactions jsonb
)
RETURNS TABLE (
  inserted_count integer,
  failed_count integer,
  errors jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_inserted integer := 0;
  v_failed integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_transaction jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Loop through transactions
  FOR v_transaction IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    BEGIN
      INSERT INTO public.transactions (
        user_id,
        transaction_date,
        amount,
        description,
        transaction_type,
        balance,
        source,
        reference
      ) VALUES (
        v_user_id,
        (v_transaction->>'transaction_date')::date,
        (v_transaction->>'amount')::numeric,
        v_transaction->>'description',
        (v_transaction->>'transaction_type')::public.transaction_type,
        (v_transaction->>'balance')::numeric,
        v_transaction->>'source',
        v_transaction->>'reference'
      );
      
      v_inserted := v_inserted + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object(
        'transaction', v_transaction,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN QUERY SELECT v_inserted, v_failed, v_errors;
END;
$$;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.bulk_insert_transactions TO authenticated;

-- =========================================
-- COMMENTS
-- =========================================

COMMENT ON POLICY "profiles_select_own" ON public.profiles IS 
  'Users can only SELECT their own profile';

COMMENT ON POLICY "transactions_select_own" ON public.transactions IS 
  'Users can only SELECT their own transactions';

COMMENT ON FUNCTION public.bulk_insert_transactions IS 
  'Bulk inserts transactions for the authenticated user (used for CSV import)';
