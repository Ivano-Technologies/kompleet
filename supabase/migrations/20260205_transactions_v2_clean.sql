-- Sprint 5: Transaction Management System (Clean Version)
-- Drop existing tables if they exist and recreate with proper schema

-- ============================================================================
-- DROP EXISTING TABLES (if they exist)
-- ============================================================================

DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category_type TEXT NOT NULL CHECK (category_type IN ('income', 'expense', 'asset', 'liability')),
  tax_treatment TEXT NOT NULL CHECK (tax_treatment IN ('deductible', 'non_deductible', 'capital_allowance', 'exempt')),
  keywords TEXT[] DEFAULT '{}',
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
  balance DECIMAL(15,2),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  source TEXT,
  reference TEXT,
  notes TEXT,
  is_reconciled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);

CREATE INDEX idx_categories_type ON public.categories(category_type);
CREATE INDEX idx_categories_tax_treatment ON public.categories(tax_treatment);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - CATEGORIES
-- ============================================================================

CREATE POLICY "categories_select_authenticated"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "categories_all_service_role"
ON public.categories FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES - TRANSACTIONS
-- ============================================================================

CREATE POLICY "transactions_select_own"
ON public.transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
ON public.transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own"
ON public.transactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "transactions_all_service_role"
ON public.transactions FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED CATEGORIES
-- ============================================================================

INSERT INTO public.categories (name, category_type, tax_treatment, keywords, description, is_system) VALUES
  -- INCOME
  ('Sales Revenue', 'income', 'exempt', ARRAY['sales', 'revenue', 'invoice', 'payment received'], 'Revenue from sales of goods or services', true),
  ('Service Income', 'income', 'exempt', ARRAY['service', 'consulting', 'professional fees'], 'Income from professional services', true),
  ('Interest Income', 'income', 'exempt', ARRAY['interest', 'bank interest', 'investment income'], 'Interest earned from investments', true),
  ('Rent Received', 'income', 'exempt', ARRAY['rent received', 'rental income'], 'Income from property rentals', true),
  ('Other Income', 'income', 'exempt', ARRAY['miscellaneous', 'other'], 'Other miscellaneous income', true),
  
  -- EXPENSES (Deductible)
  ('Salaries & Wages', 'expense', 'deductible', ARRAY['salary', 'wages', 'payroll', 'staff'], 'Employee salaries and wages', true),
  ('Rent Expense', 'expense', 'deductible', ARRAY['rent', 'lease', 'office rent'], 'Office or business premises rent', true),
  ('Utilities', 'expense', 'deductible', ARRAY['electricity', 'water', 'internet', 'phone'], 'Utilities (electricity, water, internet)', true),
  ('Office Supplies', 'expense', 'deductible', ARRAY['stationery', 'supplies', 'materials'], 'Office supplies and materials', true),
  ('Marketing', 'expense', 'deductible', ARRAY['marketing', 'advertising', 'promotion'], 'Marketing and advertising', true),
  ('Professional Fees', 'expense', 'deductible', ARRAY['legal', 'accounting', 'consulting'], 'Legal, accounting, consulting fees', true),
  ('Travel', 'expense', 'deductible', ARRAY['travel', 'transport', 'fuel', 'taxi'], 'Business travel and transportation', true),
  ('Bank Charges', 'expense', 'deductible', ARRAY['bank charges', 'fees', 'transaction'], 'Bank fees and charges', true),
  ('Insurance', 'expense', 'deductible', ARRAY['insurance', 'premium'], 'Business insurance premiums', true),
  ('Repairs', 'expense', 'deductible', ARRAY['repairs', 'maintenance', 'servicing'], 'Repairs and maintenance', true),
  
  -- EXPENSES (Non-Deductible)
  ('Entertainment', 'expense', 'non_deductible', ARRAY['entertainment', 'meals', 'dining'], 'Entertainment and meals', true),
  ('Penalties', 'expense', 'non_deductible', ARRAY['penalty', 'fine', 'late fee'], 'Penalties and fines', true),
  ('Personal', 'expense', 'non_deductible', ARRAY['personal', 'withdrawal', 'owner'], 'Personal expenses', true),
  
  -- ASSETS (Capital Allowance)
  ('Equipment', 'asset', 'capital_allowance', ARRAY['equipment', 'machinery', 'computer'], 'Business equipment purchase', true),
  ('Furniture', 'asset', 'capital_allowance', ARRAY['furniture', 'fixtures', 'desk'], 'Furniture and fixtures', true),
  ('Vehicle', 'asset', 'capital_allowance', ARRAY['vehicle', 'car', 'truck'], 'Vehicle purchase', true),
  
  -- LIABILITIES
  ('Loan Repayment', 'liability', 'non_deductible', ARRAY['loan', 'principal'], 'Loan principal repayment', true),
  ('Tax Payment', 'liability', 'non_deductible', ARRAY['tax', 'vat', 'withholding'], 'Tax payments', true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.categories IS 'Transaction categories for classification and tax treatment';
COMMENT ON TABLE public.transactions IS 'User financial transactions from bank statements or manual entry';
