-- ============================================================
-- Migration: 003_tables.sql
-- Description: Create all tables, indexes, and constraints
-- Created: 2026-01-29
-- 
-- TABLE ORDER (respects foreign key dependencies):
-- 1. profiles (depends on auth.users)
-- 2. categories (no dependencies)
-- 3. transactions (depends on profiles, categories)
-- 4. tax_calculations (depends on profiles)
-- 5. reports (depends on profiles)
-- 6. audit_logs (depends on profiles)
-- 7. import_batches (depends on profiles)
-- 8. ai_category_overrides (depends on profiles, categories)
-- 9. ai_audit_logs (depends on profiles)
-- ============================================================

-- ============================================================
-- TABLE: profiles
-- User profiles linked 1:1 with auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Primary key (matches auth.users.id)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  
  -- Entity type
  entity_type public.entity_type NOT NULL DEFAULT 'individual',
  
  -- Tax identification
  tin TEXT,                    -- Tax Identification Number (10-11 digits)
  
  -- Company-specific fields
  company_name TEXT,
  rc_number TEXT,              -- CAC Registration Number
  company_address TEXT,
  
  -- VAT registration
  vat_registered BOOLEAN NOT NULL DEFAULT FALSE,
  vat_number TEXT,
  
  -- Subscription
  subscription_tier public.subscription_tier_type NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  
  -- Usage tracking
  monthly_transaction_count INTEGER NOT NULL DEFAULT 0,
  last_transaction_reset TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT profiles_valid_tin CHECK (
    tin IS NULL OR LENGTH(REGEXP_REPLACE(tin, '[^0-9]', '', 'g')) BETWEEN 10 AND 15
  ),
  CONSTRAINT profiles_valid_rc_number CHECK (
    rc_number IS NULL OR LENGTH(rc_number) >= 6
  ),
  CONSTRAINT profiles_company_requires_name CHECK (
    entity_type != 'company' OR company_name IS NOT NULL
  ),
  CONSTRAINT profiles_valid_phone CHECK (
    phone IS NULL OR phone ~ '^\+[1-9]\d{6,14}$'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_entity_type ON public.profiles(entity_type);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(subscription_tier);

-- Comments
COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase auth.users';
COMMENT ON COLUMN public.profiles.tin IS 'Nigerian Tax Identification Number';
COMMENT ON COLUMN public.profiles.rc_number IS 'CAC Company Registration Number';
COMMENT ON COLUMN public.profiles.monthly_transaction_count IS 'Transaction count for current billing period';

-- ============================================================
-- TABLE: categories
-- Transaction categories (system-defined, read-only for users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Category info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Classification
  category_group public.category_group_type NOT NULL,
  tax_treatment public.tax_treatment_type NOT NULL,
  
  -- AI categorization keywords
  keywords TEXT[] NOT NULL DEFAULT '{}',
  
  -- WHT category (if applicable)
  wht_category public.wht_category_type,
  
  -- VAT applicability
  vat_applicable BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- System flag (system categories cannot be modified)
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Display order for UI
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT categories_name_unique UNIQUE (name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_group ON public.categories(category_group);
CREATE INDEX IF NOT EXISTS idx_categories_tax_treatment ON public.categories(tax_treatment);
CREATE INDEX IF NOT EXISTS idx_categories_keywords ON public.categories USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- Comments
COMMENT ON TABLE public.categories IS 'Transaction categories for tax classification';
COMMENT ON COLUMN public.categories.keywords IS 'Keywords for AI-based auto-categorization';
COMMENT ON COLUMN public.categories.wht_category IS 'WHT category if subject to withholding tax';

-- ============================================================
-- TABLE: transactions
-- Financial transactions imported from bank statements
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Core transaction data
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL,  -- Stored in kobo (smallest unit)
  transaction_type public.transaction_type NOT NULL,
  running_balance BIGINT,  -- Balance after transaction (if available)
  
  -- Categorization
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,  -- User confirmed category
  ai_confidence DECIMAL(3, 2),  -- AI confidence score (0.00 - 1.00)
  
  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual',  -- 'manual', 'csv', 'excel', 'pdf', 'api'
  source_bank TEXT,
  source_file_name TEXT,
  import_batch_id UUID,  -- Links to import_batches
  
  -- Tax assignment
  tax_year INTEGER NOT NULL,
  
  -- Deduplication
  hash TEXT NOT NULL,  -- SHA256(date|amount|description)
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT transactions_amount_positive CHECK (amount >= 0),
  CONSTRAINT transactions_ai_confidence_range CHECK (
    ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)
  ),
  CONSTRAINT transactions_tax_year_valid CHECK (
    tax_year >= 2000 AND tax_year <= 2100
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_year ON public.transactions(user_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_batch ON public.transactions(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);

-- Partial indexes
CREATE INDEX IF NOT EXISTS idx_transactions_uncategorized 
  ON public.transactions(user_id, created_at DESC) 
  WHERE category_id IS NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_unverified 
  ON public.transactions(user_id, ai_confidence DESC) 
  WHERE is_verified = FALSE AND deleted_at IS NULL;

-- Unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_hash_unique 
  ON public.transactions(user_id, hash) 
  WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE public.transactions IS 'Financial transactions imported from bank statements';
COMMENT ON COLUMN public.transactions.amount IS 'Amount in kobo (divide by 100 for Naira)';
COMMENT ON COLUMN public.transactions.hash IS 'SHA256 hash for deduplication';
COMMENT ON COLUMN public.transactions.is_verified IS 'True if user has manually verified the category';

-- ============================================================
-- TABLE: tax_calculations
-- Stored tax calculation results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Calculation type
  tax_type public.tax_type NOT NULL,
  tax_year INTEGER NOT NULL,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Input data (stored as JSONB for flexibility)
  input_data JSONB NOT NULL DEFAULT '{}',
  
  -- Results
  gross_amount BIGINT NOT NULL,     -- In kobo
  deductions BIGINT NOT NULL DEFAULT 0,
  taxable_amount BIGINT NOT NULL,   -- In kobo
  tax_due BIGINT NOT NULL,          -- In kobo
  effective_rate DECIMAL(5, 4),     -- e.g., 0.1850 = 18.50%
  
  -- Detailed breakdown
  breakdown JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  is_final BOOLEAN NOT NULL DEFAULT FALSE,  -- Locked for filing
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT tax_calculations_amounts_positive CHECK (
    gross_amount >= 0 AND taxable_amount >= 0 AND tax_due >= 0
  ),
  CONSTRAINT tax_calculations_year_valid CHECK (
    tax_year >= 2000 AND tax_year <= 2100
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user ON public.tax_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_year ON public.tax_calculations(user_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_type ON public.tax_calculations(tax_type);

-- Comments
COMMENT ON TABLE public.tax_calculations IS 'Stored tax calculation results for audit trail';
COMMENT ON COLUMN public.tax_calculations.breakdown IS 'Detailed breakdown of calculation (brackets, reliefs, etc.)';

-- ============================================================
-- TABLE: reports
-- Generated reports (PDF, Excel exports)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Report info
  report_type TEXT NOT NULL,  -- 'income_statement', 'tax_summary', 'transaction_export'
  report_name TEXT NOT NULL,
  tax_year INTEGER,
  
  -- Status
  status public.report_status_type NOT NULL DEFAULT 'pending',
  
  -- File info
  file_path TEXT,             -- Supabase Storage path
  file_size_bytes BIGINT,
  mime_type TEXT,
  
  -- Error tracking
  error_message TEXT,
  
  -- Parameters used to generate
  parameters JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  generated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,     -- Auto-delete after expiry
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_expires ON public.reports(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON TABLE public.reports IS 'Generated reports and exports';

-- ============================================================
-- TABLE: audit_logs
-- Immutable audit trail for compliance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- What
  action public.audit_action_type NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  
  -- Changes
  old_data JSONB,
  new_data JSONB,
  
  -- Context
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  -- When (immutable - no updated_at)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs(record_id) WHERE record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Comments
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for compliance and debugging';

-- ============================================================
-- TABLE: import_batches
-- Track bank statement import jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- 'csv', 'xlsx', 'pdf'
  file_size_bytes BIGINT,
  
  -- Bank detection
  bank_name TEXT,
  
  -- Statistics
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status public.import_status_type NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_import_batches_user ON public.import_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON public.import_batches(status);

-- Add foreign key from transactions to import_batches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transactions_import_batch'
  ) THEN
    ALTER TABLE public.transactions 
      ADD CONSTRAINT fk_transactions_import_batch 
      FOREIGN KEY (import_batch_id) REFERENCES public.import_batches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.import_batches IS 'Tracks bank statement import jobs and statistics';

-- ============================================================
-- TABLE: ai_category_overrides
-- User corrections to AI categorization (for learning)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_category_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Match criteria
  description TEXT NOT NULL,
  description_hash TEXT NOT NULL,  -- For exact matching
  
  -- Override details
  original_category_id UUID REFERENCES public.categories(id),
  corrected_category_id UUID NOT NULL REFERENCES public.categories(id),
  
  -- Usage tracking
  frequency INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT ai_overrides_unique UNIQUE (user_id, description_hash, corrected_category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_overrides_user ON public.ai_category_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_overrides_hash ON public.ai_category_overrides(description_hash);
CREATE INDEX IF NOT EXISTS idx_ai_overrides_frequency ON public.ai_category_overrides(user_id, frequency DESC);

-- Comments
COMMENT ON TABLE public.ai_category_overrides IS 'User corrections to AI categorization for personalized learning';

-- ============================================================
-- TABLE: ai_audit_logs
-- Track AI service usage for monitoring and billing
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- What
  operation TEXT NOT NULL,  -- 'categorize', 'parse', 'detect_recurring'
  request_hash TEXT NOT NULL,
  
  -- Input
  input_tokens INTEGER NOT NULL DEFAULT 0,
  input_summary TEXT,  -- Truncated for debugging
  
  -- Output
  output_tokens INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,  -- 'openai', 'anthropic'
  latency_ms INTEGER NOT NULL DEFAULT 0,
  cached BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Results
  success BOOLEAN NOT NULL,
  error_message TEXT,
  result_count INTEGER NOT NULL DEFAULT 0,
  average_confidence DECIMAL(3, 2),
  
  -- Extra
  metadata JSONB,
  
  -- When
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_audit_user ON public.ai_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_operation ON public.ai_audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_ai_audit_created ON public.ai_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_success ON public.ai_audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_audit_provider ON public.ai_audit_logs(provider);

-- Comments
COMMENT ON TABLE public.ai_audit_logs IS 'Tracks AI service usage for monitoring, debugging, and billing';

-- ============================================================
-- RECORD MIGRATION
-- ============================================================
INSERT INTO public._migrations (name) 
VALUES ('003_tables.sql')
ON CONFLICT (name) DO NOTHING;
