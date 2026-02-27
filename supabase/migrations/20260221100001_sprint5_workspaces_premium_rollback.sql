-- =========================================
-- Sprint 5 rollback: Remove workspaces, premium tier, workspace_id on expenses.
-- Reverts 20260221100000_sprint5_workspaces_premium.sql
-- =========================================

-- 1. Drop any FK from expenses to workspaces (dynamic: handles differing constraint names)
do $$
declare
  r record;
begin
  for r in (
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    join pg_class ref on c.confrelid = ref.oid
    where n.nspname = 'public' and t.relname = 'expenses'
      and ref.relname = 'workspaces' and c.contype = 'f'
  ) loop
    execute format('alter table public.expenses drop constraint if exists %I', r.conname);
  end loop;
end $$;

-- 2. Drop workspace_id column from expenses (idempotent)
alter table public.expenses drop column if exists workspace_id;

-- 3. Drop RLS policies (only if tables exist)
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'workspaces') then
    drop policy if exists "workspaces_owner_all" on public.workspaces;
    drop policy if exists "workspaces_members_select" on public.workspaces;
  end if;
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'workspace_members') then
    drop policy if exists "workspace_members_owner_manage" on public.workspace_members;
    drop policy if exists "workspace_members_select" on public.workspace_members;
  end if;
end $$;

-- 4. Drop tables (members first due to FK to workspaces)
drop table if exists public.workspace_members;
drop table if exists public.workspaces;

-- 5. Remove subscription_tier from profiles
alter table public.profiles drop column if exists subscription_tier;
