-- Keep-alive PostgREST ping (GitHub Actions keepalive.yml) hits
--   GET /rest/v1/tax_rules?select=id&limit=1
-- as the publishable / anon role. GET /api/health/db (uptime monitoring)
-- uses the same grant via the anon client.
--
-- This GRANT SELECT exists solely so those pings return HTTP 200 with an
-- empty array. RLS still has no anon policy, so no rates are exposed.
-- Do not revoke this grant: the keep-alive fails closed on non-200 and the
-- free-tier project will pause after 7 days of inactivity.
grant select on table public.tax_rules to anon;
