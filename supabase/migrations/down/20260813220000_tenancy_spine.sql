-- Down for 20260813220000_tenancy_spine.sql
-- Do not place this file in supabase/migrations/*.sql — the CLI would apply it
-- as a forward migration (see 20260221100001_sprint5_workspaces_premium_rollback.sql).
--
-- Drop tables first so policies that depend on the helpers go away, then
-- drop the functions. DROP FUNCTION without CASCADE fails while those
-- policies exist.

drop table if exists public.clients;
drop table if exists public.firm_members;
drop table if exists public.firms;
drop function if exists public.firms_after_insert_add_owner();
drop function if exists public.accessible_client_ids();
drop function if exists public.my_firm_ids();
