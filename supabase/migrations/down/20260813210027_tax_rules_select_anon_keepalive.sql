-- Down for 20260813210027_tax_rules_select_anon_keepalive.sql
-- Revokes the keep-alive PostgREST GRANT SELECT. Applying this down will
-- make keepalive.yml fail closed (non-200) and GET /api/health/db return 503.
revoke select on table public.tax_rules from anon;
