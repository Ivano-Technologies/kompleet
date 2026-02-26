-- =========================================
-- Sprint 5 rollback: Remove workspaces, premium tier, workspace_id on expenses.
-- Reverts 20260221100000_sprint5_workspaces_premium.sql
-- =========================================

-- Drop RLS policies
drop policy if exists "workspaces_owner_all" on public.workspaces;
drop policy if exists "workspaces_members_select" on public.workspaces;
drop policy if exists "workspace_members_owner_manage" on public.workspace_members;
drop policy if exists "workspace_members_select" on public.workspace_members;

-- Drop tables (members first due to FK)
drop table if exists public.workspace_members;
drop table if exists public.workspaces;

-- Remove workspace_id from expenses
alter table public.expenses drop column if exists workspace_id;

-- Remove subscription_tier from profiles
alter table public.profiles drop column if exists subscription_tier;
