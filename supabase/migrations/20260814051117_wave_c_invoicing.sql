-- Wave C — invoicing tenancy. New: invoice_archives, invoice_audit_logs,
-- client_keys. Modified: invoices + invoice_sequences (+ client_id, policy
-- replacement, sequence re-key). Matching down:
-- supabase/migrations/down/20260814051117_wave_c_invoicing.sql
--
-- §3: existing invoice policies are PERMISSIVE. Adding a client-scoped
-- policy alongside user_id = auth.uid() would OR-widen access. Drop and
-- create in this transaction.

-- ---------------------------------------------------------------------------
-- Sequences: leftover counter rows have no invoices (0 invoice rows).
-- Drop them so we can replace user_id with client_id NOT NULL.
-- ---------------------------------------------------------------------------

delete from public.invoice_sequences;

-- Policy depends on user_id; drop it before dropping the column.
drop policy if exists "Users can manage own invoice sequences" on public.invoice_sequences;

alter table public.invoice_sequences
  add column if not exists client_id uuid references public.clients (id) on delete restrict;

alter table public.invoice_sequences
  drop constraint if exists invoice_sequences_user_year_key;

alter table public.invoice_sequences
  drop column if exists user_id;

alter table public.invoice_sequences
  alter column client_id set not null;

alter table public.invoice_sequences
  add constraint invoice_sequences_client_year_key unique (client_id, tax_year);

create index if not exists idx_invoice_sequences_client_id
  on public.invoice_sequences (client_id);

-- ---------------------------------------------------------------------------
-- invoices.client_id. Table is empty; NOT NULL is safe.
-- ---------------------------------------------------------------------------

alter table public.invoices
  add column if not exists client_id uuid references public.clients (id) on delete restrict;

alter table public.invoices
  alter column client_id set not null;

create index if not exists idx_invoices_client_id
  on public.invoices (client_id);

create index if not exists idx_invoices_client_tax_year
  on public.invoices (client_id, tax_year);

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------

create table public.invoice_archives (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  client_id uuid not null references public.clients (id) on delete restrict,
  archived_by uuid not null references auth.users (id) on delete restrict,
  archived_at timestamptz not null default now(),
  retention_expiry timestamptz not null,
  reason text,
  original_data jsonb not null,
  checksum text not null,
  created_at timestamptz not null default now()
);

create table public.invoice_audit_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.client_keys (
  client_id uuid primary key references public.clients (id) on delete restrict,
  public_key text not null,
  private_key_encrypted text not null,
  key_type text not null default 'RSA-2048',
  created_at timestamptz not null default now()
);

comment on table public.invoice_archives is
  'NRS 7-year invoice snapshots. client_id from birth; ON DELETE RESTRICT.';
comment on table public.invoice_audit_logs is
  'Invoice lifecycle audit. client_id from birth.';
comment on table public.client_keys is
  'Per-client NRS signing keys. Private material is envelope-encrypted in the app (MASTER_ENCRYPTION_KEY). Direct table access revoked from authenticated; use get/upsert_client_signing_keys.';
comment on column public.client_keys.private_key_encrypted is
  'AES-GCM ciphertext from the application. Never store a plaintext private key.';

create index idx_invoice_archives_client_id on public.invoice_archives (client_id);
create index idx_invoice_archives_invoice_id on public.invoice_archives (invoice_id);
create index idx_invoice_audit_logs_client_id on public.invoice_audit_logs (client_id);
create index idx_invoice_audit_logs_invoice_id on public.invoice_audit_logs (invoice_id);

revoke all on table public.invoice_archives from anon, public;
revoke all on table public.invoice_audit_logs from anon, public;
revoke all on table public.client_keys from anon, public;

grant select, insert, update, delete on table public.invoice_archives to authenticated;
grant select, insert on table public.invoice_audit_logs to authenticated;
-- No authenticated DML/SELECT on client_keys — SECURITY DEFINER accessors only.

grant all on table public.invoice_archives to service_role;
grant all on table public.invoice_audit_logs to service_role;
grant all on table public.client_keys to service_role;

-- Existing invoice tables: policy replacement is useless without DML grants.
revoke all on table public.invoices from anon, public;
revoke all on table public.invoice_sequences from anon, public;
grant select, insert, update, delete on table public.invoices to authenticated;
grant select, insert, update, delete on table public.invoice_sequences to authenticated;
grant all on table public.invoices to service_role;
grant all on table public.invoice_sequences to service_role;

alter table public.invoice_archives enable row level security;
alter table public.invoice_audit_logs enable row level security;
alter table public.client_keys enable row level security;

-- ---------------------------------------------------------------------------
-- Policy replacement (same transaction). Drop Clerk leftovers too.
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view own invoices (Clerk)" on public.invoices;
drop policy if exists "Users can insert own invoices (Clerk)" on public.invoices;
drop policy if exists "Users can update own invoices (Clerk)" on public.invoices;
drop policy if exists "Users can delete own draft invoices (Clerk)" on public.invoices;
drop policy if exists "Users can view own invoices" on public.invoices;
drop policy if exists "Users can insert own invoices" on public.invoices;
drop policy if exists "Users can update own invoices" on public.invoices;
drop policy if exists "Users can delete own draft invoices" on public.invoices;
drop policy if exists "Users can manage own invoice sequences" on public.invoice_sequences;

create policy invoices_select_accessible
  on public.invoices for select to authenticated
  using (client_id in (select public.accessible_client_ids()));

