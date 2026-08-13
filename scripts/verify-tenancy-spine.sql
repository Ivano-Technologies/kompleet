-- Local Wave A smoke. Run against local Postgres after the up migration.
-- Not a substitute for the Wave B JWT negative suite.
--
-- Usage (after `pnpm supabase start`):
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f scripts/verify-tenancy-spine.sql

do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'firms') then
    raise exception 'missing table public.firms';
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'firm_members') then
    raise exception 'missing table public.firm_members';
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'clients') then
    raise exception 'missing table public.clients';
  end if;
end $$;

do $$
declare
  anon_firms boolean;
  anon_members boolean;
  anon_clients boolean;
  anon_my_firms boolean;
  anon_clients_fn boolean;
begin
  select has_table_privilege('anon', 'public.firms', 'select') into anon_firms;
  select has_table_privilege('anon', 'public.firm_members', 'select') into anon_members;
  select has_table_privilege('anon', 'public.clients', 'select') into anon_clients;
  select has_function_privilege('anon', 'public.my_firm_ids()', 'execute') into anon_my_firms;
  select has_function_privilege('anon', 'public.accessible_client_ids()', 'execute') into anon_clients_fn;

  if anon_firms or anon_members or anon_clients then
    raise exception 'anon still has table privilege (firms=%, members=%, clients=%)', anon_firms, anon_members, anon_clients;
  end if;
  if anon_my_firms or anon_clients_fn then
    raise exception 'anon can execute helpers (my_firm_ids=%, accessible_client_ids=%)', anon_my_firms, anon_clients_fn;
  end if;
end $$;

do $$
declare
  pol text;
begin
  for pol in
    select polname
    from pg_policy
    where polrelid in ('public.firms'::regclass, 'public.firm_members'::regclass, 'public.clients'::regclass)
      and pg_get_expr(polqual, polrelid) like '%exists%'
  loop
    raise exception 'correlated EXISTS policy on tenancy table: %', pol;
  end loop;
end $$;

select 'wave-a-ok' as status;
