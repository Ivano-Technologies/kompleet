-- Migration 008: Tax Rules Engine
-- Description: Create tables for versioned tax rules, regulatory sources, and audit logging
-- Author: KOMPLEET Engineering Team
-- Date: 2026-02-04

-- ============================================================================
-- 1. SOURCES TABLE
-- ============================================================================
-- Stores regulatory sources (FIRS, EY, KPMG, etc.)
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('primary', 'secondary')),
    url TEXT NOT NULL,
    description TEXT,
    check_frequency_days INTEGER NOT NULL DEFAULT 30,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_type ON sources(type);
CREATE INDEX idx_sources_last_checked ON sources(last_checked_at);

-- ============================================================================
-- 2. RULE_VERSIONS TABLE
-- ============================================================================
-- Stores versions of tax rulesets
CREATE TABLE IF NOT EXISTS rule_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number TEXT NOT NULL UNIQUE,
    description TEXT,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rule_versions_active ON rule_versions(is_active);
CREATE INDEX idx_rule_versions_effective ON rule_versions(effective_from, effective_to);

-- ============================================================================
-- 3. TAX_RULES TABLE
-- ============================================================================
-- Stores individual tax rules linked to versions and sources
CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_version_id UUID NOT NULL REFERENCES rule_versions(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id),
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'individual_income_tax',
        'business_tax',
        'vat',
        'stamp_duty',
        'capital_allowance',
        'development_levy',
        'property_tax'
    )),
    rule_key TEXT NOT NULL,
    rule_value JSONB NOT NULL,
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
    last_reviewed_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(rule_version_id, rule_key)
);

CREATE INDEX idx_tax_rules_version ON tax_rules(rule_version_id);
CREATE INDEX idx_tax_rules_type ON tax_rules(rule_type);
CREATE INDEX idx_tax_rules_key ON tax_rules(rule_key);

-- ============================================================================
-- 4. AUDIT_LOGS TABLE
-- ============================================================================
-- Immutable audit trail for all tax calculations
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    calculation_type TEXT NOT NULL,
    inputs JSONB NOT NULL,
    outputs JSONB NOT NULL,
    rule_version_id UUID NOT NULL REFERENCES rule_versions(id),
    rule_version_number TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_type ON audit_logs(calculation_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_version ON audit_logs(rule_version_id);

-- ============================================================================
-- 5. REVIEW_QUEUE TABLE
-- ============================================================================
-- Human review queue for regulatory changes
CREATE TABLE IF NOT EXISTS review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id),
    change_type TEXT NOT NULL CHECK (change_type IN ('new_rule', 'rule_update', 'rule_deprecation')),
    change_summary TEXT NOT NULL,
    change_details JSONB NOT NULL,
    proposed_rule_changes JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_priority ON review_queue(priority);
CREATE INDEX idx_review_queue_assigned ON review_queue(assigned_to);

-- ============================================================================
-- 6. REVIEW_ACTIONS TABLE
-- ============================================================================
-- Audit trail for review actions
CREATE TABLE IF NOT EXISTS review_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_queue_id UUID NOT NULL REFERENCES review_queue(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('assigned', 'commented', 'approved', 'rejected', 'requested_changes')),
    action_by UUID NOT NULL REFERENCES auth.users(id),
    action_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_actions_queue ON review_actions(review_queue_id);
CREATE INDEX idx_review_actions_by ON review_actions(action_by);

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Function to get active rule version
CREATE OR REPLACE FUNCTION get_active_rule_version()
RETURNS UUID AS $$
DECLARE
    active_version_id UUID;
BEGIN
    SELECT id INTO active_version_id
    FROM rule_versions
    WHERE is_active = TRUE
    AND effective_from <= NOW()
    AND (effective_to IS NULL OR effective_to > NOW())
    ORDER BY effective_from DESC
    LIMIT 1;
    
    RETURN active_version_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to activate a rule version
