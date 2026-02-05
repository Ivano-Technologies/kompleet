-- Enable Row Level Security (RLS) on all public tables
-- This migration addresses the critical security vulnerabilities identified in Supabase Security Advisor
-- Version 2: Updated to match actual database schema

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RULE VERSIONS POLICIES
-- ============================================================================

-- Allow authenticated users to read all rule versions
CREATE POLICY "Allow authenticated users to read rule versions"
ON public.rule_versions
FOR SELECT
TO authenticated
USING (true);

-- Allow service role to manage rule versions
CREATE POLICY "Allow service role to manage rule versions"
ON public.rule_versions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- TAX RULES POLICIES
-- ============================================================================

-- Allow authenticated users to read all tax rules
CREATE POLICY "Allow authenticated users to read tax rules"
ON public.tax_rules
FOR SELECT
TO authenticated
USING (true);

-- Allow service role to manage tax rules
CREATE POLICY "Allow service role to manage tax rules"
ON public.tax_rules
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SOURCES POLICIES
-- ============================================================================

-- Allow authenticated users to read all sources
CREATE POLICY "Allow authenticated users to read sources"
ON public.sources
FOR SELECT
TO authenticated
USING (true);

-- Allow service role to manage sources
CREATE POLICY "Allow service role to manage sources"
ON public.sources
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

-- Allow users to read only their own audit logs
CREATE POLICY "Users can read their own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own audit logs
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all audit logs
CREATE POLICY "Allow service role to manage audit logs"
ON public.audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- REVIEW QUEUE POLICIES
-- ============================================================================

-- Allow authenticated users to read all review queue items
CREATE POLICY "Allow authenticated users to read review queue"
ON public.review_queue
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert review queue items
CREATE POLICY "Allow authenticated users to insert review queue"
ON public.review_queue
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow service role to manage review queue
CREATE POLICY "Allow service role to manage review queue"
ON public.review_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles
CREATE POLICY "Allow service role to manage profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE (based on actual schema)
-- ============================================================================

-- Add indexes on foreign keys and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_rule_version_id ON public.audit_logs(rule_version_id);

CREATE INDEX IF NOT EXISTS idx_tax_rules_rule_version_id ON public.tax_rules(rule_version_id);
CREATE INDEX IF NOT EXISTS idx_tax_rules_source_id ON public.tax_rules(source_id);
CREATE INDEX IF NOT EXISTS idx_tax_rules_rule_type ON public.tax_rules(rule_type);

CREATE INDEX IF NOT EXISTS idx_review_queue_source_id ON public.review_queue(source_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON public.review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_assigned_to ON public.review_queue(assigned_to);

CREATE INDEX IF NOT EXISTS idx_rule_versions_is_active ON public.rule_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_rule_versions_effective_from ON public.rule_versions(effective_from);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Allow authenticated users to read rule versions" ON public.rule_versions IS 
'All authenticated users can view tax rule versions for calculations';

COMMENT ON POLICY "Users can read their own audit logs" ON public.audit_logs IS 
'Users can only access their own calculation history for privacy';

COMMENT ON POLICY "Allow service role to manage audit logs" ON public.audit_logs IS 
'Service role has full access for administrative operations';

COMMENT ON POLICY "Users can read their own profile" ON public.profiles IS 
'Users can only view and update their own profile information';
