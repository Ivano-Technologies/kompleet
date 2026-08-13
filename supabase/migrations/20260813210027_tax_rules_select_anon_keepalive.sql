-- Keep-alive GET /api/health/db uses the anon client against tax_rules.
-- Anon had no SELECT, so PostgREST returned an error and the ping was 503.
-- RLS still has no anon policy, so the round-trip succeeds with 0 rows and
-- does not expose rates.
grant select on table public.tax_rules to anon;
