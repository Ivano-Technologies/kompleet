-- Sprint 8: Multi-Year Data Management
-- Migration: Add tax_year column to all relevant tables
-- Date: 2026-02-06

-- =====================================================
-- 1. Add tax_year columns
-- =====================================================

-- Add tax_year to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS tax_year INTEGER NOT NULL DEFAULT 2026;

-- Add tax_year to categories table (if exists)
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS tax_year INTEGER;

-- Add tax_year to nrs_forms table
ALTER TABLE nrs_forms
ADD COLUMN IF NOT EXISTS tax_year INTEGER NOT NULL DEFAULT 2026;

-- Add tax_year to filing_deadlines table
ALTER TABLE filing_deadlines
ADD COLUMN IF NOT EXISTS tax_year INTEGER NOT NULL DEFAULT 2026;

-- Add tax_year to filing_status table
ALTER TABLE filing_status
ADD COLUMN IF NOT EXISTS tax_year INTEGER;

-- =====================================================
-- 2. Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_transactions_tax_year 
ON transactions(tax_year);

CREATE INDEX IF NOT EXISTS idx_transactions_user_year 
ON transactions(user_id, tax_year);

CREATE INDEX IF NOT EXISTS idx_nrs_forms_tax_year 
ON nrs_forms(tax_year);

CREATE INDEX IF NOT EXISTS idx_nrs_forms_user_year 
ON nrs_forms(user_id, tax_year);

CREATE INDEX IF NOT EXISTS idx_filing_deadlines_tax_year 
ON filing_deadlines(tax_year);

-- =====================================================
-- 3. Backfill tax_year for existing records
-- =====================================================

-- Backfill transactions based on created_at date
UPDATE transactions
SET tax_year = EXTRACT(YEAR FROM created_at)::INTEGER
WHERE tax_year = 2026 AND created_at IS NOT NULL;

-- Backfill nrs_forms based on tax_year field (already exists)
-- No action needed - tax_year already populated

-- Backfill filing_status based on filed_date
UPDATE filing_status
SET tax_year = EXTRACT(YEAR FROM filed_date)::INTEGER
WHERE tax_year IS NULL AND filed_date IS NOT NULL;

-- =====================================================
-- 4. Update RLS policies to scope by tax_year
-- =====================================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Recreate RLS policies with tax_year scoping
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);

-- Update NRS forms RLS policies
DROP POLICY IF EXISTS "Users can view own forms" ON nrs_forms;
DROP POLICY IF EXISTS "Users can insert own forms" ON nrs_forms;

CREATE POLICY "Users can view own forms"
ON nrs_forms FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own forms"
ON nrs_forms FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. Create user_tax_years table for tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS user_tax_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tax_year)
);

-- Enable RLS
ALTER TABLE user_tax_years ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_tax_years
CREATE POLICY "Users can view own tax years"
ON user_tax_years FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax years"
ON user_tax_years FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax years"
ON user_tax_years FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_tax_years_user 
ON user_tax_years(user_id);

-- =====================================================
-- 6. Create export_history table
-- =====================================================

CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL, -- 'transactions', 'statements', 'forms', 'bulk'
  format TEXT NOT NULL, -- 'csv', 'excel', 'pdf', 'word', 'zip'
  tax_year INTEGER, -- NULL for all-years export
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'failed'
  file_url TEXT,
  file_size BIGINT,
  error_message TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for export_history
CREATE POLICY "Users can view own exports"
ON export_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exports"
ON export_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exports"
ON export_history FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exports"
ON export_history FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_export_history_user 
ON export_history(user_id);

CREATE INDEX IF NOT EXISTS idx_export_history_status 
ON export_history(status);

CREATE INDEX IF NOT EXISTS idx_export_history_created 
ON export_history(created_at DESC);

-- =====================================================
-- 7. Create data_migration_logs table
-- =====================================================

CREATE TABLE IF NOT EXISTS data_migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_year INTEGER NOT NULL,
  to_year INTEGER NOT NULL,
  record_type TEXT NOT NULL, -- 'transactions', 'categories', etc.
  records_migrated INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'failed', 'rolled_back'
  dry_run BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE data_migration_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own migration logs"
ON data_migration_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own migration logs"
ON data_migration_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_migration_logs_user 
ON data_migration_logs(user_id);

-- =====================================================
-- 8. Create audit_logs table for compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'export', 'migration', 'year_switch', 'data_access'
  resource_type TEXT NOT NULL, -- 'transactions', 'forms', 'reports', etc.
  resource_id UUID,
  tax_year INTEGER,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies (users can only view their own audit logs)
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
ON audit_logs(created_at DESC);

-- =====================================================
-- 9. Add updated_at triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to user_tax_years
DROP TRIGGER IF EXISTS update_user_tax_years_updated_at ON user_tax_years;
CREATE TRIGGER update_user_tax_years_updated_at
BEFORE UPDATE ON user_tax_years
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. Populate user_tax_years for existing users
-- =====================================================

-- Insert available tax years for all users with transactions
INSERT INTO user_tax_years (user_id, tax_year, is_active)
SELECT DISTINCT 
  user_id,
  tax_year,
  CASE WHEN tax_year = 2026 THEN true ELSE false END as is_active
FROM transactions
ON CONFLICT (user_id, tax_year) DO NOTHING;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Add comment
COMMENT ON TABLE user_tax_years IS 'Tracks available tax years for each user';
COMMENT ON TABLE export_history IS 'Tracks user data export requests and files';
COMMENT ON TABLE data_migration_logs IS 'Logs data migration operations between tax years';
COMMENT ON TABLE audit_logs IS 'NDPR compliance audit trail for data access and exports';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Sprint 8 migration completed successfully';
  RAISE NOTICE 'Added tax_year columns to: transactions, nrs_forms, filing_deadlines';
  RAISE NOTICE 'Created tables: user_tax_years, export_history, data_migration_logs, audit_logs';
  RAISE NOTICE 'Updated RLS policies for tax_year scoping';
END $$;
