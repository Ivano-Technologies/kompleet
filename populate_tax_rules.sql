-- ============================================================================
-- KOMPLEET Platform - Tax Rules Population Script
-- ============================================================================
-- Purpose: Populate tax_rules table with Nigeria Tax Act 2025 provisions
-- Source: Nigerian Tax Law Advisory Skill (95% confidence)
-- Effective Date: January 1, 2026
-- Last Updated: February 5, 2026
-- ============================================================================

-- Get the active rule version ID
DO $$
DECLARE
    v_version_id UUID;
    v_firs_id UUID;
    v_ey_id UUID;
    v_kpmg_id UUID;
BEGIN
    -- Get active rule version
    SELECT id INTO v_version_id FROM rule_versions WHERE is_active = true LIMIT 1;
    
    -- Get source IDs
    SELECT id INTO v_firs_id FROM sources WHERE name = 'Federal Inland Revenue Service (FIRS)';
    SELECT id INTO v_ey_id FROM sources WHERE name = 'EY Nigeria Tax Alerts';
    SELECT id INTO v_kpmg_id FROM sources WHERE name = 'KPMG Nigeria Tax Insights';

    -- ========================================================================
    -- BUSINESS TAX RULES
    -- ========================================================================

    -- Small Company Classification Criteria
    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'business_tax',
        'small_company_turnover_threshold',
        '{"value": 50000000, "currency": "NGN", "unit": "annual", "operator": "<="}',
        'high',
        NOW(),
        'Small company must have turnover ≤ N50 million. This is one of two criteria that BOTH must be met.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'business_tax',
        'small_company_assets_threshold',
        '{"value": 250000000, "currency": "NGN", "unit": "total", "operator": "<="}',
        'high',
        NOW(),
        'Small company must have total assets ≤ N250 million. This is one of two criteria that BOTH must be met.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'business_tax',
        'small_company_professional_exclusion',
        '{"excluded": true, "reason": "Professional service providers do NOT qualify as small companies"}',
        'high',
        NOW(),
        'Professional service providers are explicitly excluded from small company benefits regardless of turnover/assets.'
    );

    -- Corporate Tax Rates
    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'business_tax',
        'corporate_tax_rate_small',
        '{"rate": 0, "unit": "percentage", "applies_to": "small_company"}',
        'high',
        NOW(),
        'Small companies pay 0% income tax on assessable profits.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'business_tax',
        'corporate_tax_rate_other',
        '{"rate": 30, "unit": "percentage", "applies_to": "other_company"}',
        'high',
        NOW(),
        'Other companies (not qualifying as small) pay 30% income tax on assessable profits.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_ey_id,
        'business_tax',
        'minimum_effective_tax_rate',
        '{"rate": 15, "unit": "percentage", "applies_to": "very_large_company", "threshold_turnover": 20000000000}',
        'high',
        NOW(),
        'MNE group constituent entities and companies with turnover ≥ N20 billion must maintain 15% minimum ETR. Aligns with OECD BEPS Pillar 2.'
    );

    -- Development Levy
    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'business_tax',
        'development_levy_rate',
        '{"rate": 4, "unit": "percentage", "applies_to": "assessable_profits"}',
        'high',
        NOW(),
        'Development levy is 4% of assessable profits for companies subject to the levy.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'business_tax',
        'development_levy_exemptions',
        '{"exempt": ["small_company", "non_resident_company"]}',
        'high',
        NOW(),
        'Small companies and non-resident companies are exempt from development levy.'
    );

    -- Capital Gains Tax
    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_kpmg_id,
        'business_tax',
        'capital_gains_integration',
        '{"integrated": true, "separate_tax": false, "note": "CGT integrated into income tax, no separate rate"}',
        'high',
        NOW(),
        'Major change: Capital gains tax integrated into income tax. Small companies pay 0% on capital gains.'
    );

    -- ========================================================================
    -- CAPITAL ALLOWANCES
    -- ========================================================================

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'capital_allowance',
        'rate_10_percent',
        '{"rate": 10, "unit": "percentage", "method": "straight_line", "asset_types": ["buildings", "agricultural_expenditure", "masts", "intangibles", "heavy_transportation"]}',
        'high',
        NOW(),
        '10% capital allowance rate for buildings, agricultural expenditure, masts, intangibles, and heavy transportation assets.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'capital_allowance',
        'rate_20_percent',
        '{"rate": 20, "unit": "percentage", "method": "straight_line", "asset_types": ["plant", "agricultural_equipment", "furniture_fittings", "mining_equipment", "other_equipment"]}',
        'high',
        NOW(),
        '20% capital allowance rate for plant, agricultural equipment, furniture & fittings, mining equipment, and other equipment.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'capital_allowance',
        'rate_25_percent',
        '{"rate": 25, "unit": "percentage", "method": "straight_line", "asset_types": ["motor_vehicles", "software", "other_capital_expenditure"]}',
        'high',
        NOW(),
        '25% capital allowance rate for motor vehicles, software, and other capital expenditure.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'capital_allowance',
        'method_change',
        '{"method": "straight_line", "initial_allowance": false, "investment_allowance": false}',
        'high',
        NOW(),
        'Major change: Only straight-line method allowed. Initial and investment allowances eliminated.'
    );

    -- ========================================================================
    -- INDIVIDUAL INCOME TAX RULES
    -- ========================================================================

    -- Tax Brackets
    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'individual_income_tax',
        'tax_bracket_1',
        '{"from": 0, "to": 800000, "rate": 0, "description": "First N800,000"}',
        'high',
        NOW(),
        'First N800,000 of annual income is tax-free (0% rate).'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'individual_income_tax',
        'tax_bracket_2',
        '{"from": 800001, "to": 3000000, "rate": 15, "description": "Next N2,200,000"}',
        'high',
        NOW(),
        'Income from N800,001 to N3,000,000 taxed at 15%.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'individual_income_tax',
        'tax_bracket_3',
        '{"from": 3000001, "to": 12000000, "rate": 18, "description": "Next N9,000,000"}',
        'high',
        NOW(),
        'Income from N3,000,001 to N12,000,000 taxed at 18%.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'individual_income_tax',
        'tax_bracket_4',
        '{"from": 12000001, "to": 25000000, "rate": 21, "description": "Next N13,000,000"}',
        'high',
        NOW(),
        'Income from N12,000,001 to N25,000,000 taxed at 21%.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'individual_income_tax',
        'tax_bracket_5',
        '{"from": 25000001, "to": 50000000, "rate": 23, "description": "Next N25,000,000"}',
        'high',
        NOW(),
        'Income from N25,000,001 to N50,000,000 taxed at 23%.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'individual_income_tax',
        'tax_bracket_6',
        '{"from": 50000001, "to": null, "rate": 25, "description": "Above N50,000,000"}',
        'high',
        NOW(),
        'Income above N50,000,000 taxed at 25% (maximum rate).'
    );

    -- Deductions and Reliefs
    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'individual_income_tax',
        'rent_relief',
        '{"cap": 500000, "percentage": 20, "calculation": "minimum of N500,000 or 20% of annual rent paid"}',
        'high',
        NOW(),
        'Rent relief is N500,000 OR 20% of annual rent paid, whichever is LOWER.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'individual_income_tax',
        'owner_occupier_interest',
        '{"deductible": true, "description": "Interest on owner-occupier house is deductible"}',
        'high',
        NOW(),
        'Interest paid on owner-occupier house loans is deductible from taxable income.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_kpmg_id,
        'individual_income_tax',
        'consolidated_relief_deleted',
        '{"deleted": true, "note": "Consolidated relief allowance on gross income has been deleted"}',
        'high',
        NOW(),
        'Major change: Consolidated relief allowance on gross income has been eliminated.'
    );

    -- ========================================================================
    -- VAT RULES
    -- ========================================================================

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'vat',
        'standard_rate',
        '{"rate": 7.5, "unit": "percentage"}',
        'high',
        NOW(),
        'Standard VAT rate is 7.5% (unchanged from previous law).'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'vat',
        'small_business_exemption_turnover',
        '{"threshold": 100000000, "currency": "NGN", "operator": "<"}',
        'high',
        NOW(),
        'Small business VAT exemption: Turnover must be < N100 million. This is one of two criteria that BOTH must be met.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'vat',
        'small_business_exemption_assets',
        '{"threshold": 250000000, "currency": "NGN", "operator": "<"}',
        'high',
        NOW(),
        'Small business VAT exemption: Total assets must be < N250 million. This is one of two criteria that BOTH must be met.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'vat',
        'rent_exemption',
        '{"exempt": true, "items": ["land_rent", "building_rent", "interest_in_land", "interest_in_building"]}',
        'high',
        NOW(),
        'Rent (land or building including interest in land or building) is exempt from VAT.'
    );

    -- ========================================================================
    -- STAMP DUTY RULES
    -- ========================================================================

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'stamp_duty',
        'property_transfer_rate',
        '{"rate": 1.5, "unit": "percentage", "applies_to": "sale_value", "payable_by": "transferee"}',
        'high',
        NOW(),
        'Conveyance or transfer on sale: 1.5% ad valorem, payable by buyer (transferee).'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'stamp_duty',
        'agreement_for_sale_rate',
        '{"rate": 1.5, "unit": "percentage", "applies_to": "sale_value", "payable_by": "transferee"}',
        'high',
        NOW(),
        'Agreement for sale: 1.5% ad valorem, payable by buyer (transferee).'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'stamp_duty',
        'lease_rate_short',
        '{"rate": 0.78, "unit": "percentage", "duration": "<=7_years", "applies_to": "total_rent", "payable_by": "lessee"}',
        'high',
        NOW(),
        'Lease agreements ≤7 years: 0.78% of total rent, payable by lessee.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'stamp_duty',
        'lease_rate_long',
        '{"rate": 3, "unit": "percentage", "duration": ">7_years", "applies_to": "total_rent", "payable_by": "lessee"}',
        'high',
        NOW(),
        'Lease agreements >7 years: 3% of total rent, payable by lessee.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'stamp_duty',
        'low_value_exemption',
        '{"threshold": 10000000, "currency": "NGN", "operator": "<", "exempt": true}',
        'high',
        NOW(),
        'Property valued < N10,000,000 is exempt from stamp duty.'
    );

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'stamp_duty',
        'associated_company_exemption',
        '{"shareholding": ">=90%", "exempt": true, "note": "Companies with ≥90% shareholding in each other"}',
        'high',
        NOW(),
        'Transfers between associated companies (≥90% shareholding) are exempt from stamp duty.'
    );

    -- ========================================================================
    -- DEVELOPMENT LEVY DISTRIBUTION
    -- ========================================================================

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_firs_id,
        'development_levy',
        'distribution',
        '{"tertiary_education_trust_fund": 50, "nigerian_education_loan": 15, "defence_security_infrastructure": 10, "national_it_development": 8, "science_engineering_infrastructure": 8, "national_cybersecurity": 5, "technological_incubation": 4}',
        'medium',
        NOW(),
        'Development levy distribution across 7 agencies. Note: Exact percentages require official gazette confirmation (medium confidence).'
    );

    -- ========================================================================
    -- OTHER TAXES AND LEVIES
    -- ========================================================================

    INSERT INTO tax_rules (rule_version_id, source_id, rule_type, rule_key, rule_value, confidence_level, last_reviewed_at, notes)
    VALUES (
        v_version_id,
        v_ey_id,
        'property_tax',
        'withholding_tax_on_rent',
        '{"deduction_at_source": true, "note": "WHT on rent must be deducted at source"}',
        'high',
        NOW(),
        'Withholding tax on rent: Deduction at source required to ensure tax collection at point of payment.'
    );

    RAISE NOTICE 'Successfully populated % tax rules', (SELECT COUNT(*) FROM tax_rules WHERE rule_version_id = v_version_id);
END $$;
