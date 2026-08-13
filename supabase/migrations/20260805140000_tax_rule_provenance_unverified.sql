-- ============================================================================
-- PR 3a: Tax Rule Provenance — Unverified Candidate Rates
-- ============================================================================
-- Purpose: Surface conflicting/unverified VAT and business-tax figures as
-- first-class, reviewable rows instead of hardcoded service-layer constants.
-- Nothing seeded here is asserted as correct: every rule below is inserted at
-- confidence_level = 'unverified' on a separate, INACTIVE rule_version, and a
-- review_queue item flags the VAT threshold conflict for human review.
--
-- See docs/TAX_RULE_PROVENANCE.md for the full provenance architecture.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Widen confidence_level check to allow 'unverified' and 'verified'
-- ----------------------------------------------------------------------------
alter table "public"."tax_rules" drop constraint if exists "tax_rules_confidence_level_check";
alter table "public"."tax_rules"
  add constraint "tax_rules_confidence_level_check"
  check ((confidence_level = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text, 'unverified'::text, 'verified'::text])))
  not valid;
alter table "public"."tax_rules" validate constraint "tax_rules_confidence_level_check";

-- ----------------------------------------------------------------------------
-- 2-7. Sources, rule_version, tax_rules, review_queue (idempotent)
-- ----------------------------------------------------------------------------
do $$
declare
  v_nta_id uuid;
  v_ntaa_id uuid;
  v_finance_act_id uuid;
  v_pwc_id uuid;
  v_version_id uuid;
  v_existing_version_id uuid;
