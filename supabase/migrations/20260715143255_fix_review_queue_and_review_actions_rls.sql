-- 1. Remove always-true INSERT policy on review_queue (writes go through service_role)
drop policy if exists "Allow authenticated users to insert review queue" on public.review_queue;

-- 2. review_actions: RLS enabled but had no policies; make service_role access explicit
create policy "Service role manages review actions"
  on public.review_actions
  as permissive for all
  to service_role
  using (true)
  with check (true);

-- 3. Strip anon privileges from internal review tables
revoke all on table public.review_queue from anon;
revoke all on table public.review_actions from anon;
