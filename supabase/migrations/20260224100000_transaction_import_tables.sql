-- =========================================
-- TRANSACTION IMPORT SESSION TABLES
-- Supports upload-v2 API: session tracking,
-- parse errors, and duplicate detection.
-- =========================================

-- Import sessions: track each file upload attempt
create table if not exists public.import_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_size bigint,
  bank_code text,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  transactions_imported integer default 0,
  errors_count integer default 0,
  total_amount numeric default 0,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Import errors: row-level parse failures for a session
create table if not exists public.import_errors (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.import_sessions(id) on delete cascade,
  row_number integer,
  error_type text,
  error_message text,
  raw_data jsonb,
  created_at timestamptz default now()
);

-- Duplicate candidates: potential duplicates flagged during import
create table if not exists public.duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.import_sessions(id) on delete cascade,
  existing_transaction_id uuid references public.transactions(id) on delete set null,
  new_transaction_data jsonb not null,
  similarity_score numeric not null,
  match_factors jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

-- RLS
alter table public.import_sessions enable row level security;
alter table public.import_errors enable row level security;
alter table public.duplicate_candidates enable row level security;

-- import_sessions: users see only their own sessions
create policy "import_sessions_owner"
  on public.import_sessions
  for all
  using (user_id = auth.uid());

-- import_errors: users see errors for their own sessions
create policy "import_errors_owner"
  on public.import_errors
  for all
  using (
    session_id in (
      select id from public.import_sessions where user_id = auth.uid()
    )
  );

-- duplicate_candidates: users see candidates for their own sessions
create policy "duplicate_candidates_owner"
  on public.duplicate_candidates
  for all
  using (
    session_id in (
      select id from public.import_sessions where user_id = auth.uid()
    )
  );

-- Indexes for common lookups
create index if not exists idx_import_sessions_user_id
  on public.import_sessions (user_id);

create index if not exists idx_import_errors_session_id
  on public.import_errors (session_id);

create index if not exists idx_duplicate_candidates_session_id
  on public.duplicate_candidates (session_id);
