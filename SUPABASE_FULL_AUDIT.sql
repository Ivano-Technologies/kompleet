-- ============================================================================
-- KOMPLEET PLATFORM - COMPREHENSIVE SUPABASE AUDIT
-- Date: February 7, 2026
-- Purpose: Full inventory of all database resources for cleanup and compliance
-- ============================================================================

-- ============================================================================
-- SECTION 1: DATABASE SCHEMA AUDIT
-- ============================================================================

-- 1.1: List all tables with row counts and sizes
SELECT 
  'TABLE_INVENTORY' as audit_section,
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_schema = t.schemaname 
   AND table_name = t.tablename) as column_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- 1.2: Get row counts for all tables
DO $$
DECLARE
  r RECORD;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '=== TABLE ROW COUNTS ===';
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE 'SELECT COUNT(*) FROM public.' || quote_ident(r.tablename) INTO row_count;
    RAISE NOTICE 'Table: % | Rows: %', r.tablename, row_count;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 2: ROW LEVEL SECURITY AUDIT
-- ============================================================================

-- 2.1: List all RLS policies
SELECT 
  'RLS_POLICIES' as audit_section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2.2: Check which tables have RLS enabled
SELECT 
  'RLS_STATUS' as audit_section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SECTION 3: FUNCTIONS AND TRIGGERS AUDIT
-- ============================================================================

-- 3.1: List all functions
SELECT 
  'FUNCTIONS' as audit_section,
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  t.typname as return_type
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 3.2: List all triggers
SELECT 
  'TRIGGERS' as audit_section,
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 4: STORAGE AUDIT
-- ============================================================================

-- 4.1: List all storage buckets
SELECT 
  'STORAGE_BUCKETS' as audit_section,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY name;

-- 4.2: Count files in each bucket
SELECT 
  'STORAGE_FILE_COUNTS' as audit_section,
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- ============================================================================
-- SECTION 5: USER DATA AUDIT
-- ============================================================================

-- 5.1: Clerk users inventory
SELECT 
  'CLERK_USERS' as audit_section,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email LIKE '%test%' THEN 1 END) as test_users,
  COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_who_signed_in,
  MIN(created_at) as first_user_created,
  MAX(created_at) as last_user_created
FROM public.clerk_users;

-- 5.2: List all clerk users
SELECT 
  'CLERK_USERS_LIST' as audit_section,
  clerk_user_id,
  email,
  full_name,
  created_at,
  last_sign_in_at
FROM public.clerk_users
ORDER BY created_at DESC;

-- ============================================================================
-- SECTION 6: ORPHANED DATA CHECK
-- ============================================================================

-- 6.1: Check for transactions without valid users
SELECT 
  'ORPHANED_TRANSACTIONS' as audit_section,
  COUNT(*) as orphaned_count
FROM public.transactions t
WHERE NOT EXISTS (
  SELECT 1 FROM public.clerk_users cu WHERE cu.id = t.user_id
);

-- 6.2: Check for categories without valid users (excluding system categories)
SELECT 
  'ORPHANED_CATEGORIES' as audit_section,
  COUNT(*) as orphaned_count
FROM public.categories c
WHERE c.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.clerk_users cu WHERE cu.id = c.user_id
);

-- ============================================================================
-- SECTION 7: COMPLIANCE CHECK
-- ============================================================================

-- 7.1: Check for PII data exposure
SELECT 
  'PII_AUDIT' as audit_section,
  'clerk_users' as table_name,
  'Contains email, full_name, profile_image_url' as pii_fields,
  'RLS policies required' as compliance_note;

-- 7.2: Verify all tables with user_id have RLS enabled
SELECT 
  'RLS_COMPLIANCE' as audit_section,
  t.tablename,
  t.rowsecurity as rls_enabled,
  CASE 
    WHEN t.rowsecurity THEN 'COMPLIANT'
    ELSE 'NON-COMPLIANT - SECURITY RISK'
  END as compliance_status
FROM pg_tables t
WHERE t.schemaname = 'public'
AND EXISTS (
  SELECT 1 
  FROM information_schema.columns c 
  WHERE c.table_schema = 'public' 
  AND c.table_name = t.tablename 
  AND c.column_name = 'user_id'
)
ORDER BY t.tablename;

-- ============================================================================
-- SECTION 8: API KEYS AND SECRETS AUDIT
-- ============================================================================

-- Note: API keys are managed in Supabase dashboard, not in database
-- This section documents what should be audited manually:

SELECT 
  'API_KEYS_AUDIT' as audit_section,
  'Manual audit required in Supabase Dashboard > Settings > API' as note,
  'Check for: anon key, service_role key, unused keys' as audit_items;

-- ============================================================================
-- SECTION 9: EDGE FUNCTIONS AUDIT
-- ============================================================================

-- Note: Edge functions are managed via Supabase CLI/Dashboard
-- This section documents what should be audited manually:

SELECT 
  'EDGE_FUNCTIONS_AUDIT' as audit_section,
  'Manual audit required via: supabase functions list' as note,
  'Check for: unused functions, proper authentication' as audit_items;

-- ============================================================================
-- END OF AUDIT SCRIPT
-- ============================================================================

-- Summary query
SELECT 
  'AUDIT_SUMMARY' as section,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_rls_policies,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') as total_functions,
  (SELECT COUNT(*) FROM storage.buckets) as total_storage_buckets,
  (SELECT COUNT(*) FROM public.clerk_users) as total_users;
