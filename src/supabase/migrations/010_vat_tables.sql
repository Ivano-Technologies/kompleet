-- Migration: Add VAT (Value Added Tax) tables
-- Version: 010
-- Date: 2026-02-17
-- Description: Implements VAT calculation and compliance tracking
-- Rollback: See 010_vat_tables.rollback.sql

BEGIN;

-- ============================================================================
-- VAT TRANSACTIONS TABLE
-- ============================================================================
-- Tracks all VAT-eligible transactions for VAT calculation
CREATE TABLE IF NOT EXISTS vat_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  
  -- VAT classification
  category TEXT NOT NULL,
  vat_treatment TEXT NOT NULL CHECK (vat_treatment IN ('standard', 'exempt', 'zero-rated', 'out-of-scope')),
  vat_recoverable BOOLEAN DEFAULT true,
  
  -- Metadata
  source TEXT, -- 'manual', 'email', 'banking', 'import'
  external_id TEXT, -- ID from external source
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  UNIQUE(user_id, external_id) WHERE external_id IS NOT NULL
);

CREATE INDEX idx_vat_transactions_user_id ON vat_transactions(user_id);
CREATE INDEX idx_vat_transactions_date ON vat_transactions(user_id, transaction_date);
CREATE INDEX idx_vat_transactions_type ON vat_transactions(user_id, type);
CREATE INDEX idx_vat_transactions_category ON vat_transactions(user_id, category);
CREATE INDEX idx_vat_transactions_vat_treatment ON vat_transactions(vat_treatment);

-- ============================================================================
-- VAT CALCULATIONS TABLE
-- ============================================================================
-- Stores calculated VAT amounts per transaction
CREATE TABLE IF NOT EXISTS vat_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vat_transaction_id UUID NOT NULL REFERENCES vat_transactions(id) ON DELETE CASCADE,
  
  -- Calculation details
  gross_amount DECIMAL(15, 2) NOT NULL,
  vat_rate DECIMAL(5, 4) NOT NULL, -- e.g., 0.075 for 7.5%
  vat_amount DECIMAL(15, 2) NOT NULL,
  net_amount DECIMAL(15, 2) NOT NULL,
  
  -- Classification
  vat_treatment TEXT NOT NULL,
  is_recoverable BOOLEAN NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vat_calculations_user_id ON vat_calculations(user_id);
CREATE INDEX idx_vat_calculations_transaction_id ON vat_calculations(vat_transaction_id);
CREATE INDEX idx_vat_calculations_recoverable ON vat_calculations(user_id, is_recoverable);

-- ============================================================================
-- VAT SUMMARIES TABLE
-- ============================================================================
-- Stores monthly/quarterly VAT summaries
CREATE TABLE IF NOT EXISTS vat_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Period
  period TEXT NOT NULL, -- YYYY-MM format
  
  -- Sales (Output VAT)
  total_sales_gross DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_sales_vat DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Purchases (Input VAT)
  total_purchases_gross DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_purchases_vat DECIMAL(15, 2) NOT NULL DEFAULT 0,
  recoverable_vat DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Net VAT
  net_vat_payable DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Compliance
  is_registered BOOLEAN NOT NULL DEFAULT false,
  filing_deadline DATE,
  
  -- Metadata
  transaction_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, period)
);

CREATE INDEX idx_vat_summaries_user_id ON vat_summaries(user_id);
CREATE INDEX idx_vat_summaries_period ON vat_summaries(user_id, period);
CREATE INDEX idx_vat_summaries_filing_deadline ON vat_summaries(filing_deadline);

