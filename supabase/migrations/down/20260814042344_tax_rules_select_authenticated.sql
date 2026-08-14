-- Down for 20260814042344_tax_rules_select_authenticated.sql
-- Restores the post-hardening state: authenticated cannot read tax rules,
-- so GET /api/tax-rules and the PIT calculator fail.
revoke select on table public.tax_rules from authenticated;
revoke select on table public.rule_versions from authenticated;
