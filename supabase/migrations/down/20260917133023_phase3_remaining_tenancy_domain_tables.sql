-- Down for 20260917133023_phase3_remaining_tenancy_domain_tables.sql
-- Drops only the non-Wave-C tenancy gap tables added by IVA-8.

do $$
declare
  t text;
begin
  foreach t in array ARRAY[
    'tax_calculations',
    'import_batches',
    'documents',
    'nrs_forms',
    'form_filing_statuses',
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
    execute format('drop trigger if exists %I on public.%I', t || '_assign_client_id', t);
    execute format('drop trigger if exists %I on public.%I', 'update_' || t || '_updated_at', t);
  end loop;
end $$;

drop table if exists public.deadline_reminders cascade;
drop table if exists public.filing_audit_logs cascade;
drop table if exists public.form_filing_statuses cascade;
drop table if exists public.filing_deadlines cascade;
drop table if exists public.nrs_forms cascade;
drop table if exists public.tax_calculations cascade;
drop table if exists public.import_batches cascade;
drop table if exists public.documents cascade;
drop table if exists public.categorization_predictions cascade;
drop table if exists public.categorization_feedback cascade;
drop table if exists public.user_learning_profiles cascade;
drop table if exists public.recurring_patterns cascade;
drop table if exists public.data_migration_logs cascade;
drop table if exists public.ml_inference_logs cascade;
drop table if exists public.merchant_categorizations cascade;
drop table if exists public.user_tax_years cascade;

drop function if exists public.assign_client_id_from_user();
drop function if exists public.resolve_default_client_for_user(uuid);
