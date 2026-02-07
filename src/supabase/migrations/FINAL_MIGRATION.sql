-- KOMPLEET Platform - Complete Database Migration (FINAL FIX)
-- Version: 1.0.2
-- Description: Creates all core tables + RLS policies (unqualified column names)
-- Safe to run in Supabase - run this entire file at once

-- ============================================================================
-- PART 1: CREATE ALL TABLES
-- ============================================================================

-- USERS TABLE (integrates with Clerk auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  business_name VARCHAR(255),
  business_type VARCHAR(50) CHECK (business_type IN ('individual', 'sole_proprietor', 'partnership', 'limited_company', 'ngo')),
  tin VARCHAR(50),
  phone VARCHAR(50),
  address JSONB,
  preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON public.users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_business_type ON public.users(business_type);

-- CATEGORIES TABLE (for transaction categorization)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  tax_deductible BOOLEAN DEFAULT FALSE,
  vat_applicable BOOLEAN DEFAULT TRUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, type)
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- BANK ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  bank_code VARCHAR(50),
  currency VARCHAR(3) DEFAULT 'NGN',
  balance NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'pending')),
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON public.bank_accounts(status);

-- TRANSACTIONS TABLE (bank transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  description VARCHAR(500),
  date TIMESTAMPTZ NOT NULL,
  category VARCHAR(100),
  category_confidence NUMERIC(3,2),
  linked_record_id UUID,
  is_categorized BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bank_account_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_bank_account_id ON public.transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_is_categorized ON public.transactions(is_categorized);

-- RECORDS TABLE (financial records - manual entries)
CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  vat_amount NUMERIC(15,2) DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 7.5,
  tax_code VARCHAR(50),
  tax_deductible BOOLEAN DEFAULT FALSE,
  attachments TEXT[],
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_records_user_id ON public.records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_date ON public.records(date DESC);
CREATE INDEX IF NOT EXISTS idx_records_type ON public.records(type);
CREATE INDEX IF NOT EXISTS idx_records_category_id ON public.records(category_id);
CREATE INDEX IF NOT EXISTS idx_records_status ON public.records(status);

-- CUSTOMERS TABLE (for invoicing)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  tin VARCHAR(50),
  address JSONB,
  billing_address JSONB,
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE NO ACTION,
  invoice_number VARCHAR(50) NOT NULL,
  issue_date DATE NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL,
  total NUMERIC(15,2) NOT NULL,
  amount_paid NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  e_invoice_id VARCHAR(255),
  e_invoice_status VARCHAR(50),
  e_invoice_submitted_at TIMESTAMPTZ,
  notes TEXT,
  payment_instructions TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- TAX FILINGS TABLE
CREATE TABLE IF NOT EXISTS public.filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('vat', 'income_tax', 'withholding_tax', 'paye', 'development_levy')),
  period JSONB NOT NULL,
  record_ids UUID[],
  total_amount NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL,
  gross_income NUMERIC(15,2) DEFAULT 0,
  deductions NUMERIC(15,2) DEFAULT 0,
  taxable_income NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'submitted', 'approved', 'rejected')),
  nrs_reference VARCHAR(100),
  nrs_status VARCHAR(50),
  nrs_response JSONB,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  calculations JSONB DEFAULT '{}',
  supporting_documents TEXT[],
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filings_user_id ON public.filings(user_id);
CREATE INDEX IF NOT EXISTS idx_filings_type ON public.filings(type);
CREATE INDEX IF NOT EXISTS idx_filings_status ON public.filings(status);

-- EXPORTS TABLE
CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('transactions', 'invoices', 'tax_report', 'full_backup')),
  format VARCHAR(20) NOT NULL CHECK (format IN ('csv', 'excel', 'pdf', 'json')),
  filters JSONB DEFAULT '{}',
  date_range JSONB,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  file_size_bytes BIGINT,
  error_message TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exports_user_id ON public.exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON public.exports(status);
