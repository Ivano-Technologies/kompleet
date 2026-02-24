-- =========================================
-- ROLLBACK: Expense Tracking (reverse of 20260221000000_expense_tracking.sql)
-- Run only to revert expense tracking tables and policies.
-- =========================================

-- Storage policies (receipts bucket)
drop policy if exists "Users can delete own receipts" on storage.objects;
drop policy if exists "Users can update own receipts" on storage.objects;
drop policy if exists "Users can view receipts" on storage.objects;
drop policy if exists "Users can upload receipts" on storage.objects;

-- Trigger and function
drop trigger if exists update_expenses_updated_at on public.expenses;
drop function if exists public.expenses_updated_at();

-- RLS policies
drop policy if exists "ndpr_consents_all" on public.ndpr_consents;
drop policy if exists "expense_reports_all" on public.expense_reports;
drop policy if exists "expenses_delete" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expense_categories_delete" on public.expense_categories;
drop policy if exists "expense_categories_update" on public.expense_categories;
drop policy if exists "expense_categories_insert" on public.expense_categories;
drop policy if exists "expense_categories_select" on public.expense_categories;

-- Tables (reverse dependency order)
drop table if exists public.ndpr_consents;
drop table if exists public.expense_reports;
drop table if exists public.expenses;
drop table if exists public.expense_categories;
