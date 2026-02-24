-- ============================================================
-- Migration: Fix invoices table schema
-- Date: 2026-02-24
-- Reconciles the DB schema with TypeScript types in types.ts
-- Sprint R4 QA finding: invoices.tax_year missing + column mismatch
-- ============================================================

-- Step 1: Drop generated columns (cannot alter generated; must drop/recreate as regular)
ALTER TABLE public.invoices DROP COLUMN IF EXISTS vat_amount;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS total_amount;

-- Step 2: Drop old individual customer columns replaced by customer_info jsonb
ALTER TABLE public.invoices DROP COLUMN IF EXISTS customer_name;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS customer_tin;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS customer_address;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS customer_email;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS qr_code_data;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS digital_signature;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS nrs_submission_id;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS vat_rate;

-- Step 3: Add all missing columns to match TypeScript types
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS tax_year integer NOT NULL DEFAULT extract(year from now())::integer,
  ADD COLUMN IF NOT EXISTS customer_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS vat_amount numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS signature_hash text,
  ADD COLUMN IF NOT EXISTS qr_payload text,
  ADD COLUMN IF NOT EXISTS is_immutable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS template_id text;

-- Step 4: Create invoice_sequences table for sequential per-user invoice numbering
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  last_sequence integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_sequences_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_sequences_user_year_key UNIQUE (user_id, tax_year)
);

ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoice sequences"
  ON public.invoice_sequences
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.invoice_sequences TO authenticated;
GRANT ALL ON public.invoice_sequences TO service_role;

-- Step 5: Create get_next_invoice_number function (Format: INV-2026-0001)
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(
  p_user_id uuid,
  p_tax_year integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seq integer;
  v_invoice_number text;
BEGIN
  INSERT INTO public.invoice_sequences (user_id, tax_year, last_sequence)
  VALUES (p_user_id, p_tax_year, 1)
  ON CONFLICT (user_id, tax_year) DO UPDATE
    SET last_sequence = invoice_sequences.last_sequence + 1,
        updated_at = now()
  RETURNING last_sequence INTO v_seq;

  v_invoice_number := 'INV-' || p_tax_year::text || '-' || LPAD(v_seq::text, 4, '0');
  RETURN v_invoice_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_invoice_number(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number(uuid, integer) TO service_role;

-- Step 6: Index for tax_year filter queries used by the invoices list page
CREATE INDEX IF NOT EXISTS idx_invoices_user_tax_year
  ON public.invoices (user_id, tax_year);

-- Step 7: Updated_at trigger for invoice_sequences
CREATE TRIGGER update_invoice_sequences_updated_at
  BEFORE UPDATE ON public.invoice_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
