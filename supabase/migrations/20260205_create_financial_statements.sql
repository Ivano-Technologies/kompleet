-- =====================================================
-- FINANCIAL STATEMENTS SCHEMA
-- Sprint 6: P&L and Balance Sheet Generation
-- =====================================================

-- Create financial_statements table
CREATE TABLE IF NOT EXISTS public.financial_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement_type TEXT NOT NULL CHECK (statement_type IN ('profit_loss', 'balance_sheet')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL, -- Stores the computed statement data
  metadata JSONB DEFAULT '{}', -- Additional metadata (filters, settings)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_statements_user_id 
  ON public.financial_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_statements_type 
  ON public.financial_statements(statement_type);
CREATE INDEX IF NOT EXISTS idx_financial_statements_period 
  ON public.financial_statements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_financial_statements_created 
  ON public.financial_statements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_statements
CREATE POLICY "Users can view own financial statements"
  ON public.financial_statements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own financial statements"
  ON public.financial_statements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial statements"
  ON public.financial_statements
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial statements"
  ON public.financial_statements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update trigger for updated_at
DROP TRIGGER IF EXISTS update_financial_statements_updated_at ON public.financial_statements;
CREATE TRIGGER update_financial_statements_updated_at
  BEFORE UPDATE ON public.financial_statements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENT DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.financial_statements IS 'Stores generated financial statements (P&L and Balance Sheet)';
COMMENT ON COLUMN public.financial_statements.statement_type IS 'Type of statement: profit_loss or balance_sheet';
COMMENT ON COLUMN public.financial_statements.period_start IS 'Start date of the reporting period';
COMMENT ON COLUMN public.financial_statements.period_end IS 'End date of the reporting period';
COMMENT ON COLUMN public.financial_statements.data IS 'JSONB containing the computed statement data (line items, totals, etc.)';
COMMENT ON COLUMN public.financial_statements.metadata IS 'Additional metadata like filters, currency, tax year';
