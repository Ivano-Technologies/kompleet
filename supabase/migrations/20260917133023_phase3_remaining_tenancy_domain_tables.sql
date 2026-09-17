-- Phase 3 (IVA-8): remaining practitioner tenancy domain tables.
-- Scope intentionally excludes Wave C invoicing tables handled in PR #88:
--   - invoice_archives
--   - invoice_audit_logs
--   - user_keys/client_keys
--
-- Every table is client-scoped and protected by accessible_client_ids().
-- Transitional compatibility: a trigger derives client_id from user_id so
-- existing call sites that only send user_id keep working during cutover.

-- ---------------------------------------------------------------------------
-- Helpers for transitional client assignment
-- ---------------------------------------------------------------------------

create or replace function public.resolve_default_client_for_user(p_user_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_client_id uuid;
begin
  if p_user_id is null then
    raise exception 'resolve_default_client_for_user requires p_user_id';
  end if;

  select c.id
    into v_client_id
  from public.clients c
  join public.firm_members fm on fm.firm_id = c.firm_id
  where fm.user_id = p_user_id
    and c.archived_at is null
  order by c.created_at asc
  limit 1;

  if v_client_id is null then
    raise exception 'no accessible client found for user %', p_user_id;
  end if;

  return v_client_id;
end;
$$;

create or replace function public.assign_client_id_from_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.client_id is null then
    if new.user_id is null then
      raise exception 'client_id missing and user_id unavailable for %', tg_table_name;
    end if;
    new.client_id := public.resolve_default_client_for_user(new.user_id);
  end if;
  return new;
end;
$$;

revoke execute on function public.resolve_default_client_for_user(uuid) from anon, public;
revoke execute on function public.assign_client_id_from_user() from anon, public;
grant execute on function public.resolve_default_client_for_user(uuid) to authenticated, service_role;
grant execute on function public.assign_client_id_from_user() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Remaining non-Wave-C Phase 3 tables
-- ---------------------------------------------------------------------------

create table if not exists public.tax_calculations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  tax_type text not null check (tax_type in ('pit', 'cit', 'vat', 'wht')),
  tax_year integer not null check (tax_year between 2000 and 2100),
  calculation_date date not null default current_date,
  input_data jsonb not null default '{}'::jsonb,
  gross_amount numeric(18,2) not null check (gross_amount >= 0),
  deductions numeric(18,2) not null default 0 check (deductions >= 0),
  taxable_amount numeric(18,2) not null check (taxable_amount >= 0),
  tax_due numeric(18,2) not null check (tax_due >= 0),
  effective_rate numeric(5,2) check (effective_rate between 0 and 100),
  breakdown jsonb not null default '{}'::jsonb,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  file_name text not null,
  file_type text not null,
  file_size_bytes bigint,
  bank_name text,
  total_rows integer not null default 0 check (total_rows >= 0),
  imported_count integer not null default 0 check (imported_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'partial')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  document_type text not null check (document_type in ('invoice', 'receipt', 'statement', 'other')),
  file_url text not null,
  status text not null
    check (status in ('queued', 'processing', 'validated', 'completed', 'failed', 'needs_review')),
  idempotency_key text not null,
  confidence_score numeric(5,2),
  structured_data jsonb,
  error_message text,
  processing_started_at timestamptz,
  processing_attempt_count integer not null default 0
    constraint documents_processing_attempt_count_nonnegative check (processing_attempt_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nrs_forms (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  form_type text not null check (form_type in ('PIT', 'CIT', 'VAT')),
  tax_year integer not null check (tax_year between 2000 and 2100),
  form_data jsonb not null default '{}'::jsonb,
  pdf_url text,
  status text not null default 'draft'
    check (status in ('draft', 'generated', 'filed', 'archived')),
  filed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filing_status (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  form_id uuid not null references public.nrs_forms (id) on delete cascade,
  status text not null check (status in ('filed', 'rejected', 'pending', 'draft')),
  filed_date timestamptz,
  confirmation_number text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.filing_audit_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  form_id uuid references public.nrs_forms (id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.filing_deadlines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid references auth.users (id) on delete set null,
  form_type text not null
    check (form_type in ('PIT', 'CIT', 'VAT_Q1', 'VAT_Q2', 'VAT_Q3', 'VAT_Q4')),
  tax_year integer not null check (tax_year between 2000 and 2100),
  deadline_date date not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, form_type, tax_year, deadline_date)
);

create table if not exists public.deadline_reminders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  deadline_id uuid not null references public.filing_deadlines (id) on delete cascade,
  reminder_date date not null,
  sent boolean not null default false,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, user_id, deadline_id, reminder_date)
);

create table if not exists public.categorization_predictions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  transaction_id uuid references public.transactions (id) on delete set null,
  predicted_category text not null,
  confidence numeric(6,4) not null check (confidence between 0 and 1),
  reasoning text,
  alternatives jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.categorization_feedback (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  transaction_id uuid references public.transactions (id) on delete set null,
  original_category text not null,
  corrected_category text not null,
  original_confidence numeric(6,4) not null check (original_confidence between 0 and 1),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_learning_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict unique,
  learning_data jsonb not null default '{}'::jsonb,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_patterns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  merchant_normalized text not null,
  interval_days integer not null check (interval_days > 0),
  amount_mean numeric(18,2) not null,
  amount_stddev numeric(18,2) not null default 0,
  confidence numeric(6,4) not null check (confidence between 0 and 1),
  last_occurrence_date date not null,
  next_expected_date date not null,
  occurrence_count integer not null default 0 check (occurrence_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, user_id, merchant_normalized)
);

create table if not exists public.data_migration_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  source_year integer not null check (source_year between 2000 and 2100),
  target_year integer not null check (target_year between 2000 and 2100),
  migration_type text not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'failed', 'rolled_back')),
  dry_run boolean not null default false,
  options jsonb not null default '{}'::jsonb,
  records_migrated integer not null default 0 check (records_migrated >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.ml_inference_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  inference_id text,
  merchant text,
  amount numeric(18,2),
  predicted_category text,
  model_version text not null,
  provider text,
  input jsonb,
  output jsonb,
  confidence numeric(7,4) check (confidence between 0 and 100),
  latency_ms integer check (latency_ms >= 0),
  success boolean not null default true,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.merchant_categorizations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  merchant_normalized text not null,
  category_name text not null,
  source text not null default 'llm'
    check (source in ('llm', 'rules', 'manual', 'feedback')),
  confidence numeric(6,4) check (confidence between 0 and 1),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, merchant_normalized)
);

