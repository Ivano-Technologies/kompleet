/**
 * Rollback: Remove tax_year column from invoices table
 * Date: 2026-02-17
 */

-- Drop the constraint
ALTER TABLE public.invoices
DROP CONSTRAINT check_tax_year_valid;

-- Drop the index
DROP INDEX IF EXISTS idx_invoices_user_tax_year;

-- Remove the column
ALTER TABLE public.invoices
DROP COLUMN tax_year;
