-- ============================================================
-- Migration: 004_rls.sql
-- Description: Row Level Security policies for all tables
-- Created: 2026-01-29
-- 
-- RLS STRATEGY:
-- - Users can only access their own data
-- - System tables (categories) readable by all authenticated
-- - Audit logs are append-only (no update/delete)
-- - Service role bypasses all RLS
-- ============================================================

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_category_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- Users can only read/update their own profile
-- ============================================================

-- Select own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Update own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No direct insert (handled by trigger on auth.users)
-- No delete (soft delete via updated_at)

-- ============================================================
-- CATEGORIES POLICIES
-- All authenticated users can read (system data)
-- Only service role can modify
-- ============================================================

-- Select all categories
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- No insert/update/delete for regular users (service role only)

-- ============================================================
-- TRANSACTIONS POLICIES
-- Full CRUD on own transactions only
-- ============================================================

-- Select own transactions
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert own transactions
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update own transactions
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete own transactions (soft delete)
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- TAX CALCULATIONS POLICIES
-- Users can read/create their own calculations
-- No update on finalized calculations
-- ============================================================

-- Select own calculations
DROP POLICY IF EXISTS "tax_calculations_select_own" ON public.tax_calculations;
CREATE POLICY "tax_calculations_select_own" ON public.tax_calculations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert own calculations
DROP POLICY IF EXISTS "tax_calculations_insert_own" ON public.tax_calculations;
CREATE POLICY "tax_calculations_insert_own" ON public.tax_calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update own calculations (only if not finalized)
DROP POLICY IF EXISTS "tax_calculations_update_own" ON public.tax_calculations;
CREATE POLICY "tax_calculations_update_own" ON public.tax_calculations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_final = FALSE)
  WITH CHECK (auth.uid() = user_id);

-- Delete own calculations (only if not finalized)
DROP POLICY IF EXISTS "tax_calculations_delete_own" ON public.tax_calculations;
CREATE POLICY "tax_calculations_delete_own" ON public.tax_calculations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_final = FALSE);

-- ============================================================
-- REPORTS POLICIES
-- Users can CRUD their own reports
-- ============================================================

-- Select own reports
DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert own reports
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update own reports
DROP POLICY IF EXISTS "reports_update_own" ON public.reports;
CREATE POLICY "reports_update_own" ON public.reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete own reports
DROP POLICY IF EXISTS "reports_delete_own" ON public.reports;
CREATE POLICY "reports_delete_own" ON public.reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOGS POLICIES
-- Users can only read their own audit logs
-- Insert via triggers only (no direct insert)
-- No update or delete (immutable)
-- ============================================================

-- Select own audit logs
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert via service role only (triggers use SECURITY DEFINER)
DROP POLICY IF EXISTS "audit_logs_insert_service" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_service" ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

-- No update or delete policies (immutable)

-- ============================================================
-- IMPORT BATCHES POLICIES
-- Users can CRUD their own import batches
-- ============================================================

-- Select own batches
DROP POLICY IF EXISTS "import_batches_select_own" ON public.import_batches;
CREATE POLICY "import_batches_select_own" ON public.import_batches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert own batches
DROP POLICY IF EXISTS "import_batches_insert_own" ON public.import_batches;
CREATE POLICY "import_batches_insert_own" ON public.import_batches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update own batches
DROP POLICY IF EXISTS "import_batches_update_own" ON public.import_batches;
CREATE POLICY "import_batches_update_own" ON public.import_batches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete own batches
DROP POLICY IF EXISTS "import_batches_delete_own" ON public.import_batches;
CREATE POLICY "import_batches_delete_own" ON public.import_batches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- AI CATEGORY OVERRIDES POLICIES
-- Users can manage their own overrides
-- ============================================================

-- Select own overrides
DROP POLICY IF EXISTS "ai_overrides_select_own" ON public.ai_category_overrides;
CREATE POLICY "ai_overrides_select_own" ON public.ai_category_overrides
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert own overrides
DROP POLICY IF EXISTS "ai_overrides_insert_own" ON public.ai_category_overrides;
CREATE POLICY "ai_overrides_insert_own" ON public.ai_category_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update own overrides
DROP POLICY IF EXISTS "ai_overrides_update_own" ON public.ai_category_overrides;
CREATE POLICY "ai_overrides_update_own" ON public.ai_category_overrides
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete own overrides
DROP POLICY IF EXISTS "ai_overrides_delete_own" ON public.ai_category_overrides;
CREATE POLICY "ai_overrides_delete_own" ON public.ai_category_overrides
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- AI AUDIT LOGS POLICIES
-- Users can only read their own AI audit logs
-- Insert via service role (API routes)
-- ============================================================

-- Select own AI audit logs
DROP POLICY IF EXISTS "ai_audit_logs_select_own" ON public.ai_audit_logs;
CREATE POLICY "ai_audit_logs_select_own" ON public.ai_audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert via authenticated users (from server actions)
DROP POLICY IF EXISTS "ai_audit_logs_insert_own" ON public.ai_audit_logs;
CREATE POLICY "ai_audit_logs_insert_own" ON public.ai_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No update or delete (append-only audit log)

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Anon users have no access (RLS handles this)
-- Authenticated users have access via RLS policies above

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- HELPER FUNCTION: Check if user owns resource
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_owns_resource(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN auth.uid() = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.user_owns_resource IS 'Helper to check resource ownership';

-- ============================================================
-- HELPER FUNCTION: Get current user ID (safe)
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

COMMENT ON FUNCTION public.current_user_id IS 'Returns current authenticated user ID';

-- ============================================================
-- RECORD MIGRATION
-- ============================================================

INSERT INTO public._migrations (name) 
VALUES ('004_rls.sql')
ON CONFLICT (name) DO NOTHING;