create policy invoices_insert_member
  on public.invoices for insert to authenticated
  with check (client_id in (select public.accessible_client_ids()));

create policy invoices_update_member
  on public.invoices for update to authenticated
  using (client_id in (select public.accessible_client_ids()))
  with check (client_id in (select public.accessible_client_ids()));

create policy invoices_delete_draft_member
  on public.invoices for delete to authenticated
  using (
    client_id in (select public.accessible_client_ids())
    and status = 'draft'
  );

create policy invoice_sequences_select_accessible
  on public.invoice_sequences for select to authenticated
  using (client_id in (select public.accessible_client_ids()));

create policy invoice_sequences_insert_member
  on public.invoice_sequences for insert to authenticated
  with check (client_id in (select public.accessible_client_ids()));

create policy invoice_sequences_update_member
  on public.invoice_sequences for update to authenticated
  using (client_id in (select public.accessible_client_ids()))
  with check (client_id in (select public.accessible_client_ids()));

create policy invoice_sequences_delete_member
  on public.invoice_sequences for delete to authenticated
  using (client_id in (select public.accessible_client_ids()));

create policy invoice_archives_select_accessible
  on public.invoice_archives for select to authenticated
  using (client_id in (select public.accessible_client_ids()));

create policy invoice_archives_insert_member
  on public.invoice_archives for insert to authenticated
  with check (client_id in (select public.accessible_client_ids()));

create policy invoice_archives_update_member
  on public.invoice_archives for update to authenticated
  using (client_id in (select public.accessible_client_ids()))
  with check (client_id in (select public.accessible_client_ids()));

create policy invoice_archives_delete_member
  on public.invoice_archives for delete to authenticated
  using (client_id in (select public.accessible_client_ids()));

create policy invoice_audit_logs_select_accessible
  on public.invoice_audit_logs for select to authenticated
  using (client_id in (select public.accessible_client_ids()));

create policy invoice_audit_logs_insert_member
  on public.invoice_audit_logs for insert to authenticated
  with check (client_id in (select public.accessible_client_ids()));

-- ---------------------------------------------------------------------------
-- get_next_invoice_number: same (uuid, integer) identity, now client-scoped.
-- Keep the July identity guard; generalise it. service_role still skips.
-- Parameter rename requires DROP FUNCTION; CREATE OR REPLACE cannot rename args.
-- ---------------------------------------------------------------------------

drop function if exists public.get_next_invoice_number(uuid, integer);

create or replace function public.get_next_invoice_number(
  p_client_id uuid,
  p_tax_year integer
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_seq integer;
  v_invoice_number text;
begin
  if (current_setting('request.jwt.claims', true)::json->>'role') = 'authenticated' then
    if not exists (
      select 1 from public.accessible_client_ids() a where a = p_client_id
    ) then
      raise exception 'permission denied: client not accessible to caller';
    end if;
  end if;

  insert into public.invoice_sequences (client_id, tax_year, last_sequence)
  values (p_client_id, p_tax_year, 1)
  on conflict (client_id, tax_year) do update
    set last_sequence = invoice_sequences.last_sequence + 1,
        updated_at = now()
  returning last_sequence into v_seq;

  v_invoice_number := 'INV-' || p_tax_year::text || '-' || lpad(v_seq::text, 4, '0');
  return v_invoice_number;
end;
$$;

revoke execute on function public.get_next_invoice_number(uuid, integer) from anon, public;
grant execute on function public.get_next_invoice_number(uuid, integer) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- client_keys accessors. Authenticated never reads private_key_encrypted
-- through PostgREST.
-- ---------------------------------------------------------------------------

create or replace function public.get_client_signing_keys(p_client_id uuid)
returns table (
  public_key text,
  private_key_encrypted text,
  key_type text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if (current_setting('request.jwt.claims', true)::json->>'role') = 'authenticated' then
    if not exists (
      select 1 from public.accessible_client_ids() a where a = p_client_id
    ) then
      raise exception 'permission denied: client not accessible to caller';
    end if;
  end if;

  return query
    select k.public_key, k.private_key_encrypted, k.key_type
    from public.client_keys k
    where k.client_id = p_client_id;
end;
$$;

create or replace function public.upsert_client_signing_keys(
  p_client_id uuid,
  p_public_key text,
  p_private_key_encrypted text,
  p_key_type text default 'RSA-2048'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (current_setting('request.jwt.claims', true)::json->>'role') = 'authenticated' then
    if not exists (
      select 1 from public.accessible_client_ids() a where a = p_client_id
    ) then
      raise exception 'permission denied: client not accessible to caller';
    end if;
  end if;

  insert into public.client_keys (
    client_id, public_key, private_key_encrypted, key_type
  ) values (
    p_client_id, p_public_key, p_private_key_encrypted, coalesce(p_key_type, 'RSA-2048')
  )
  on conflict (client_id) do update
    set public_key = excluded.public_key,
        private_key_encrypted = excluded.private_key_encrypted,
        key_type = excluded.key_type;
end;
$$;

revoke execute on function public.get_client_signing_keys(uuid) from anon, public;
revoke execute on function public.upsert_client_signing_keys(uuid, text, text, text) from anon, public;
grant execute on function public.get_client_signing_keys(uuid) to authenticated, service_role;
grant execute on function public.upsert_client_signing_keys(uuid, text, text, text) to authenticated, service_role;
