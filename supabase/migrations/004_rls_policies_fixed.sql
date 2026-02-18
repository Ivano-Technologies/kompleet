-- KOMPLEET Platform - Row Level Security Policies (Corrected)
-- Run this AFTER the core tables migration (003_core_tables.sql)
-- This fixes the RLS policies to work correctly with Clerk authentication

-- ============================================================================
-- DROP EXISTING POLICIES (in case of re-run)
-- ============================================================================
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS categories_select ON public.categories;
DROP POLICY IF EXISTS categories_insert_own ON public.categories;
DROP POLICY IF EXISTS categories_update_own ON public.categories;
DROP POLICY IF EXISTS categories_delete_own ON public.categories;
DROP POLICY IF EXISTS bank_accounts_all ON public.bank_accounts;
DROP POLICY IF EXISTS transactions_all ON public.transactions;
DROP POLICY IF EXISTS records_all ON public.records;
DROP POLICY IF EXISTS customers_all ON public.customers;
DROP POLICY IF EXISTS invoices_all ON public.invoices;
DROP POLICY IF EXISTS filings_all ON public.filings;
DROP POLICY IF EXISTS exports_all ON public.exports;
DROP POLICY IF EXISTS notifications_all ON public.notifications;
DROP POLICY IF EXISTS ml_training_data_select ON public.ml_training_data;
DROP POLICY IF EXISTS ml_training_data_insert ON public.ml_training_data;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_data ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get current user's internal ID from Clerk ID
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.users 
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Users: Can only access their own record
CREATE POLICY users_select_own ON public.users 
  FOR SELECT 
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY users_update_own ON public.users 
  FOR UPDATE 
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY users_insert_own ON public.users 
  FOR INSERT 
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Categories: Can access own categories and system categories
CREATE POLICY categories_select ON public.categories 
  FOR SELECT 
  USING (user_id = public.get_current_user_id() OR is_system = TRUE OR user_id IS NULL);

CREATE POLICY categories_insert_own ON public.categories 
  FOR INSERT 
  WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY categories_update_own ON public.categories 
  FOR UPDATE 
  USING (user_id = public.get_current_user_id() AND is_system = FALSE);

CREATE POLICY categories_delete_own ON public.categories 
  FOR DELETE 
  USING (user_id = public.get_current_user_id() AND is_system = FALSE);

-- Bank Accounts: Full CRUD on own accounts
CREATE POLICY bank_accounts_all ON public.bank_accounts 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Transactions: Full CRUD on own transactions (via bank account ownership)
CREATE POLICY transactions_all ON public.transactions 
  FOR ALL 
  USING (
    bank_account_id IN (
      SELECT id FROM public.bank_accounts 
      WHERE user_id = public.get_current_user_id()
    )
  );

-- Records: Full CRUD on own records
CREATE POLICY records_all ON public.records 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Customers: Full CRUD on own customers
CREATE POLICY customers_all ON public.customers 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Invoices: Full CRUD on own invoices
CREATE POLICY invoices_all ON public.invoices 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Filings: Full CRUD on own filings
CREATE POLICY filings_all ON public.filings 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Exports: Full CRUD on own exports
CREATE POLICY exports_all ON public.exports 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Notifications: Full CRUD on own notifications
CREATE POLICY notifications_all ON public.notifications 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- ML Training Data: Can insert and select own data (or global data where user_id is NULL)
CREATE POLICY ml_training_data_select ON public.ml_training_data 
  FOR SELECT 
  USING (user_id = public.get_current_user_id() OR user_id IS NULL);

CREATE POLICY ml_training_data_insert ON public.ml_training_data 
  FOR INSERT 
  WITH CHECK (user_id = public.get_current_user_id() OR user_id IS NULL);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on helper function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;

-- Grant necessary permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- RLS POLICIES APPLIED SUCCESSFULLY
-- ============================================================================
-- All tables now have proper Row Level Security enabled
-- Users can only access their own data
-- System categories are accessible to all users
