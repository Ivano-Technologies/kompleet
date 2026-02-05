-- Sprint 5: Transaction Management System
-- Create transactions and categories tables with RLS policies

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('income', 'expense', 'asset', 'liability')),
  tax_treatment TEXT NOT NULL CHECK (tax_treatment IN ('deductible', 'non_deductible', 'capital_allowance', 'exempt')),
  keywords TEXT[] DEFAULT '{}', -- Array of keywords for auto-categorization
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- System categories cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
  balance DECIMAL(15,2),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  source TEXT, -- e.g., 'gtbank_csv', 'manual_entry', 'excel_import'
  reference TEXT, -- Transaction reference number from bank
  notes TEXT, -- User notes
  is_reconciled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(category_type);
CREATE INDEX IF NOT EXISTS idx_categories_tax_treatment ON public.categories(tax_treatment);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CATEGORIES RLS POLICIES
-- ============================================================================

-- All authenticated users can read categories
CREATE POLICY "Allow authenticated users to read categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);

-- Only service role can manage categories
CREATE POLICY "Allow service role to manage categories"
ON public.categories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- TRANSACTIONS RLS POLICIES
-- ============================================================================

-- Users can read their own transactions
CREATE POLICY "Users can read their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert their own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users can update their own transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own transactions
CREATE POLICY "Users can delete their own transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Allow service role to manage transactions"
ON public.transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SEED CATEGORIES (Nigerian Tax Context)
-- ============================================================================

INSERT INTO public.categories (name, category_type, tax_treatment, keywords, description, is_system) VALUES
  -- INCOME CATEGORIES
  ('Sales Revenue', 'income', 'exempt', ARRAY['sales', 'revenue', 'invoice', 'payment received'], 'Revenue from sales of goods or services', true),
  ('Service Income', 'income', 'exempt', ARRAY['service', 'consulting', 'professional fees'], 'Income from professional services', true),
  ('Interest Income', 'income', 'exempt', ARRAY['interest', 'bank interest', 'investment income'], 'Interest earned from bank accounts or investments', true),
  ('Rent Received', 'income', 'exempt', ARRAY['rent received', 'rental income', 'property income'], 'Income from property rentals', true),
  ('Other Income', 'income', 'exempt', ARRAY['miscellaneous income', 'other'], 'Other miscellaneous income', true),
  
  -- EXPENSE CATEGORIES (Deductible)
  ('Salaries & Wages', 'expense', 'deductible', ARRAY['salary', 'wages', 'payroll', 'staff'], 'Employee salaries and wages', true),
  ('Rent Expense', 'expense', 'deductible', ARRAY['rent', 'lease', 'office rent'], 'Office or business premises rent', true),
  ('Utilities', 'expense', 'deductible', ARRAY['electricity', 'water', 'internet', 'phone', 'utilities'], 'Electricity, water, internet, phone bills', true),
  ('Office Supplies', 'expense', 'deductible', ARRAY['stationery', 'supplies', 'office materials'], 'Office supplies and materials', true),
  ('Marketing & Advertising', 'expense', 'deductible', ARRAY['marketing', 'advertising', 'promotion', 'social media'], 'Marketing and advertising expenses', true),
  ('Professional Fees', 'expense', 'deductible', ARRAY['legal', 'accounting', 'consulting', 'professional'], 'Legal, accounting, consulting fees', true),
  ('Travel & Transport', 'expense', 'deductible', ARRAY['travel', 'transport', 'fuel', 'taxi', 'flight'], 'Business travel and transportation', true),
  ('Bank Charges', 'expense', 'deductible', ARRAY['bank charges', 'bank fees', 'transaction fees'], 'Bank fees and charges', true),
  ('Insurance', 'expense', 'deductible', ARRAY['insurance', 'premium'], 'Business insurance premiums', true),
  ('Repairs & Maintenance', 'expense', 'deductible', ARRAY['repairs', 'maintenance', 'servicing'], 'Repairs and maintenance of assets', true),
  
  -- EXPENSE CATEGORIES (Non-Deductible)
  ('Entertainment', 'expense', 'non_deductible', ARRAY['entertainment', 'meals', 'dining'], 'Entertainment and meals (partially deductible)', true),
  ('Penalties & Fines', 'expense', 'non_deductible', ARRAY['penalty', 'fine', 'late fee'], 'Penalties and fines (non-deductible)', true),
  ('Personal Expenses', 'expense', 'non_deductible', ARRAY['personal', 'withdrawal', 'owner draw'], 'Personal expenses and owner withdrawals', true),
  
  -- ASSET CATEGORIES (Capital Allowance)
  ('Equipment Purchase', 'asset', 'capital_allowance', ARRAY['equipment', 'machinery', 'computer', 'laptop'], 'Purchase of business equipment', true),
  ('Furniture & Fixtures', 'asset', 'capital_allowance', ARRAY['furniture', 'fixtures', 'desk', 'chair'], 'Furniture and fixtures', true),
  ('Vehicle Purchase', 'asset', 'capital_allowance', ARRAY['vehicle', 'car', 'truck'], 'Purchase of business vehicles', true),
  
  -- LIABILITY CATEGORIES
  ('Loan Repayment', 'liability', 'non_deductible', ARRAY['loan', 'loan repayment', 'principal'], 'Loan principal repayment', true),
  ('Tax Payment', 'liability', 'non_deductible', ARRAY['tax', 'vat', 'withholding', 'paye'], 'Tax payments (VAT, WHT, PAYE)', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.categories IS 'Transaction categories for classification and tax treatment';
COMMENT ON TABLE public.transactions IS 'User financial transactions imported from bank statements or entered manually';

COMMENT ON COLUMN public.transactions.confidence_score IS 'Auto-categorization confidence (0-100), NULL if manually categorized';
COMMENT ON COLUMN public.transactions.source IS 'Source of transaction (e.g., gtbank_csv, manual_entry)';
COMMENT ON COLUMN public.transactions.is_reconciled IS 'Whether transaction has been reconciled with bank statement';

COMMENT ON POLICY "Users can read their own transactions" ON public.transactions IS 
'Users can only access their own transaction data for privacy';
