-- Enable Row Level Security (RLS) on all public tables
-- This migration addresses the critical security vulnerabilities identified in Supabase Security Advisor

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

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
USING (auth.uid()::text = user_id);

-- Allow users to insert their own audit logs
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

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
-- PROFILES TABLE (if exists)
-- ============================================================================

-- Check if profiles table exists and enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
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
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add indexes on foreign keys to improve query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_versions_rule_id ON public.rule_versions(rule_id);
CREATE INDEX IF NOT EXISTS idx_tax_rules_category ON public.tax_rules(category);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Allow authenticated users to read rule versions" ON public.rule_versions IS 
'All authenticated users can view tax rule versions for calculations';

COMMENT ON POLICY "Users can read their own audit logs" ON public.audit_logs IS 
'Users can only access their own calculation history for privacy';

COMMENT ON POLICY "Allow service role to manage audit logs" ON public.audit_logs IS 
'Service role has full access for administrative operations';
