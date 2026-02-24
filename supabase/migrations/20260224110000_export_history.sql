-- =========================================
-- EXPORT HISTORY TABLE
-- Tracks all data exports for audit and NDPR compliance.
-- =========================================

create table if not exists public.export_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  export_type text not null, -- 'transactions', 'statements', 'bulk'
  format text,               -- 'csv', 'excel', 'pdf', 'zip', 'word'
  tax_year integer,
  status text not null default 'complete'
    check (status in ('pending', 'complete', 'failed')),
  file_size bigint default 0,
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.export_history enable row level security;

create policy "export_history_owner"
  on public.export_history
  for all
  using (user_id = auth.uid());

create index if not exists idx_export_history_user_id
  on public.export_history (user_id, created_at desc);
