-- Inspect all existing tables in your Supabase database
-- Run this and share the full output

-- List all tables
SELECT 
  'ALL TABLES' as info,
  tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Get structure for each table
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TABLE: %', tbl.tablename;
    RAISE NOTICE '========================================';
  END LOOP;
END $$;

-- Users table
SELECT 'USERS' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Categories table
SELECT 'CATEGORIES' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY ordinal_position;

-- Transactions table
SELECT 'TRANSACTIONS' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Records table (if exists)
SELECT 'RECORDS' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'records'
ORDER BY ordinal_position;

-- Invoices table (if exists)
SELECT 'INVOICES' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'invoices'
ORDER BY ordinal_position;

-- Customers table (if exists)
SELECT 'CUSTOMERS' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- Check existing RLS policies
SELECT 
  'EXISTING POLICIES' as info,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
