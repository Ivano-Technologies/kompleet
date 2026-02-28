-- Seed default regulatory sources so Admin > Regulatory Sources shows data.
-- Also allow anon to SELECT so server-side rules engine (anon client) can read sources.

-- Allow public read of regulatory sources (reference data)
DROP POLICY IF EXISTS "Allow anon to read sources" ON public.sources;
CREATE POLICY "Allow anon to read sources"
  ON public.sources
  AS PERMISSIVE
  FOR SELECT
  TO anon
  USING (true);

-- Seed default Nigerian tax regulatory sources (idempotent: only insert if table is empty)
INSERT INTO public.sources (id, name, type, url, description, check_frequency_days, created_at, updated_at)
SELECT v.id, v.name, v.type, v.url, v.description, v.check_frequency_days, v.created_at, v.updated_at
FROM (VALUES
  ('a0000001-0001-4000-8000-000000000001'::uuid, 'Nigeria Tax Act 2025', 'primary', 'https://www.firs.gov.ng', 'Primary legislation and official NRS/FIRS guidance for Nigerian tax compliance.', 30, now(), now()),
  ('a0000001-0001-4000-8000-000000000002'::uuid, 'FIRS (Federal Inland Revenue Service)', 'primary', 'https://www.firs.gov.ng', 'Federal tax authority; official rates, deadlines, and filing guidelines.', 30, now(), now()),
  ('a0000001-0001-4000-8000-000000000003'::uuid, 'LIRS (Lagos State Internal Revenue Service)', 'primary', 'https://lirs.gov.ng', 'Lagos state tax rules and PIT/VAT guidance for Lagos businesses.', 30, now(), now()),
  ('a0000001-0001-4000-8000-000000000004'::uuid, 'NRS Circulars and Guidelines', 'secondary', 'https://www.firs.gov.ng/Resources', 'Revenue service circulars and administrative guidelines.', 60, now(), now())
) AS v(id, name, type, url, description, check_frequency_days, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM public.sources LIMIT 1);
