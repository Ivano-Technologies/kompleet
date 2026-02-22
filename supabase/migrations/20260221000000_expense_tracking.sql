-- =========================================
-- EXPENSE TRACKING & RECEIPT OCR (Sprint 1)
-- Additive only: new tables, no changes to existing.
-- Uses auth.uid() for RLS (Clerk JWT maps to same user).
-- =========================================

-- Expense categories (separate from public.categories used for bank transactions)
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  is_custom boolean default true,
  created_at timestamptz default now(),
  unique (user_id, name)
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount numeric not null,
  currency text default 'NGN',
  category_id uuid references public.expense_categories(id) on delete set null,
  vendor text,
  vat_amount numeric default 0,
  receipt_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  synced_at timestamptz
);

-- Expense reports (export requests)
create table if not exists public.expense_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  format text check (format in ('pdf','csv','excel')),
  created_at timestamptz default now()
);

-- NDPR consent (scan + cloud sync)
create table if not exists public.ndpr_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_scan boolean default false,
  consent_cloud_sync boolean default false,
  consent_timestamp timestamptz default now()
);

-- RLS
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_reports enable row level security;
alter table public.ndpr_consents enable row level security;

-- Expense categories: view system (user_id null) + own custom
create policy "expense_categories_select"
  on public.expense_categories for select
  to authenticated
  using (auth.uid() = user_id or user_id is null);

create policy "expense_categories_insert"
  on public.expense_categories for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "expense_categories_update"
  on public.expense_categories for update
  to authenticated
  using (auth.uid() = user_id);

create policy "expense_categories_delete"
  on public.expense_categories for delete
  to authenticated
  using (auth.uid() = user_id);

-- Expenses: full CRUD own rows
create policy "expenses_select"
  on public.expenses for select
  to authenticated
  using (auth.uid() = user_id);

create policy "expenses_insert"
  on public.expenses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "expenses_update"
  on public.expenses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "expenses_delete"
  on public.expenses for delete
  to authenticated
  using (auth.uid() = user_id);

-- Expense reports: own only
create policy "expense_reports_all"
  on public.expense_reports for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- NDPR consents: own only
create policy "ndpr_consents_all"
  on public.ndpr_consents for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Grants (match existing pattern)
grant select, insert, update, delete on public.expense_categories to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.expense_reports to authenticated;
grant select, insert, update, delete on public.ndpr_consents to authenticated;
grant select on all tables in schema public to service_role;

-- updated_at trigger for expenses
create or replace function public.expenses_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_expenses_updated_at on public.expenses;
create trigger update_expenses_updated_at
  before update on public.expenses
  for each row execute function public.expenses_updated_at();

-- Seed Nigerian default expense categories (user_id null = system)
insert into public.expense_categories (user_id, name, is_custom)
select v.user_id, v.name, false
from (values
  (null::uuid, 'Transport (Okada/Fuel)'),
  (null, 'Airtime/Data'),
  (null, 'Market/Inventory'),
  (null, 'VAT (7.5%)'),
  (null, 'Utilities'),
  (null, 'Logistics'),
  (null, 'Office Supplies')
) as v(user_id, name)
where not exists (
  select 1 from public.expense_categories c
  where c.user_id is not distinct from v.user_id and c.name = v.name
);

-- Storage: receipts bucket. Create bucket "receipts" (private) in Supabase Dashboard if not exists. Path: {user_id}/{uuid}.jpg
create policy "Users can upload receipts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view receipts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own receipts"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own receipts"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );
