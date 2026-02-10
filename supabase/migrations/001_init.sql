-- ============================================================
-- Migration: 001_init.sql
-- Description: Initialize extensions and base configuration
-- Created: 2026-01-29
-- KOMPLEET - Nigerian Tax Compliance Platform
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

-- UUID generation (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Cryptographic functions for hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Full text search (Nigerian English)
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

-- ============================================================
-- SCHEMAS
-- ============================================================

-- Ensure public schema exists and has correct permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- Default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, service_role;

-- ============================================================
-- CONFIGURATION
-- ============================================================

-- Set timezone to West Africa Time (Nigeria)
ALTER DATABASE postgres SET timezone TO 'Africa/Lagos';

-- ============================================================
-- HELPER FUNCTIONS (used by other migrations)
-- ============================================================

-- Function to check if a type exists
CREATE OR REPLACE FUNCTION public.type_exists(type_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM pg_type WHERE typname = type_name);
END;
$$;

COMMENT ON FUNCTION public.type_exists IS 'Helper function to check if a PostgreSQL type exists';

-- Function to check if a column exists
CREATE OR REPLACE FUNCTION public.column_exists(
  p_table_name TEXT,
  p_column_name TEXT,
  p_schema_name TEXT DEFAULT 'public'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = p_schema_name 
      AND table_name = p_table_name 
      AND column_name = p_column_name
  );
END;
$$;

COMMENT ON FUNCTION public.column_exists IS 'Helper function to check if a table column exists';

-- Function to safely add a column
CREATE OR REPLACE FUNCTION public.add_column_if_not_exists(
  p_table_name TEXT,
  p_column_name TEXT,
  p_column_definition TEXT,
  p_schema_name TEXT DEFAULT 'public'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.column_exists(p_table_name, p_column_name, p_schema_name) THEN
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN %I %s',
      p_schema_name, p_table_name, p_column_name, p_column_definition
    );
    RAISE NOTICE 'Added column %.%.%', p_schema_name, p_table_name, p_column_name;
  ELSE
    RAISE NOTICE 'Column already exists: %.%.%', p_schema_name, p_table_name, p_column_name;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.add_column_if_not_exists IS 'Safely adds a column if it does not exist';

-- ============================================================
-- MIGRATION TRACKING (optional - Supabase handles this)
-- ============================================================

CREATE TABLE IF NOT EXISTS public._migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public._migrations IS 'Tracks executed migrations (supplementary to Supabase tracking)';

-- Record this migration
INSERT INTO public._migrations (name) 
VALUES ('001_init.sql')
ON CONFLICT (name) DO NOTHING;
