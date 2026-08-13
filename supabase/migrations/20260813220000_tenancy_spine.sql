-- Wave A tenancy spine. Additive only: firms, firm_members, clients, and two
-- SECURITY DEFINER helpers. No client_assignments, no viewer role, no domain
-- tables. Matching down: supabase/migrations/down/20260813220000_tenancy_spine.sql
-- (subdirectory so `supabase start` does not apply it as a forward migration).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users (id) on delete restrict,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'starter', 'professional', 'enterprise')),
  created_at timestamptz not null default now()
);

create table public.firm_members (
  firm_id uuid not null references public.firms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  primary key (firm_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  legal_name text not null,
  tin text,
  rc_number text,
  entity_type text check (entity_type in ('individual', 'company')),
  fiscal_year_start date,
  address text,
  status text not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.firms is
  'Practice / firm. owner_user_id ON DELETE RESTRICT so deleting an owner cannot cascade-wipe the firm.';
comment on table public.firm_members is
  'Membership. role is owner|staff only; viewer is deferred.';
comment on table public.clients is
  'Taxable entity served by a firm. firm_id ON DELETE RESTRICT so firm deletion cannot cascade-delete statutory records.';
comment on column public.clients.archived_at is
  'When set, accessible_client_ids() excludes the row. TIN/RC stay on profiles until the §9 ASK is answered.';

create index idx_firms_owner_user_id on public.firms (owner_user_id);
create index idx_firm_members_user_id on public.firm_members (user_id);
create index idx_clients_firm_id on public.clients (firm_id);

-- ---------------------------------------------------------------------------
-- Grants: new tables are not on the 20260715144130 hardcoded revoke list
-- ---------------------------------------------------------------------------

revoke all on table public.firms from anon, public;
revoke all on table public.firm_members from anon, public;
revoke all on table public.clients from anon, public;

grant select, insert, update, delete on table public.firms to authenticated;
grant select, insert, update, delete on table public.firm_members to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;

grant all on table public.firms to service_role;
grant all on table public.firm_members to service_role;
grant all on table public.clients to service_role;

alter table public.firms enable row level security;
alter table public.firm_members enable row level security;
alter table public.clients enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers. SECURITY DEFINER avoids RLS recursion; STABLE + in (select …)
-- lets the planner evaluate once per statement as an InitPlan.
-- ---------------------------------------------------------------------------

create or replace function public.my_firm_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select fm.firm_id
  from public.firm_members fm
  where fm.user_id = auth.uid()
$$;

create or replace function public.accessible_client_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.id
  from public.clients c
  join public.firm_members fm on fm.firm_id = c.firm_id
  where fm.user_id = auth.uid()
    and c.archived_at is null
$$;

revoke execute on function public.my_firm_ids() from anon, public;
revoke execute on function public.accessible_client_ids() from anon, public;
grant execute on function public.my_firm_ids() to authenticated, service_role;
grant execute on function public.accessible_client_ids() to authenticated, service_role;

-- Bootstrap: inserting a firm must create the owner membership before
-- my_firm_ids() would return the new id. SECURITY DEFINER bypasses RLS.
create or replace function public.firms_after_insert_add_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.firm_members (firm_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner');
  return new;
end;
$$;

revoke all on function public.firms_after_insert_add_owner() from public, anon, authenticated;

create trigger firms_after_insert_add_owner
  after insert on public.firms
  for each row execute function public.firms_after_insert_add_owner();

-- ---------------------------------------------------------------------------
-- Policies. Subquery form, not correlated EXISTS. Any member may write
-- (no viewer role yet).
-- ---------------------------------------------------------------------------

create policy firms_select_member
  on public.firms
  for select
  to authenticated
  using (id in (select public.my_firm_ids()));

create policy firms_insert_as_owner
  on public.firms
  for insert
  to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy firms_update_member
  on public.firms
  for update
  to authenticated
  using (id in (select public.my_firm_ids()))
  with check (id in (select public.my_firm_ids()));

create policy firms_delete_member
  on public.firms
  for delete
  to authenticated
  using (id in (select public.my_firm_ids()));

create policy firm_members_select_member
  on public.firm_members
  for select
  to authenticated
  using (firm_id in (select public.my_firm_ids()));

create policy firm_members_insert_member
  on public.firm_members
  for insert
  to authenticated
  with check (firm_id in (select public.my_firm_ids()));

create policy firm_members_update_member
  on public.firm_members
  for update
  to authenticated
  using (firm_id in (select public.my_firm_ids()))
  with check (firm_id in (select public.my_firm_ids()));

create policy firm_members_delete_member
  on public.firm_members
  for delete
  to authenticated
  using (firm_id in (select public.my_firm_ids()));

create policy clients_select_accessible
  on public.clients
  for select
  to authenticated
  using (id in (select public.accessible_client_ids()));

-- INSERT cannot use accessible_client_ids() (the row does not exist yet).
create policy clients_insert_member
  on public.clients
  for insert
  to authenticated
  with check (firm_id in (select public.my_firm_ids()));

create policy clients_update_member
  on public.clients
  for update
  to authenticated
  using (firm_id in (select public.my_firm_ids()))
  with check (firm_id in (select public.my_firm_ids()));

create policy clients_delete_member
  on public.clients
  for delete
  to authenticated
  using (firm_id in (select public.my_firm_ids()));