create table if not exists public.user_tax_years (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  tax_year integer not null check (tax_year between 2000 and 2100),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, user_id, tax_year)
);

-- ---------------------------------------------------------------------------
-- Transitional trigger wiring for call sites that only send user_id
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array [
    'tax_calculations',
    'import_batches',
    'documents',
    'nrs_forms',
    'filing_status',
    'filing_audit_logs',
    'deadline_reminders',
    'categorization_predictions',
    'categorization_feedback',
    'user_learning_profiles',
    'recurring_patterns',
    'data_migration_logs',
    'ml_inference_logs',
    'merchant_categorizations',
    'user_tax_years'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_assign_client_id', t);
    execute format(
      'create trigger %I before insert on public.%I for each row execute function public.assign_client_id_from_user()',
      t || '_assign_client_id',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_tax_calculations_client_created
  on public.tax_calculations (client_id, created_at desc);
create index if not exists idx_tax_calculations_client_type_year
  on public.tax_calculations (client_id, tax_type, tax_year, created_at desc);
create index if not exists idx_tax_calculations_user_created
  on public.tax_calculations (user_id, created_at desc);

create index if not exists idx_import_batches_client_created
  on public.import_batches (client_id, created_at desc);
create index if not exists idx_import_batches_user_created
  on public.import_batches (user_id, created_at desc);

create index if not exists idx_documents_client_status_updated
  on public.documents (client_id, status, updated_at desc);
create unique index if not exists documents_user_id_idempotency_key_uniq
  on public.documents (user_id, idempotency_key);
create index if not exists documents_status_processing_started_at_idx
  on public.documents (status, processing_started_at);
create index if not exists documents_user_status_updated_idx
  on public.documents (user_id, status, updated_at desc);

create index if not exists idx_nrs_forms_client_created
  on public.nrs_forms (client_id, created_at desc);
create index if not exists idx_nrs_forms_user_year
  on public.nrs_forms (user_id, tax_year, created_at desc);

create index if not exists idx_filing_status_client_form_created
  on public.filing_status (client_id, form_id, created_at desc);
create index if not exists idx_filing_status_user_form_created
  on public.filing_status (user_id, form_id, created_at desc);

create index if not exists idx_filing_audit_logs_client_created
  on public.filing_audit_logs (client_id, created_at desc);
create index if not exists idx_filing_audit_logs_form_created
  on public.filing_audit_logs (form_id, created_at desc);

create index if not exists idx_filing_deadlines_client_date
  on public.filing_deadlines (client_id, deadline_date asc);
create index if not exists idx_filing_deadlines_client_year
  on public.filing_deadlines (client_id, tax_year, form_type);

create index if not exists idx_deadline_reminders_client_date
  on public.deadline_reminders (client_id, reminder_date asc);
create index if not exists idx_deadline_reminders_user_date
  on public.deadline_reminders (user_id, reminder_date asc);

create index if not exists idx_categorization_predictions_client_created
  on public.categorization_predictions (client_id, created_at desc);
create index if not exists idx_categorization_predictions_tx
  on public.categorization_predictions (transaction_id, created_at desc);

create index if not exists idx_categorization_feedback_client_created
  on public.categorization_feedback (client_id, created_at desc);
create index if not exists idx_categorization_feedback_user_created
  on public.categorization_feedback (user_id, created_at desc);

create index if not exists idx_user_learning_profiles_client_user
  on public.user_learning_profiles (client_id, user_id);

create index if not exists idx_recurring_patterns_client_confidence
  on public.recurring_patterns (client_id, confidence desc);
create index if not exists idx_recurring_patterns_user_merchant
  on public.recurring_patterns (user_id, merchant_normalized);

create index if not exists idx_data_migration_logs_client_created
  on public.data_migration_logs (client_id, created_at desc);
create index if not exists idx_data_migration_logs_user_years
  on public.data_migration_logs (user_id, source_year, target_year);

create index if not exists idx_ml_inference_logs_client_created
  on public.ml_inference_logs (client_id, created_at desc);
create index if not exists idx_ml_inference_logs_user_created
  on public.ml_inference_logs (user_id, created_at desc);
create index if not exists idx_ml_inference_logs_inference_id
  on public.ml_inference_logs (inference_id);

create index if not exists idx_merchant_categorizations_client_merchant
  on public.merchant_categorizations (client_id, merchant_normalized);
create index if not exists idx_merchant_categorizations_user_updated
  on public.merchant_categorizations (user_id, updated_at desc);

create index if not exists idx_user_tax_years_client_year
  on public.user_tax_years (client_id, tax_year desc);
create index if not exists idx_user_tax_years_user_year
  on public.user_tax_years (user_id, tax_year desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers (where the column exists)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array [
    'tax_calculations',
    'documents',
    'nrs_forms',
    'filing_deadlines',
    'deadline_reminders',
    'import_batches',
    'recurring_patterns',
    'merchant_categorizations',
    'user_tax_years'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', 'update_' || t || '_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.update_updated_at_column()',
      'update_' || t || '_updated_at',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Grants + RLS + policies (all client-scoped via accessible_client_ids())
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array [
    'tax_calculations',
    'import_batches',
    'documents',
    'nrs_forms',
    'filing_status',
    'filing_audit_logs',
    'filing_deadlines',
    'deadline_reminders',
    'categorization_predictions',
    'categorization_feedback',
    'user_learning_profiles',
    'recurring_patterns',
    'data_migration_logs',
    'ml_inference_logs',
    'merchant_categorizations',
    'user_tax_years'
  ]
  loop
    execute format('revoke all on table public.%I from anon, public', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select_accessible', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_accessible', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_accessible', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_accessible', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (client_id in (select public.accessible_client_ids()))',
      t || '_select_accessible',
      t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (client_id in (select public.accessible_client_ids()))',
      t || '_insert_accessible',
      t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (client_id in (select public.accessible_client_ids())) with check (client_id in (select public.accessible_client_ids()))',
      t || '_update_accessible',
      t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (client_id in (select public.accessible_client_ids()))',
      t || '_delete_accessible',
      t
    );
  end loop;
end $$;
