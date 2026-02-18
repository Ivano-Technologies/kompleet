-- Rollback: Remove VAT tables
-- Version: 010
-- Date: 2026-02-17
-- Description: Removes all VAT-related tables and functions

BEGIN;

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS vat_transactions_update_timestamp ON vat_transactions;
DROP TRIGGER IF EXISTS vat_calculations_update_timestamp ON vat_calculations;
DROP TRIGGER IF EXISTS vat_summaries_update_timestamp ON vat_summaries;
DROP TRIGGER IF EXISTS vat_forms_update_timestamp ON vat_forms;
DROP TRIGGER IF EXISTS vat_compliance_update_timestamp ON vat_compliance;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS update_vat_timestamp();

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS vat_transactions_user_isolation ON vat_transactions;
DROP POLICY IF EXISTS vat_calculations_user_isolation ON vat_calculations;
DROP POLICY IF EXISTS vat_summaries_user_isolation ON vat_summaries;
DROP POLICY IF EXISTS vat_forms_user_isolation ON vat_forms;
DROP POLICY IF EXISTS vat_compliance_user_isolation ON vat_compliance;
DROP POLICY IF EXISTS vat_audit_log_user_isolation ON vat_audit_log;

-- ============================================================================
-- DROP TABLES
-- ============================================================================

DROP TABLE IF EXISTS vat_audit_log CASCADE;
DROP TABLE IF EXISTS vat_compliance CASCADE;
DROP TABLE IF EXISTS vat_forms CASCADE;
DROP TABLE IF EXISTS vat_summaries CASCADE;
DROP TABLE IF EXISTS vat_calculations CASCADE;
DROP TABLE IF EXISTS vat_transactions CASCADE;

-- ============================================================================
-- UPDATE MIGRATION METADATA
-- ============================================================================

-- Mark migration as rolled back
UPDATE schema_migrations
SET status = 'rolled_back'
WHERE version = '010' AND name = 'vat_tables';

COMMIT;
