-- ============================================================
-- Migration: 002_enums.sql
-- Description: Create all enum types for KOMPLEET
-- Created: 2026-01-29
-- 
-- ENUM NAMING CONVENTION: singular_name_type (e.g., entity_type)
-- All enums use lowercase values
-- ============================================================

-- ============================================================
-- ENTITY TYPE
-- Defines whether a user is an individual or company
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type') THEN
    CREATE TYPE public.entity_type AS ENUM (
      'individual',
      'company'
    );
    RAISE NOTICE 'Created enum: entity_type';
  ELSE
    RAISE NOTICE 'Enum already exists: entity_type';
  END IF;
END $$;

COMMENT ON TYPE public.entity_type IS 'Type of taxpayer entity - individual person or registered company';

-- ============================================================
-- TRANSACTION TYPE
-- Defines the direction of money flow
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE public.transaction_type AS ENUM (
      'credit',   -- Money received (income)
      'debit'     -- Money spent (expense)
    );
    RAISE NOTICE 'Created enum: transaction_type';
  ELSE
    RAISE NOTICE 'Enum already exists: transaction_type';
  END IF;
END $$;

COMMENT ON TYPE public.transaction_type IS 'Direction of transaction - credit (received) or debit (spent)';

-- ============================================================
-- TAX TREATMENT TYPE
-- Defines how a transaction affects tax calculations
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_treatment_type') THEN
    CREATE TYPE public.tax_treatment_type AS ENUM (
      'taxable',         -- Counts as taxable income
      'deductible',      -- Reduces taxable income (allowable expense)
      'exempt',          -- Not subject to tax
      'non_deductible',  -- Expense but cannot be deducted
      'capital'          -- Capital gains treatment
    );
    RAISE NOTICE 'Created enum: tax_treatment_type';
  ELSE
    RAISE NOTICE 'Enum already exists: tax_treatment_type';
  END IF;
END $$;

COMMENT ON TYPE public.tax_treatment_type IS 'How a transaction is treated for tax purposes';

-- ============================================================
-- CATEGORY GROUP TYPE
-- High-level grouping for transaction categories
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_group_type') THEN
    CREATE TYPE public.category_group_type AS ENUM (
      'income',     -- Revenue and earnings
      'expense',    -- Business costs and spending
      'transfer',   -- Internal account transfers
      'tax',        -- Tax-related transactions
      'personal'    -- Non-business personal transactions
    );
    RAISE NOTICE 'Created enum: category_group_type';
  ELSE
    RAISE NOTICE 'Enum already exists: category_group_type';
  END IF;
END $$;

COMMENT ON TYPE public.category_group_type IS 'High-level grouping for transaction categories';

-- ============================================================
-- SUBSCRIPTION TIER TYPE
-- User subscription levels
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier_type') THEN
    CREATE TYPE public.subscription_tier_type AS ENUM (
      'free',          -- Basic free tier (50 transactions/month)
      'starter',       -- Starter plan (500 transactions/month)
      'professional',  -- Professional plan (unlimited)
      'enterprise'     -- Enterprise plan (unlimited + support)
    );
    RAISE NOTICE 'Created enum: subscription_tier_type';
  ELSE
    RAISE NOTICE 'Enum already exists: subscription_tier_type';
  END IF;
END $$;

COMMENT ON TYPE public.subscription_tier_type IS 'Subscription tier levels for billing';

-- ============================================================
-- TAX TYPE
-- Types of Nigerian taxes
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_type') THEN
    CREATE TYPE public.tax_type AS ENUM (
      'pit',   -- Personal Income Tax
      'cit',   -- Company Income Tax
      'vat',   -- Value Added Tax
      'wht'    -- Withholding Tax
    );
    RAISE NOTICE 'Created enum: tax_type';
  ELSE
    RAISE NOTICE 'Enum already exists: tax_type';
  END IF;
END $$;

COMMENT ON TYPE public.tax_type IS 'Types of Nigerian taxes - PIT, CIT, VAT, WHT';

-- ============================================================
-- AUDIT ACTION TYPE
-- Types of auditable actions
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_type') THEN
    CREATE TYPE public.audit_action_type AS ENUM (
      'create',
      'update',
      'delete',
      'restore',
      'export',
      'login',
      'logout'
    );
    RAISE NOTICE 'Created enum: audit_action_type';
  ELSE
    RAISE NOTICE 'Enum already exists: audit_action_type';
  END IF;
END $$;

COMMENT ON TYPE public.audit_action_type IS 'Types of auditable user and system actions';

-- ============================================================
-- REPORT STATUS TYPE
-- Status of generated reports
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status_type') THEN
    CREATE TYPE public.report_status_type AS ENUM (
      'pending',      -- Report generation requested
      'generating',   -- Currently being generated
      'completed',    -- Successfully generated
      'failed'        -- Generation failed
    );
    RAISE NOTICE 'Created enum: report_status_type';
  ELSE
    RAISE NOTICE 'Enum already exists: report_status_type';
  END IF;
END $$;

COMMENT ON TYPE public.report_status_type IS 'Status of report generation jobs';

-- ============================================================
-- IMPORT STATUS TYPE
-- Status of transaction imports
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_status_type') THEN
    CREATE TYPE public.import_status_type AS ENUM (
      'pending',      -- Import queued
      'processing',   -- Currently processing
      'completed',    -- Successfully completed
      'failed',       -- Import failed
      'partial'       -- Partially completed (some errors)
    );
    RAISE NOTICE 'Created enum: import_status_type';
  ELSE
    RAISE NOTICE 'Enum already exists: import_status_type';
  END IF;
END $$;

COMMENT ON TYPE public.import_status_type IS 'Status of bank statement import jobs';

-- ============================================================
-- WHT CATEGORY TYPE
-- Withholding Tax payment categories
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wht_category_type') THEN
    CREATE TYPE public.wht_category_type AS ENUM (
      'dividends',
      'interest',
      'royalties',
      'rent',
      'commission',
      'consultancy',
      'technical_services',
      'management_services',
      'directors_fees',
      'contracts'
    );
    RAISE NOTICE 'Created enum: wht_category_type';
  ELSE
    RAISE NOTICE 'Enum already exists: wht_category_type';
  END IF;
END $$;

COMMENT ON TYPE public.wht_category_type IS 'Categories of payments subject to Withholding Tax';

-- ============================================================
-- MEMBER ROLE TYPE (for multi-user accounts)
-- Role-based access control roles
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role_type') THEN
    CREATE TYPE public.member_role_type AS ENUM (
      'owner',       -- Full control, can delete account
      'accountant',  -- Financial management, no user management
      'staff'        -- Limited access, own transactions only
    );
    RAISE NOTICE 'Created enum: member_role_type';
  ELSE
    RAISE NOTICE 'Enum already exists: member_role_type';
  END IF;
END $$;

COMMENT ON TYPE public.member_role_type IS 'Roles for multi-user account access control';

-- ============================================================
-- RECORD MIGRATION
-- ============================================================
INSERT INTO public._migrations (name) 
VALUES ('002_enums.sql')
ON CONFLICT (name) DO NOTHING;