CREATE OR REPLACE FUNCTION activate_rule_version(version_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Deactivate all other versions
    UPDATE rule_versions SET is_active = FALSE;
    
    -- Activate the specified version
    UPDATE rule_versions
    SET is_active = TRUE, updated_at = NOW()
    WHERE id = version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log tax calculation
CREATE OR REPLACE FUNCTION log_tax_calculation(
    p_user_id UUID,
    p_calculation_type TEXT,
    p_inputs JSONB,
    p_outputs JSONB,
    p_ip_address INET,
    p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
    active_version_id UUID;
    active_version_number TEXT;
    log_id UUID;
BEGIN
    -- Get active rule version
    SELECT id, version_number INTO active_version_id, active_version_number
    FROM rule_versions
    WHERE is_active = TRUE
    LIMIT 1;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        calculation_type,
        inputs,
        outputs,
        rule_version_id,
        rule_version_number,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_calculation_type,
        p_inputs,
        p_outputs,
        active_version_id,
        active_version_number,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_actions ENABLE ROW LEVEL SECURITY;

-- Sources: Read-only for all authenticated users, write for compliance team
CREATE POLICY "sources_read_all" ON sources
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "sources_write_compliance" ON sources
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('compliance_lead', 'admin')
        )
    );

-- Rule Versions: Read-only for all, write for compliance team
CREATE POLICY "rule_versions_read_all" ON rule_versions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "rule_versions_write_compliance" ON rule_versions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('compliance_lead', 'admin')
        )
    );

-- Tax Rules: Read-only for all, write for compliance team
CREATE POLICY "tax_rules_read_all" ON tax_rules
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "tax_rules_write_compliance" ON tax_rules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('compliance_lead', 'admin')
        )
    );

-- Audit Logs: Read-only for compliance team and admins
CREATE POLICY "audit_logs_read_compliance" ON audit_logs
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('compliance_lead', 'admin')
        )
    );

CREATE POLICY "audit_logs_insert_all" ON audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Review Queue: Compliance team and assigned users
CREATE POLICY "review_queue_read" ON review_queue
    FOR SELECT
    TO authenticated
    USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('compliance_lead', 'admin')
        )
    );

CREATE POLICY "review_queue_write_compliance" ON review_queue
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('compliance_lead', 'admin')
        )
    );

-- Review Actions: Read for assigned users, write for compliance team
CREATE POLICY "review_actions_read" ON review_actions
    FOR SELECT
    TO authenticated
    USING (
        action_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM review_queue
            WHERE id = review_actions.review_queue_id
            AND assigned_to = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('compliance_lead', 'admin')
        )
    );

CREATE POLICY "review_actions_insert_compliance" ON review_actions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        action_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('compliance_lead', 'admin')
        )
    );

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sources_updated_at
    BEFORE UPDATE ON sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rule_versions_updated_at
    BEFORE UPDATE ON rule_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_rules_updated_at
    BEFORE UPDATE ON tax_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_queue_updated_at
    BEFORE UPDATE ON review_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. SEED DATA
-- ============================================================================

-- Insert initial sources
INSERT INTO sources (name, type, url, description, check_frequency_days) VALUES
('Federal Inland Revenue Service (FIRS)', 'primary', 'https://www.firs.gov.ng', 'Official Nigerian tax authority', 7),
('EY Nigeria Tax Alerts', 'secondary', 'https://www.ey.com/en_ng/tax', 'Big 4 accounting firm tax updates', 14),
('KPMG Nigeria Tax Insights', 'secondary', 'https://kpmg.com/ng/en/home/insights.html', 'Big 4 accounting firm tax insights', 14),
('PwC Nigeria Tax Updates', 'secondary', 'https://www.pwc.com/ng/en/tax.html', 'Big 4 accounting firm tax updates', 14),
('Deloitte Nigeria Tax News', 'secondary', 'https://www2.deloitte.com/ng/en/pages/tax/topics/tax.html', 'Big 4 accounting firm tax news', 14);

-- Insert initial rule version (2025 Tax Act)
INSERT INTO rule_versions (version_number, description, effective_from, is_active, created_by)
VALUES (
    'v1.0.0-2025-tax-act',
    'Initial implementation of Nigeria Tax Act 2025',
    '2026-01-01 00:00:00+00',
    TRUE,
    (SELECT id FROM auth.users LIMIT 1)
);

-- Grant permissions
GRANT SELECT ON sources TO authenticated;
GRANT SELECT ON rule_versions TO authenticated;
GRANT SELECT ON tax_rules TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT ON review_queue TO authenticated;
GRANT SELECT, INSERT ON review_actions TO authenticated;

-- Migration complete
COMMENT ON TABLE sources IS 'Regulatory sources for tax rules (FIRS, EY, KPMG, etc.)';
COMMENT ON TABLE rule_versions IS 'Versioned tax rulesets with activation dates';
COMMENT ON TABLE tax_rules IS 'Individual tax rules linked to versions and sources';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all tax calculations';
COMMENT ON TABLE review_queue IS 'Human review queue for regulatory changes';
COMMENT ON TABLE review_actions IS 'Audit trail for review actions';
