# Rollback migrations

Files in this directory are **downs**. They are not applied by `pnpm supabase start` or `supabase db reset`.

The CLI applies every `supabase/migrations/*.sql` as a forward migration, including names that say rollback. `20260221100001_sprint5_workspaces_premium_rollback.sql` was applied to production that way.

Workflow: apply the matching `up` locally → run this `down` against local Postgres → re-apply the `up` → then `apply_migration` the `up` to production.
