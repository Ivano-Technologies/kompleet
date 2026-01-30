-- ============================================================
-- ROLLBACK: Complete rollback script for all migrations
-- Description: Reverses all migrations in correct order
-- 
-- WARNING: This will DELETE ALL DATA. Use only in development.
-- Run this to reset database to clean state.
-- ============================================================

-- Start transaction
BEGIN;

-- ============================================================
-- 1. DROP TRIGGERS
-- ============================================================

-- Auth triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;

-- Table triggers
DROP TRIGGER IF EXISTS tr_profiles_update_timestamp ON public.profiles;
DROP TRIGGER IF EXISTS tr_categories_update_timestamp ON public.categories;
DROP TRIGGER IF EXISTS tr_transactions_update_timestamp ON public.transactions;
DROP TRIGGER IF EXISTS tr_transactions_set_hash ON public.transactions;
DROP TRIGGER IF EXISTS tr_transactions_set_tax_year ON public.transactions;
DROP TRIGGER IF EXISTS tr_transactions_increment_count ON public.transactions;
DROP TRIGGER IF EXISTS tr_transactions_check_limit ON public.transactions;
DROP TRIGGER IF EXISTS tr_transactions_audit ON public.transactions;
DROP TRIGGER IF EXISTS tr_tax_calculations_audit ON public.tax_calculations;
DROP TRIGGER IF EXISTS tr_transactions_soft_delete ON public.transactions;

-- ============================================================
-- 2. DROP FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_email_change() CASCADE;
DROP FUNCTION IF EXISTS public.generate_transaction_hash(DATE, BIGINT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.set_transaction_hash() CASCADE;
DROP FUNCTION IF EXISTS public.determine_tax_year(DATE) CASCADE;
DROP FUNCTION IF EXISTS public.set_transaction_tax_year() CASCADE;
DROP FUNCTION IF EXISTS public.increment_transaction_count() CASCADE;
DROP FUNCTION IF EXISTS public.check_transaction_limit() CASCADE;
DROP FUNCTION IF EXISTS public.reset_monthly_transaction_counts() CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_event() CASCADE;
DROP FUNCTION IF EXISTS public.soft_delete() CASCADE;
DROP FUNCTION IF EXISTS public.normalize_description(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.generate_description_hash(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.kobo_to_naira(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.naira_to_kobo(DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.user_owns_resource(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.type_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.column_exists(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.add_column_if_not_exists(TEXT, TEXT, TEXT, TEXT) CASCADE;

-- ============================================================
-- 3. DROP TABLES (reverse dependency order)
-- ============================================================

DROP TABLE IF EXISTS public.ai_audit_logs CASCADE;
DROP TABLE IF EXISTS public.ai_category_overrides CASCADE;
DROP TABLE IF EXISTS public.import_batches CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.tax_calculations CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public._migrations CASCADE;

-- ============================================================
-- 4. DROP TYPES (enums)
-- ============================================================

DROP TYPE IF EXISTS public.member_role_type CASCADE;
DROP TYPE IF EXISTS public.wht_category_type CASCADE;
DROP TYPE IF EXISTS public.import_status_type CASCADE;
DROP TYPE IF EXISTS public.report_status_type CASCADE;
DROP TYPE IF EXISTS public.audit_action_type CASCADE;
DROP TYPE IF EXISTS public.tax_type CASCADE;
DROP TYPE IF EXISTS public.subscription_tier_type CASCADE;
DROP TYPE IF EXISTS public.category_group_type CASCADE;
DROP TYPE IF EXISTS public.tax_treatment_type CASCADE;
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.entity_type CASCADE;

-- ============================================================
-- 5. COMMIT
-- ============================================================

COMMIT;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ROLLBACK COMPLETE';
  RAISE NOTICE 'All tables, functions, and types dropped.';
  RAISE NOTICE '========================================';
END $$;
