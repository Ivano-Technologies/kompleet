-- =========================================
-- ROLLBACK: Sprint 5 workspaces & premium (reverse of 20260221100000)
-- =========================================

-- Remove workspace_id from expenses
alter table public.expenses drop column if exists workspace_id;

-- Drop workspace_members policies and table
drop policy if exists "workspace_members_select" on public.workspace_members;
drop policy if exists "workspace_members_owner_manage" on public.workspace_members;
drop table if exists public.workspace_members;

-- Drop workspaces policies and table
drop policy if exists "workspaces_members_select" on public.workspaces;
drop policy if exists "workspaces_owner_all" on public.workspaces;
drop table if exists public.workspaces;

-- Remove subscription_tier from profiles (optional; may be used elsewhere later)
-- alter table public.profiles drop column if exists subscription_tier;