CREATE INDEX IF NOT EXISTS idx_exports_created_at ON public.exports(created_at DESC);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ML TRAINING DATA TABLE
CREATE TABLE IF NOT EXISTS public.ml_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_description TEXT NOT NULL,
  assigned_category VARCHAR(100) NOT NULL,
  confidence_score NUMERIC(3,2),
  is_verified BOOLEAN DEFAULT FALSE,
  source VARCHAR(50) CHECK (source IN ('user', 'ml_model', 'rule_based')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_training_data_user_id ON public.ml_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_data_category ON public.ml_training_data(assigned_category);

-- ============================================================================
-- PART 2: SEED SYSTEM CATEGORIES
-- ============================================================================

INSERT INTO public.categories (name, type, tax_deductible, vat_applicable, is_system) VALUES
  -- Income categories
  ('Sales Revenue', 'income', FALSE, TRUE, TRUE),
  ('Service Income', 'income', FALSE, TRUE, TRUE),
  ('Interest Income', 'income', FALSE, FALSE, TRUE),
  ('Rental Income', 'income', FALSE, TRUE, TRUE),
  ('Other Income', 'income', FALSE, TRUE, TRUE),
  
  -- Expense categories
  ('Office Supplies', 'expense', TRUE, TRUE, TRUE),
  ('Rent', 'expense', TRUE, TRUE, TRUE),
  ('Utilities', 'expense', TRUE, TRUE, TRUE),
  ('Salaries & Wages', 'expense', TRUE, FALSE, TRUE),
  ('Professional Fees', 'expense', TRUE, TRUE, TRUE),
  ('Marketing & Advertising', 'expense', TRUE, TRUE, TRUE),
  ('Travel & Transportation', 'expense', TRUE, TRUE, TRUE),
  ('Insurance', 'expense', TRUE, TRUE, TRUE),
  ('Bank Charges', 'expense', TRUE, FALSE, TRUE),
  ('Depreciation', 'expense', TRUE, FALSE, TRUE),
  ('Other Expenses', 'expense', TRUE, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 3: UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
    CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bank_accounts_updated_at') THEN
    CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transactions_updated_at') THEN
    CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_records_updated_at') THEN
    CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON public.records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customers_updated_at') THEN
    CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
    CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_filings_updated_at') THEN
    CREATE TRIGGER update_filings_updated_at BEFORE UPDATE ON public.filings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_exports_updated_at') THEN
    CREATE TRIGGER update_exports_updated_at BEFORE UPDATE ON public.exports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notifications_updated_at') THEN
    CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ml_training_data_updated_at') THEN
    CREATE TRIGGER update_ml_training_data_updated_at BEFORE UPDATE ON public.ml_training_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY (RLS) - FINAL FIX WITH UNQUALIFIED COLUMNS
-- ============================================================================

-- Enable RLS on all tables
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

-- Helper function: Get current user's internal ID from Clerk ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
DECLARE
  current_clerk_id TEXT;
  current_user_uuid UUID;
BEGIN
  current_clerk_id := current_setting('request.jwt.claims', true)::json->>'sub';
  
  IF current_clerk_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT id INTO current_user_uuid 
  FROM public.users 
  WHERE clerk_user_id = current_clerk_id
  LIMIT 1;
  
  RETURN current_user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing policies if they exist
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

-- Users: Can only access their own record
-- NOTE: clerk_user_id is unqualified (refers to current row)
CREATE POLICY users_select_own ON public.users 
  FOR SELECT 
  USING (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY users_update_own ON public.users 
  FOR UPDATE 
  USING (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY users_insert_own ON public.users 
  FOR INSERT 
  WITH CHECK (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Categories: Can access own categories and system categories
-- NOTE: user_id and is_system are unqualified (refer to current row)
CREATE POLICY categories_select ON public.categories 
  FOR SELECT 
  USING (
    is_system = TRUE 
    OR user_id IS NULL 
    OR user_id = public.get_current_user_id()
  );

CREATE POLICY categories_insert_own ON public.categories 
  FOR INSERT 
  WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY categories_update_own ON public.categories 
  FOR UPDATE 
  USING (
    user_id = public.get_current_user_id() 
    AND is_system = FALSE
  );

CREATE POLICY categories_delete_own ON public.categories 
  FOR DELETE 
  USING (
    user_id = public.get_current_user_id() 
    AND is_system = FALSE
  );

-- Bank Accounts: Full CRUD on own accounts
-- NOTE: user_id is unqualified (refers to current row)
CREATE POLICY bank_accounts_all ON public.bank_accounts 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Transactions: Full CRUD via bank account ownership
-- CRITICAL FIX: bank_account_id is UNQUALIFIED (refers to current transactions row)
-- Only public.bank_accounts.* is qualified (inside subquery)
CREATE POLICY transactions_all ON public.transactions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.bank_accounts 
      WHERE public.bank_accounts.id = bank_account_id 
      AND public.bank_accounts.user_id = public.get_current_user_id()
    )
  );

-- Records: Full CRUD on own records
-- NOTE: user_id is unqualified (refers to current row)
CREATE POLICY records_all ON public.records 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Customers: Full CRUD on own customers
-- NOTE: user_id is unqualified (refers to current row)
CREATE POLICY customers_all ON public.customers 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Invoices: Full CRUD on own invoices
-- NOTE: user_id is unqualified (refers to current row)
CREATE POLICY invoices_all ON public.invoices 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Filings: Full CRUD on own filings
-- NOTE: user_id is unqualified (refers to current row)
CREATE POLICY filings_all ON public.filings 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Exports: Full CRUD on own exports
-- NOTE: user_id is unqualified (refers to current row)
CREATE POLICY exports_all ON public.exports 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- Notifications: Full CRUD on own notifications
-- NOTE: user_id is unqualified (refers to current row)
CREATE POLICY notifications_all ON public.notifications 
  FOR ALL 
  USING (user_id = public.get_current_user_id());

-- ML Training Data: Can access own data and system data
-- NOTE: user_id is unqualified (refers to current row)
CREATE POLICY ml_training_data_select ON public.ml_training_data 
  FOR SELECT 
  USING (
    user_id IS NULL 
    OR user_id = public.get_current_user_id()
  );

CREATE POLICY ml_training_data_insert ON public.ml_training_data 
  FOR INSERT 
  WITH CHECK (
    user_id IS NULL 
    OR user_id = public.get_current_user_id()
  );

-- ============================================================================
-- PART 5: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- ✅ All tables created with proper indexes
-- ✅ System categories seeded
-- ✅ Automatic updated_at triggers configured
-- ✅ Row Level Security enabled with Clerk integration
-- ✅ FIXED: Unqualified column names in policy expressions
-- ✅ Ready for production use!
