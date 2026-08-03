-- Phase 2: profiles soft-delete column for account deactivation audit trail.
-- Previously delete-account wrote to public.users (never existed) and silently no-op'd.

alter table public.profiles
  add column if not exists deleted_at timestamptz;

comment on column public.profiles.deleted_at is
  'Set when the account is soft-deleted via /api/auth/delete-account before auth.users hard-delete.';

create index if not exists idx_profiles_deleted_at
  on public.profiles (deleted_at)
  where deleted_at is not null;

-- profiles already exists; keep anon revoked (idempotent)
revoke all on table public.profiles from anon;
