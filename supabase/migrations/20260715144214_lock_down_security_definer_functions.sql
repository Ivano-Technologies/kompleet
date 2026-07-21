-- App-callable RPCs: keep authenticated + service_role, drop anon/PUBLIC
revoke execute on function public.bulk_insert_transactions(jsonb) from anon, public;
revoke execute on function public.get_clerk_user_id() from anon, public;
revoke execute on function public.get_current_user_id() from anon, public;
revoke execute on function public.get_next_invoice_number(uuid, integer) from anon, public;
revoke execute on function public.get_tax_year_summary(uuid, integer) from anon, public;
revoke execute on function public.log_audit_event(uuid, text, text, uuid, jsonb, jsonb) from anon, public;
grant execute on function public.bulk_insert_transactions(jsonb) to authenticated, service_role;
grant execute on function public.get_clerk_user_id() to authenticated, service_role;
grant execute on function public.get_current_user_id() to authenticated, service_role;
grant execute on function public.get_next_invoice_number(uuid, integer) to authenticated, service_role;
grant execute on function public.get_tax_year_summary(uuid, integer) to authenticated, service_role;
grant execute on function public.log_audit_event(uuid, text, text, uuid, jsonb, jsonb) to authenticated, service_role;

-- Trigger/internal functions: nobody should call these via the API at all
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
