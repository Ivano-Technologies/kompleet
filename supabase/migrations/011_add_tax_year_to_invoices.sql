/**
 * Migration: Add tax_year column to invoices table
 * This column is required for filtering invoices by tax year
 * Date: 2026-02-17
 */

-- Add tax_year column to invoices table
ALTER TABLE public.invoices
ADD COLUMN tax_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Create index for faster filtering by tax_year
CREATE INDEX idx_invoices_user_tax_year ON public.invoices(user_id, tax_year);

-- Update existing invoices to have the correct tax year based on issue_date
UPDATE public.invoices
SET tax_year = EXTRACT(YEAR FROM issue_date)
WHERE tax_year = EXTRACT(YEAR FROM CURRENT_DATE);

-- Add constraint to ensure tax_year is reasonable (between 2000 and 2100)
ALTER TABLE public.invoices
ADD CONSTRAINT check_tax_year_valid CHECK (tax_year >= 2000 AND tax_year <= 2100);
