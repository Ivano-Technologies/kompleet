-- Down for 20260814051117_wave_c_invoicing.sql
-- Restores user_id-scoped invoice policies and the (uuid, integer)
-- get_next_invoice_number identity-guarded against p_user_id.

drop function if exists public.upsert_client_signing_keys(uuid, text, text, text);
drop function if exists public.get_client_signing_keys(uuid);

drop table if exists public.invoice_audit_logs;
drop table if exists public.invoice_archives;
drop table if exists public.client_keys;

drop policy if exists invoices_select_accessible on public.invoices;
drop policy if exists invoices_insert_member on public.invoices;
drop policy if exists invoices_update_member on public.invoices;
drop policy if exists invoices_delete_draft_member on public.invoices;
drop policy if exists invoice_sequences_select_accessible on public.invoice_sequences;
drop policy if exists invoice_sequences_insert_member on public.invoice_sequences;
drop policy if exists invoice_sequences_update_member on public.invoice_sequences;
drop policy if exists invoice_sequences_delete_member on public.invoice_sequences;

drop index if exists idx_invoices_client_tax_year;
drop index if exists idx_invoices_client_id;

alter table public.invoices drop column if exists client_id;

create policy "Users can view own invoices"
  on public.invoices as permissive for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own invoices"
  on public.invoices as permissive for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own invoices"
  on public.invoices as permissive for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own draft invoices"
  on public.invoices as permissive for delete to authenticated
  using (user_id = auth.uid() and status = 'draft');

delete from public.invoice_sequences;

drop index if exists idx_invoice_sequences_client_id;
alter table public.invoice_sequences
  drop constraint if exists invoice_sequences_client_year_key;
alter table public.invoice_sequences
  drop column if exists client_id;

alter table public.invoice_sequences
  add column user_id uuid not null references public.profiles (id) on delete cascade;

alter table public.invoice_sequences
  add constraint invoice_sequences_user_year_key unique (user_id, tax_year);

create policy "Users can manage own invoice sequences"
  on public.invoice_sequences as permissive for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop function if exists public.get_next_invoice_number(uuid, integer);

create or replace function public.get_next_invoice_number(
  p_user_id uuid,
  p_tax_year integer
)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_seq integer;
  v_invoice_number text;
  v_caller uuid;
begin
  if (current_setting('request.jwt.claims', true)::json->>'role') = 'authenticated' then
    v_caller := public.get_current_user_id();
    if v_caller is null or v_caller <> p_user_id then
      raise exception 'permission denied: p_user_id does not match caller identity';
    end if;
  end if;

  insert into public.invoice_sequences (user_id, tax_year, last_sequence)
  values (p_user_id, p_tax_year, 1)
  on conflict (user_id, tax_year) do update
    set last_sequence = invoice_sequences.last_sequence + 1,
        updated_at = now()
  returning last_sequence into v_seq;

  v_invoice_number := 'INV-' || p_tax_year::text || '-' || lpad(v_seq::text, 4, '0');
  return v_invoice_number;
end;
$function$;

revoke execute on function public.get_next_invoice_number(uuid, integer) from anon, public;
grant execute on function public.get_next_invoice_number(uuid, integer) to authenticated, service_role;
