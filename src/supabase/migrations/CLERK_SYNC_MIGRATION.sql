-- KOMPLEET Platform - Clerk to Supabase Sync Migration
-- Version: 2.0.0
-- Description: Adds Clerk authentication support to existing Supabase database
-- Safe to run - preserves all existing data and tables

-- ============================================================================
-- PART 1: CREATE CLERK USERS TABLE
-- ============================================================================

-- Create users table to store Clerk user data
-- This syncs with Clerk via webhooks
CREATE TABLE IF NOT EXISTS public.clerk_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_clerk_users_clerk_user_id ON public.clerk_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_clerk_users_email ON public.clerk_users(email);

-- ============================================================================
-- PART 2: CREATE HELPER FUNCTIONS FOR CLERK AUTH
-- ============================================================================

-- Function to get current Clerk user's internal UUID
CREATE OR REPLACE FUNCTION public.get_clerk_user_id()
RETURNS UUID AS $$
DECLARE
  current_clerk_id TEXT;
  current_user_uuid UUID;
BEGIN
  -- Get Clerk user ID from JWT claims
  current_clerk_id := current_setting('request.jwt.claims', true)::json->>'sub';
  
  -- Return NULL if no JWT (allows service role operations)
  IF current_clerk_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Look up internal UUID from clerk_users table
  SELECT id INTO current_user_uuid 
  FROM public.clerk_users 
  WHERE clerk_user_id = current_clerk_id
  LIMIT 1;
  
  RETURN current_user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current user ID (supports both Clerk and Supabase Auth during migration)
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
DECLARE
  clerk_uuid UUID;
  supabase_uuid UUID;
BEGIN
  -- Try Clerk first
  clerk_uuid := public.get_clerk_user_id();
  IF clerk_uuid IS NOT NULL THEN
    RETURN clerk_uuid;
  END IF;
  
  -- Fallback to Supabase Auth (for backward compatibility during migration)
  BEGIN
    supabase_uuid := auth.uid();
    IF supabase_uuid IS NOT NULL THEN
      RETURN supabase_uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- auth.uid() not available, continue
  END;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 3: ADD CLERK_USER_ID TO EXISTING TABLES
-- ============================================================================

-- Add clerk_user_id column to profiles table (links to Clerk)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id 
  ON public.profiles(clerk_user_id);

-- Add clerk_user_id column to transactions table
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_transactions_clerk_user_id 
  ON public.transactions(clerk_user_id);

-- ============================================================================
-- PART 4: UPDATE RLS POLICIES FOR CLERK AUTH
-- ============================================================================

-- Enable RLS on clerk_users table
ALTER TABLE public.clerk_users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate clerk_users policies
DROP POLICY IF EXISTS clerk_users_select_own ON public.clerk_users;
DROP POLICY IF EXISTS clerk_users_insert_own ON public.clerk_users;
DROP POLICY IF EXISTS clerk_users_update_own ON public.clerk_users;
DROP POLICY IF EXISTS clerk_users_service_role ON public.clerk_users;

-- Clerk users can read their own record
CREATE POLICY clerk_users_select_own ON public.clerk_users
  FOR SELECT
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Clerk users can insert their own record (first login)
CREATE POLICY clerk_users_insert_own ON public.clerk_users
  FOR INSERT
  WITH CHECK (
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Clerk users can update their own record
CREATE POLICY clerk_users_update_own ON public.clerk_users
  FOR UPDATE
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Service role has full access (for webhook sync)
CREATE POLICY clerk_users_service_role ON public.clerk_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 5: UPDATE EXISTING TRANSACTIONS POLICIES FOR CLERK
-- ============================================================================

-- Drop existing transactions policies
DROP POLICY IF EXISTS transactions_select_clerk ON public.transactions;
DROP POLICY IF EXISTS transactions_insert_clerk ON public.transactions;
DROP POLICY IF EXISTS transactions_update_clerk ON public.transactions;
DROP POLICY IF EXISTS transactions_delete_clerk ON public.transactions;

-- Create new Clerk-compatible policies (work alongside existing Supabase Auth policies)
CREATE POLICY transactions_select_clerk ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    -- Support Clerk auth
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    OR
    -- Support Supabase auth (backward compatibility)
    user_id = auth.uid()
  );

CREATE POLICY transactions_insert_clerk ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Support Clerk auth
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    OR
    -- Support Supabase auth (backward compatibility)
    user_id = auth.uid()
  );

CREATE POLICY transactions_update_clerk ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (
    -- Support Clerk auth
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    OR
    -- Support Supabase auth (backward compatibility)
    user_id = auth.uid()
  );

CREATE POLICY transactions_delete_clerk ON public.transactions
  FOR DELETE
  TO authenticated
  USING (
    -- Support Clerk auth
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    OR
    -- Support Supabase auth (backward compatibility)
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 6: UPDATE PROFILES POLICIES FOR CLERK
-- ============================================================================

-- Drop existing Clerk-specific policies if they exist
DROP POLICY IF EXISTS profiles_select_clerk ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_clerk ON public.profiles;
DROP POLICY IF EXISTS profiles_update_clerk ON public.profiles;

-- Create new Clerk-compatible policies
CREATE POLICY profiles_select_clerk ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Support Clerk auth
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    OR
    -- Support Supabase auth (backward compatibility)
    id = auth.uid()
  );

CREATE POLICY profiles_insert_clerk ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Support Clerk auth
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    OR
    -- Support Supabase auth (backward compatibility)
    id = auth.uid()
  );

CREATE POLICY profiles_update_clerk ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Support Clerk auth
    clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    OR
    -- Support Supabase auth (backward compatibility)
    id = auth.uid()
  );

-- ============================================================================
-- PART 7: CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clerk_users_updated_at ON public.clerk_users;
CREATE TRIGGER update_clerk_users_updated_at 
  BEFORE UPDATE ON public.clerk_users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 8: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_clerk_user_id() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE ON public.clerk_users TO authenticated, anon;
GRANT ALL ON public.clerk_users TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- ✅ clerk_users table created
-- ✅ Helper functions for Clerk auth created
-- ✅ clerk_user_id columns added to existing tables
-- ✅ RLS policies updated to support both Clerk and Supabase Auth
-- ✅ Backward compatibility maintained during migration
-- ✅ Ready for Clerk webhook integration
--
-- NEXT STEPS:
-- 1. Set up Clerk webhooks to sync user.created and user.updated events
-- 2. Update Web platform to use Clerk authentication
-- 3. Update Mobile platform to use Clerk authentication
-- 4. Gradually migrate existing users from Supabase Auth to Clerk
