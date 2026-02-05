-- Create tax_reports table for storing generated tax reports
CREATE TABLE IF NOT EXISTS public.tax_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('income_tax', 'development_levy', 'vat', 'comprehensive')),
  tax_year INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Business Information
  business_classification TEXT NOT NULL,
  qualifies_as_small_company BOOLEAN DEFAULT FALSE,
  
  -- Financial Data
  total_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(15, 2) NOT NULL DEFAULT 0,
  assessable_profit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  taxable_income DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Tax Computation
  income_tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
  development_levy DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_tax_liability DECIMAL(15, 2) NOT NULL DEFAULT 0,
  effective_tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  
  -- Full computation data (JSONB for flexibility)
  computation_data JSONB NOT NULL,
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'filed', 'paid', 'archived')),
  filed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_tax_reports_user_id ON public.tax_reports(user_id);

-- Create index on tax_year for filtering
CREATE INDEX IF NOT EXISTS idx_tax_reports_tax_year ON public.tax_reports(tax_year);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_tax_reports_status ON public.tax_reports(status);

-- Create index on report_type for filtering
CREATE INDEX IF NOT EXISTS idx_tax_reports_type ON public.tax_reports(report_type);

-- =====================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================================

-- Enable RLS
ALTER TABLE public.tax_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tax reports
CREATE POLICY "Users can view own tax reports"
  ON public.tax_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tax reports
CREATE POLICY "Users can insert own tax reports"
  ON public.tax_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tax reports
CREATE POLICY "Users can update own tax reports"
  ON public.tax_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tax reports
CREATE POLICY "Users can delete own tax reports"
  ON public.tax_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tax_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tax_reports_updated_at ON public.tax_reports;
CREATE TRIGGER trigger_update_tax_reports_updated_at
  BEFORE UPDATE ON public.tax_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_reports_updated_at();

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE public.tax_reports IS 'Stores generated tax reports for users (Nigeria Tax Act 2025 compliance)';
COMMENT ON COLUMN public.tax_reports.report_type IS 'Type of tax report: income_tax, development_levy, vat, comprehensive';
COMMENT ON COLUMN public.tax_reports.business_classification IS 'Business classification: Small Company, Other Company, Very Large Company, Individual';
COMMENT ON COLUMN public.tax_reports.computation_data IS 'Full tax computation data including breakdown, reliefs, exemptions, filing requirements';
COMMENT ON COLUMN public.tax_reports.status IS 'Report status: draft, filed, paid, archived';
