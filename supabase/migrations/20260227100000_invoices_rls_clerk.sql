-- ============================================================
-- Migration: Invoices RLS for Clerk JWT
-- Date: 2026-02-27
-- Allows invoice access when using Clerk JWT (get_clerk_user_id()).
-- Existing auth.uid() policies remain for Supabase Auth users.
-- ============================================================

-- Invoices: allow SELECT when user_id matches Clerk-mapped user
DROP POLICY IF EXISTS "Users can view own invoices (Clerk)" ON public.invoices;
CREATE POLICY "Users can view own invoices (Clerk)"
  ON public.invoices
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (user_id = public.get_clerk_user_id());

-- Invoices: allow INSERT when user_id matches Clerk-mapped user
DROP POLICY IF EXISTS "Users can insert own invoices (Clerk)" ON public.invoices;
CREATE POLICY "Users can insert own invoices (Clerk)"
  ON public.invoices
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.get_clerk_user_id());

-- Invoices: allow UPDATE when user_id matches Clerk-mapped user
DROP POLICY IF EXISTS "Users can update own invoices (Clerk)" ON public.invoices;
CREATE POLICY "Users can update own invoices (Clerk)"
  ON public.invoices
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (user_id = public.get_clerk_user_id())
  WITH CHECK (user_id = public.get_clerk_user_id());

-- Invoices: allow DELETE for own draft invoices (Clerk)
DROP POLICY IF EXISTS "Users can delete own draft invoices (Clerk)" ON public.invoices;
CREATE POLICY "Users can delete own draft invoices (Clerk)"
  ON public.invoices
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (user_id = public.get_clerk_user_id() AND status = 'draft');
