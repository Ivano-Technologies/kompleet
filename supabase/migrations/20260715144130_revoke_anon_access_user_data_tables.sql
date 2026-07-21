-- Close GraphQL/REST anon exposure: these tables must not be discoverable or touchable pre-sign-in.
-- App auth is Clerk -> requests from signed-in users run as `authenticated`, so anon needs nothing here.
revoke all on table public.duplicate_candidates from anon;
revoke all on table public.expense_categories from anon;
revoke all on table public.expense_reports from anon;
revoke all on table public.expenses from anon;
revoke all on table public.export_history from anon;
revoke all on table public.import_errors from anon;
revoke all on table public.import_sessions from anon;
revoke all on table public.invoice_sequences from anon;
revoke all on table public.ndpr_consents from anon;
