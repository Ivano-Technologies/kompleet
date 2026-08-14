-- Security hardening (20260219051749) revoked SELECT on all public tables
-- from authenticated, then re-granted only profiles/transactions/categories/
-- bank_configs/audit_logs/clerk_users. tax_rules and rule_versions kept their
-- "Allow authenticated users to read …" RLS policies (USING true) but lost the
-- table GRANT, so GET /api/tax-rules fails with:
--   permission denied for table rule_versions
-- and the PIT calculator stays on "Rules Unavailable".
--
-- Anon SELECT on tax_rules remains the keep-alive ping only (20260813210027);
-- there is still no anon RLS policy, so anon sees [] . Do not grant anon
-- SELECT on rule_versions.

grant select on table public.tax_rules to authenticated;
grant select on table public.rule_versions to authenticated;