begin
  -- ==========================================================================
  -- Sources — reuse by name if already present, else insert with a fixed id.
  -- ==========================================================================
  select id into v_nta_id from public.sources where name = 'Nigeria Tax Act 2025' limit 1;
  if v_nta_id is null then
    v_nta_id := 'b1000002-0002-4000-8000-000000000001'::uuid;
    insert into public.sources (id, name, type, url, description, check_frequency_days, created_at, updated_at)
    values (
      v_nta_id,
      'Nigeria Tax Act 2025',
      'primary',
      'https://www.firs.gov.ng',
      'Primary legislation (Nigeria Tax Act 2025) effective January 1, 2026.',
      30,
      now(),
      now()
    );
  end if;

  select id into v_ntaa_id from public.sources where name = 'Nigeria Tax Administration Act 2025' limit 1;
  if v_ntaa_id is null then
    v_ntaa_id := 'b1000002-0002-4000-8000-000000000002'::uuid;
    insert into public.sources (id, name, type, url, description, check_frequency_days, created_at, updated_at)
    values (
      v_ntaa_id,
      'Nigeria Tax Administration Act 2025',
      'primary',
      'https://www.firs.gov.ng',
      'Companion administration act governing registration, filing and enforcement procedure under the Nigeria Tax Act 2025.',
      30,
      now(),
      now()
    );
  end if;

  select id into v_finance_act_id from public.sources where name = 'Finance Act (legacy VAT)' limit 1;
  if v_finance_act_id is null then
    v_finance_act_id := 'b1000002-0002-4000-8000-000000000003'::uuid;
    insert into public.sources (id, name, type, url, description, check_frequency_days, created_at, updated_at)
    values (
      v_finance_act_id,
      'Finance Act (legacy VAT)',
      'primary',
      'https://www.firs.gov.ng',
      'Pre-2026 Finance Act VAT provisions, including the historical NGN 25,000,000 VAT registration threshold. Superseded by the Nigeria Tax Act 2025; retained here as an unverified candidate reading pending reconciliation.',
      365,
      now(),
      now()
    );
  end if;

  select id into v_pwc_id from public.sources where name = 'PwC Nigeria Tax Updates' or id = '80f72571-0000-4000-8000-000000000000'::uuid limit 1;
  if v_pwc_id is null then
    v_pwc_id := '80f72571-0000-4000-8000-000000000000'::uuid;
    insert into public.sources (id, name, type, url, description, check_frequency_days, created_at, updated_at)
    values (
      v_pwc_id,
      'PwC Nigeria Tax Updates',
      'secondary',
      'https://www.pwc.com/ng',
      'PwC Nigeria professional commentary on the Nigeria Tax Act 2025; secondary-source candidate reading pending primary-source confirmation.',
      60,
      now(),
      now()
    );
  end if;

  -- ==========================================================================
  -- Rule version — unverified candidate set, inactive, unapproved.
  -- ==========================================================================
  select id into v_existing_version_id from public.rule_versions where version_number = 'v1.1.0-unverified-candidates' limit 1;
  if v_existing_version_id is null then
    v_version_id := gen_random_uuid();
    insert into public.rule_versions (
      id, version_number, description, effective_from, effective_to,
      is_active, approved_by, approved_at, created_by, created_at, updated_at
    )
    values (
      v_version_id,
      'v1.1.0-unverified-candidates',
      'Unverified candidate rates surfaced for human review: three mutually exclusive VAT registration/small-business-exemption thresholds, plus split minimum-ETR / very-large-company figures and a bare VAT zero-rate. Not active; not approved. See docs/TAX_RULE_PROVENANCE.md.',
      '2026-01-01T00:00:00Z'::timestamptz,
      null,
      false,
      null,
      null,
      null,
      now(),
      now()
    );
  else
    v_version_id := v_existing_version_id;
  end if;

  -- ==========================================================================
  -- VAT registration / small-business-exemption threshold candidates
  -- (mutually exclusive — see review_queue item below)
  -- ==========================================================================
  insert into public.tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
  select v_version_id, v_finance_act_id, 'vat', 'registration_threshold_legacy_25m',
    '{"threshold": 25000000, "currency": "NGN", "operator": ">=", "outcome": "registration_required"}'::jsonb,
    'unverified', now(),
    'Candidate 1 of 3 (MUTUALLY EXCLUSIVE with vat.small_business_exemption_100m and vat.small_business_exemption_50m): legacy Finance Act VAT registration threshold of NGN 25,000,000. Superseded reading pending confirmation against Nigeria Tax Act 2025 primary text. Do NOT use to assert registration/exemption status — see review_queue.'
  where not exists (
    select 1 from public.tax_rules where rule_version_id = v_version_id and rule_key = 'registration_threshold_legacy_25m'
  );

  insert into public.tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
  select v_version_id, v_nta_id, 'vat', 'small_business_exemption_100m',
    '{"threshold": 100000000, "currency": "NGN", "operator": "<", "outcome": "exempt"}'::jsonb,
    'unverified', now(),
    'Candidate 2 of 3 (MUTUALLY EXCLUSIVE with vat.registration_threshold_legacy_25m and vat.small_business_exemption_50m): matches the currently active vat.small_business_exemption_turnover reading of NGN 100,000,000, but the underlying Act citation for this figure is unclear/unconfirmed. Re-seeded here as unverified pending source confirmation. Do NOT use to assert registration/exemption status — see review_queue.'
  where not exists (
    select 1 from public.tax_rules where rule_version_id = v_version_id and rule_key = 'small_business_exemption_100m'
  );

  insert into public.tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
  select v_version_id, v_pwc_id, 'vat', 'small_business_exemption_50m',
    '{"threshold": 50000000, "currency": "NGN", "operator": "<", "outcome": "exempt"}'::jsonb,
    'unverified', now(),
    'Candidate 3 of 3 (MUTUALLY EXCLUSIVE with vat.registration_threshold_legacy_25m and vat.small_business_exemption_100m): PwC Nigeria Tax Updates reading of NGN 50,000,000 small-business VAT exemption threshold, conflicting with the NGN 100,000,000 figure elsewhere in this table. Do NOT use to assert registration/exemption status — see review_queue.'
  where not exists (
    select 1 from public.tax_rules where rule_version_id = v_version_id and rule_key = 'small_business_exemption_50m'
  );

  -- Companion total-assets thresholds for the 50m/100m turnover candidates
  -- (both currently read NGN 250,000,000 — same as the active seed's assets test).
  insert into public.tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
  select v_version_id, v_nta_id, 'vat', 'small_business_exemption_assets_for_100m',
    '{"threshold": 250000000, "currency": "NGN", "operator": "<"}'::jsonb,
    'unverified', now(),
    'Companion total-assets threshold for the NGN 100,000,000 turnover candidate (vat.small_business_exemption_100m). Both criteria must be met under this reading. Unverified pending source confirmation.'
  where not exists (
    select 1 from public.tax_rules where rule_version_id = v_version_id and rule_key = 'small_business_exemption_assets_for_100m'
  );

  insert into public.tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
  select v_version_id, v_pwc_id, 'vat', 'small_business_exemption_assets_for_50m',
    '{"threshold": 250000000, "currency": "NGN", "operator": "<"}'::jsonb,
    'unverified', now(),
    'Companion total-assets threshold for the PwC NGN 50,000,000 turnover candidate (vat.small_business_exemption_50m). Both criteria must be met under this reading. Unverified pending source confirmation.'
  where not exists (
    select 1 from public.tax_rules where rule_version_id = v_version_id and rule_key = 'small_business_exemption_assets_for_50m'
  );

  -- ==========================================================================
  -- vat.zero_rate — unverified RATE ONLY. No zero-rated goods/services
  -- schedule is seeded anywhere in this migration: no Act schedule citation is
  -- available, so category-based zero-rating determination stays unavailable
  -- (VATService.determineVATTreatment throws for any category it cannot
  -- verify — see src/lib/services/vat-service.ts).
  -- ==========================================================================
  insert into public.tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
  select v_version_id, v_nta_id, 'vat', 'zero_rate',
    '{"rate": 0, "unit": "percentage"}'::jsonb,
    'unverified', now(),
    'Zero-rate VAT figure only. The zero-rated goods/services schedule itself is NOT seeded — no Act schedule citation is available. Category-based zero-rating determination is unavailable until that schedule is verified (see src/lib/tax and src/lib/services/vat-service.ts).'
  where not exists (
    select 1 from public.tax_rules where rule_version_id = v_version_id and rule_key = 'zero_rate'
  );

  -- ==========================================================================
  -- business_tax.minimum_etr / very_large_turnover_threshold — split out of
  -- the existing bundled (confidence 'high') business_tax.minimum_effective_tax_rate
  -- rule on the active version, for independent review of each figure.
  -- ==========================================================================
  insert into public.tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
  select v_version_id, v_nta_id, 'business_tax', 'minimum_etr',
    '{"rate": 15, "unit": "percentage"}'::jsonb,
    'unverified', now(),
    'Minimum effective tax rate for very-large companies / MNE group constituents, split out from the bundled business_tax.minimum_effective_tax_rate reading (active version) for independent verification. Aligns with OECD BEPS Pillar 2 framing; Nigeria Tax Act 2025 section reference not yet confirmed.'
  where not exists (
    select 1 from public.tax_rules where rule_version_id = v_version_id and rule_key = 'minimum_etr'
  );

  insert into public.tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
  select v_version_id, v_nta_id, 'business_tax', 'very_large_turnover_threshold',
    '{"threshold": 20000000000, "currency": "NGN", "operator": ">="}'::jsonb,
    'unverified', now(),
    'Turnover threshold for "very large company" classification (minimum ETR regime), split out from the bundled business_tax.minimum_effective_tax_rate reading (active version) for independent verification. Nigeria Tax Act 2025 section reference not yet confirmed.'
  where not exists (
    select 1 from public.tax_rules where rule_version_id = v_version_id and rule_key = 'very_large_turnover_threshold'
  );

  -- ==========================================================================
  -- Flag the VAT threshold conflict for human review.
  -- ==========================================================================
  if not exists (
    select 1 from public.review_queue
    where change_summary = 'VAT registration/small-business-exemption threshold: three mutually exclusive candidate readings unresolved'
  ) then
    insert into public.review_queue (
      source_id, change_type, change_summary, change_details, proposed_rule_changes, status, priority, created_at, updated_at
    )
    values (
      v_nta_id,
      'rule_update',
      'VAT registration/small-business-exemption threshold: three mutually exclusive candidate readings unresolved',
      jsonb_build_object(
        'issue', 'Three mutually exclusive candidate values exist for the VAT registration / small-business-exemption turnover threshold, and none has been verified against primary Nigeria Tax Act 2025 text.',
        'candidates', jsonb_build_array(
          jsonb_build_object('rule_key', 'vat.registration_threshold_legacy_25m', 'value_ngn', 25000000, 'basis', 'Finance Act (legacy VAT)'),
          jsonb_build_object('rule_key', 'vat.small_business_exemption_100m', 'value_ngn', 100000000, 'basis', 'Current active seed reading (vat.small_business_exemption_turnover); source unclear'),
          jsonb_build_object('rule_key', 'vat.small_business_exemption_50m', 'value_ngn', 50000000, 'basis', 'PwC Nigeria Tax Updates reading')
        ),
        'impact', 'VATService.getRegistrationObligation() and resolveVatObligationStatus() intentionally return an unresolved status with all candidates rather than asserting registration/exemption while this is open.',
        'action_needed', 'A tax practitioner must confirm the correct figure against the Nigeria Tax Act 2025 primary text, then approve a corrected rule_version.'
      ),
      jsonb_build_object(
        'rule_version_id', v_version_id,
        'rule_keys', jsonb_build_array('vat.registration_threshold_legacy_25m', 'vat.small_business_exemption_100m', 'vat.small_business_exemption_50m')
      ),
      'pending',
      'high',
      now(),
      now()
    );
  end if;

  -- ==========================================================================
  -- Mark the existing active small-business-exemption rule's notes as disputed.
  -- ==========================================================================
  update public.tax_rules
  set notes = coalesce(notes, '') || ' [2026-08-05 provenance check: this NGN 100,000,000 figure conflicts with an unverified NGN 50,000,000 PwC reading and a legacy NGN 25,000,000 Finance Act reading — see rule_version "v1.1.0-unverified-candidates" and the open review_queue item. Treat turnover-based VAT registration/exemption determination as unresolved until reconciled.]'
  where rule_key = 'small_business_exemption_turnover'
    and rule_type = 'vat'
    and position('[2026-08-05 provenance check' in coalesce(notes, '')) = 0;

end $$;

-- ----------------------------------------------------------------------------
-- 8. Anon privileges on new objects
-- ----------------------------------------------------------------------------
-- No new tables, views, or functions were created by this migration — only
-- rows on pre-existing tables (sources, rule_versions, tax_rules, review_queue),
-- whose grants/RLS policies already exist from prior migrations. There is
-- nothing new to revoke from "anon" here.
