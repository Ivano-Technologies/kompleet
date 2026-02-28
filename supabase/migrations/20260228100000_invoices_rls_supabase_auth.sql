-- ============================================================
-- Migration: Invoices RLS for Supabase Auth only
-- Date: 2026-02-28
-- Replaces Clerk-based policies with auth.uid() for Supabase Auth.
-- Use this when Clerk is no longer in use.
-- ============================================================

-- Drop Clerk-based policies
DROP POLICY IF EXISTS "Users can view own invoices (Clerk)" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices (Clerk)" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices (Clerk)" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own draft invoices (Clerk)" ON public.invoices;

-- Invoices: allow SELECT when user_id matches authenticated user
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices"
  ON public.invoices
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Invoices: allow INSERT when user_id matches authenticated user
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Users can insert own invoices"
  ON public.invoices
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Invoices: allow UPDATE when user_id matches authenticated user
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
CREATE POLICY "Users can update own invoices"
  ON public.invoices
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Invoices: allow DELETE for own draft invoices
DROP POLICY IF EXISTS "Users can delete own draft invoices" ON public.invoices;
CREATE POLICY "Users can delete own draft invoices"
  ON public.invoices
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');