-- ============================================================================
-- VAT FORMS TABLE
-- ============================================================================
-- Stores generated VAT forms (Form A and Form B)
CREATE TABLE IF NOT EXISTS vat_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vat_summary_id UUID NOT NULL REFERENCES vat_summaries(id) ON DELETE CASCADE,
  
  -- Form details
  form_type TEXT NOT NULL CHECK (form_type IN ('A', 'B')),
  period TEXT NOT NULL,
  
  -- Form A: Registered traders
  total_sales_inclusive DECIMAL(15, 2),
  total_sales_exclusive DECIMAL(15, 2),
  output_vat DECIMAL(15, 2),
  
  total_purchases_inclusive DECIMAL(15, 2),
  total_purchases_exclusive DECIMAL(15, 2),
  input_vat DECIMAL(15, 2),
  
  net_vat_payable DECIMAL(15, 2),
  
  -- Form B: Non-registered
  total_turnover DECIMAL(15, 2),
  
  -- Filing
  submission_date DATE,
  authorized_signatory TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')),
  submission_reference TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vat_forms_user_id ON vat_forms(user_id);
CREATE INDEX idx_vat_forms_period ON vat_forms(user_id, period);
CREATE INDEX idx_vat_forms_status ON vat_forms(status);
CREATE INDEX idx_vat_forms_type ON vat_forms(form_type);

-- ============================================================================
-- VAT COMPLIANCE TABLE
-- ============================================================================
-- Tracks VAT compliance status and issues
CREATE TABLE IF NOT EXISTS vat_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vat_summary_id UUID NOT NULL REFERENCES vat_summaries(id) ON DELETE CASCADE,
  
  -- Compliance status
  is_compliant BOOLEAN NOT NULL,
  
  -- Issues and warnings
  issues JSONB DEFAULT '[]'::jsonb, -- Array of compliance issues
  warnings JSONB DEFAULT '[]'::jsonb, -- Array of warnings
  
  -- Recommendations
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Audit trail
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_by TEXT, -- User ID or system
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vat_compliance_user_id ON vat_compliance(user_id);
CREATE INDEX idx_vat_compliance_compliant ON vat_compliance(is_compliant);

-- ============================================================================
-- VAT AUDIT LOG TABLE
-- ============================================================================
-- Tracks all VAT-related changes for audit purposes
CREATE TABLE IF NOT EXISTS vat_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'calculate', 'submit'
  entity_type TEXT NOT NULL, -- 'transaction', 'calculation', 'summary', 'form'
  entity_id UUID,
  
  -- Change details
  old_values JSONB,
  new_values JSONB,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vat_audit_log_user_id ON vat_audit_log(user_id);
CREATE INDEX idx_vat_audit_log_action ON vat_audit_log(action);
CREATE INDEX idx_vat_audit_log_entity ON vat_audit_log(entity_type, entity_id);
CREATE INDEX idx_vat_audit_log_created_at ON vat_audit_log(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all VAT tables
ALTER TABLE vat_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own VAT data
CREATE POLICY vat_transactions_user_isolation ON vat_transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY vat_calculations_user_isolation ON vat_calculations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY vat_summaries_user_isolation ON vat_summaries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY vat_forms_user_isolation ON vat_forms
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY vat_compliance_user_isolation ON vat_compliance
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY vat_audit_log_user_isolation ON vat_audit_log
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vat_transactions_update_timestamp
  BEFORE UPDATE ON vat_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_vat_timestamp();

CREATE TRIGGER vat_calculations_update_timestamp
  BEFORE UPDATE ON vat_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_vat_timestamp();

CREATE TRIGGER vat_summaries_update_timestamp
  BEFORE UPDATE ON vat_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_vat_timestamp();

CREATE TRIGGER vat_forms_update_timestamp
  BEFORE UPDATE ON vat_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_vat_timestamp();

CREATE TRIGGER vat_compliance_update_timestamp
  BEFORE UPDATE ON vat_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_vat_timestamp();

-- ============================================================================
-- MIGRATION METADATA
-- ============================================================================

-- Record migration in migrations table
INSERT INTO schema_migrations (version, name, description, status)
VALUES (
  '010',
  'vat_tables',
  'Add VAT (Value Added Tax) tables for VAT calculation and compliance',
  'completed'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
