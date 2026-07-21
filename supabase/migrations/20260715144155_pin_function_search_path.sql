-- Pin search_path on all functions flagged by lint 0011 (same pattern as get_tax_year_summary)
alter function public.activate_rule_version(uuid) set search_path = public, pg_temp;
alter function public.expenses_updated_at() set search_path = public, pg_temp;
alter function public.get_active_rule_version() set search_path = public, pg_temp;
alter function public.get_clerk_user_id() set search_path = public, pg_temp;
alter function public.get_current_user_id() set search_path = public, pg_temp;
alter function public.get_next_invoice_number(uuid, integer) set search_path = public, pg_temp;
alter function public.log_tax_calculation(uuid, text, jsonb, jsonb, inet, text) set search_path = public, pg_temp;
alter function public.update_tax_reports_updated_at() set search_path = public, pg_temp;
alter function public.update_updated_at_column() set search_path = public, pg_temp;
