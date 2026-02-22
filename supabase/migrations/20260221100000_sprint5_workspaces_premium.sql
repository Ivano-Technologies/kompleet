-- =========================================
-- Sprint 5: Workspaces, Premium (subscription_tier), optional workspace_id on expenses.
-- Additive only. Reversible via 20260221100001_sprint5_workspaces_premium_rollback.sql
-- =========================================

-- Premium: subscription_tier on profiles (free | premium)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'subscription_tier'
  ) then
    alter table public.profiles add column subscription_tier text default 'free' check (subscription_tier in ('free', 'premium'));
  end if;
end $$;

-- Workspaces (team workspace)
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workspace members (viewer | editor)
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer', 'editor')),
  created_at timestamptz default now(),
  unique (workspace_id, user_id)
);

-- Optional workspace_id on expenses (for team expenses)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'workspace_id'
  ) then
    alter table public.expenses add column workspace_id uuid references public.workspaces(id) on delete set null;
  end if;
end $$;

-- RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Workspaces: owner can do all; members can select
create policy "workspaces_owner_all"
  on public.workspaces for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "workspaces_members_select"
  on public.workspaces for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id and wm.user_id = auth.uid()
    )
  );

-- Workspace members: only owner can insert/update/delete; members can select
create policy "workspace_members_owner_manage"
  on public.workspace_members for all
  to authenticated
  using (
    exists (select 1 from public.workspaces w where w.id = workspace_members.workspace_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workspaces w where w.id = workspace_members.workspace_id and w.owner_id = auth.uid())
  );

create policy "workspace_members_select"
  on public.workspace_members for select
  to authenticated
  using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
    or exists (select 1 from public.workspaces w where w.id = workspace_members.workspace_id and w.owner_id = auth.uid())
  );

-- Grants
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;

-- Seed Mileage category (Sprint 5) if not exists
insert into public.expense_categories (user_id, name, is_custom)
select null, 'Mileage', false
where not exists (
  select 1 from public.expense_categories c where c.user_id is null and c.name = 'Mileage'
);
