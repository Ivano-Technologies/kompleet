-- ============================================================
-- Migration: 005_triggers.sql
-- Description: Functions, triggers, and seed data
-- Created: 2026-01-29
-- 
-- TRIGGER NAMING CONVENTION: 
--   tr_{table}_{action}_{description}
-- FUNCTION NAMING CONVENTION:
--   fn_{description} or handle_{event}
-- ============================================================

-- ============================================================
-- FUNCTION: update_updated_at_column
-- Automatically updates updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically updates updated_at timestamp on row update';

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS tr_profiles_update_timestamp ON public.profiles;
CREATE TRIGGER tr_profiles_update_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_categories_update_timestamp ON public.categories;
CREATE TRIGGER tr_categories_update_timestamp
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_transactions_update_timestamp ON public.transactions;
CREATE TRIGGER tr_transactions_update_timestamp
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FUNCTION: handle_new_user
-- Creates profile when user signs up via Supabase Auth
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type public.entity_type;
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  -- Extract entity_type from metadata (default: individual)
  BEGIN
    v_entity_type := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'entity_type', ''),
      'individual'
    )::public.entity_type;
  EXCEPTION WHEN OTHERS THEN
    v_entity_type := 'individual';
  END;

  -- Extract full_name from multiple possible sources
  v_full_name := TRIM(COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    CONCAT_WS(' ',
      NULLIF(NEW.raw_user_meta_data->>'given_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'family_name', '')
    ),
    NULL
  ));
  
  -- Make empty string NULL
  IF v_full_name = '' THEN
    v_full_name := NULL;
  END IF;

  -- Extract and validate phone (E.164 format: +234...)
  v_phone := NEW.raw_user_meta_data->>'phone';
  IF v_phone IS NOT NULL AND v_phone !~ '^\+[1-9]\d{6,14}$' THEN
    v_phone := NULL;
  END IF;

  -- Insert profile (ON CONFLICT makes it idempotent)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    entity_type,
    subscription_tier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full_name,
    v_phone,
    v_entity_type,
    'free',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'handle_new_user error for user %: % [%]', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 'Creates user profile on Supabase Auth signup';

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: handle_user_email_change
-- Syncs email changes from auth.users to profiles
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if email actually changed
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET 
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_user_email_change IS 'Syncs email changes to profile';

-- Trigger on auth.users for email changes
DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_change();

-- ============================================================
-- FUNCTION: generate_transaction_hash
-- Generates SHA256 hash for deduplication
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_transaction_hash(
  p_date DATE,
  p_amount BIGINT,
  p_description TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN encode(
    sha256(
      convert_to(
        p_date::TEXT || '|' || p_amount::TEXT || '|' || LOWER(TRIM(p_description)),
        'UTF8'
      )
    ),
    'hex'
  );
END;
$$;

COMMENT ON FUNCTION public.generate_transaction_hash IS 'Generates SHA256 hash for transaction deduplication';

-- ============================================================
-- FUNCTION: set_transaction_hash
-- Trigger function to auto-set hash on insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_transaction_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set hash if not provided
  IF NEW.hash IS NULL OR NEW.hash = '' THEN
    NEW.hash := public.generate_transaction_hash(
      NEW.transaction_date,
      NEW.amount,
      NEW.description
    );
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_transaction_hash IS 'Auto-generates transaction hash for deduplication';

-- Trigger on transactions
DROP TRIGGER IF EXISTS tr_transactions_set_hash ON public.transactions;
CREATE TRIGGER tr_transactions_set_hash
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_transaction_hash();

-- ============================================================
-- FUNCTION: determine_tax_year
-- Determines tax year from transaction date
-- ============================================================

CREATE OR REPLACE FUNCTION public.determine_tax_year(p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Nigeria uses calendar year for tax year
  RETURN EXTRACT(YEAR FROM p_date)::INTEGER;
END;
$$;

COMMENT ON FUNCTION public.determine_tax_year IS 'Determines Nigerian tax year from date';

-- ============================================================
-- FUNCTION: set_transaction_tax_year
-- Trigger to auto-set tax_year from transaction_date
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_transaction_tax_year()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set tax_year if not provided
  IF NEW.tax_year IS NULL OR NEW.tax_year = 0 THEN
    NEW.tax_year := public.determine_tax_year(NEW.transaction_date);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_transactions_set_tax_year ON public.transactions;
CREATE TRIGGER tr_transactions_set_tax_year
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_transaction_tax_year();

-- ============================================================
-- FUNCTION: increment_transaction_count
-- Increments monthly transaction count for user
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_transaction_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    monthly_transaction_count = monthly_transaction_count + 1,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_transactions_increment_count ON public.transactions;
CREATE TRIGGER tr_transactions_increment_count
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_transaction_count();

-- ============================================================
-- FUNCTION: check_transaction_limit
-- Checks if user has exceeded transaction limit
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_transaction_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier public.subscription_tier_type;
  v_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user's subscription tier and count
  SELECT subscription_tier, monthly_transaction_count
  INTO v_tier, v_count
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Determine limit based on tier
  v_limit := CASE v_tier
    WHEN 'free' THEN 50
    WHEN 'starter' THEN 500
    WHEN 'professional' THEN 999999
    WHEN 'enterprise' THEN 999999
    ELSE 50
  END;
  
  -- Check limit
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Transaction limit exceeded for % tier (limit: %)', v_tier, v_limit
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_transactions_check_limit ON public.transactions;
CREATE TRIGGER tr_transactions_check_limit
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_transaction_limit();

-- ============================================================
-- FUNCTION: reset_monthly_transaction_count
-- Resets transaction count monthly (called by cron)
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_monthly_transaction_counts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE public.profiles
  SET 
    monthly_transaction_count = 0,
    last_transaction_reset = NOW(),
    updated_at = NOW()
  WHERE last_transaction_reset < DATE_TRUNC('month', NOW());
  
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  
  RETURN v_affected;
END;
$$;

COMMENT ON FUNCTION public.reset_monthly_transaction_counts IS 'Resets monthly transaction counts (call via pg_cron)';

-- ============================================================
-- FUNCTION: log_audit_event
-- Creates audit log entry
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_action public.audit_action_type;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  -- Determine user_id
  v_user_id := COALESCE(
    NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END
  );
  
  -- Skip if no user context
  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Determine action
  v_action := CASE TG_OP
    WHEN 'INSERT' THEN 'create'
    WHEN 'UPDATE' THEN 'update'
    WHEN 'DELETE' THEN 'delete'
  END;
  
  -- Prepare data
  v_old_data := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') 
    THEN to_jsonb(OLD) 
    ELSE NULL 
  END;
  
  v_new_data := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') 
    THEN to_jsonb(NEW) 
    ELSE NULL 
  END;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    created_at
  ) VALUES (
    v_user_id,
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_data,
    v_new_data,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail main operation if audit logging fails
    RAISE WARNING 'Audit log failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.log_audit_event IS 'Creates audit log entry for data changes';

-- Apply audit logging to critical tables
DROP TRIGGER IF EXISTS tr_transactions_audit ON public.transactions;
CREATE TRIGGER tr_transactions_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS tr_tax_calculations_audit ON public.tax_calculations;
CREATE TRIGGER tr_tax_calculations_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.tax_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_event();

-- ============================================================
-- FUNCTION: soft_delete (instead of hard delete)
-- ============================================================

CREATE OR REPLACE FUNCTION public.soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Instead of deleting, set deleted_at
  UPDATE public.transactions
  SET deleted_at = NOW()
  WHERE id = OLD.id;
  
  -- Return NULL to prevent actual delete
  RETURN NULL;
END;
$$;

-- Optional: Convert deletes to soft deletes
-- Uncomment if you want this behavior
-- DROP TRIGGER IF EXISTS tr_transactions_soft_delete ON public.transactions;
-- CREATE TRIGGER tr_transactions_soft_delete
--   BEFORE DELETE ON public.transactions
--   FOR EACH ROW
--   EXECUTE FUNCTION public.soft_delete();

-- ============================================================
-- FUNCTION: normalize_description
-- Normalizes transaction description for matching
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_description(p_description TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      TRIM(p_description),
      '[^a-zA-Z0-9\s]',
      '',
      'g'
    )
  );
END;
$$;

COMMENT ON FUNCTION public.normalize_description IS 'Normalizes transaction description for AI matching';

-- ============================================================
-- FUNCTION: generate_description_hash
-- Generates hash for description matching
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_description_hash(p_description TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN encode(
    sha256(
      convert_to(
        public.normalize_description(p_description),
        'UTF8'
      )
    ),
    'hex'
  );
END;
$$;

-- ============================================================
-- FUNCTION: kobo_to_naira
-- Converts kobo to naira (for display)
-- ============================================================

CREATE OR REPLACE FUNCTION public.kobo_to_naira(p_kobo BIGINT)
RETURNS DECIMAL(15, 2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN p_kobo / 100.0;
END;
$$;

-- ============================================================
-- FUNCTION: naira_to_kobo
-- Converts naira to kobo (for storage)
-- ============================================================

CREATE OR REPLACE FUNCTION public.naira_to_kobo(p_naira DECIMAL)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN ROUND(p_naira * 100)::BIGINT;
END;
$$;

-- ============================================================
-- SEED DATA: Categories
-- ============================================================

INSERT INTO public.categories (id, name, description, category_group, tax_treatment, keywords, wht_category, vat_applicable, is_system, display_order)
VALUES
  -- INCOME
  ('11111111-0000-0000-0001-000000000001', 'Salary & Wages', 'Employment income including allowances', 'income', 'taxable', 
    ARRAY['salary', 'wage', 'payroll', 'pay', 'employment', 'staff', 'allowance', 'bonus'], 
    NULL, FALSE, TRUE, 1),
  
  ('11111111-0000-0000-0001-000000000002', 'Business Revenue', 'Income from business operations', 'income', 'taxable', 
    ARRAY['revenue', 'sales', 'invoice', 'payment received', 'income', 'service fee', 'contract'], 
    NULL, TRUE, TRUE, 2),
  
  ('11111111-0000-0000-0001-000000000003', 'Interest Income', 'Interest from bank accounts and investments', 'income', 'taxable', 
    ARRAY['interest', 'interest earned', 'savings interest', 'deposit interest'], 
    'interest', FALSE, TRUE, 3),
  
  ('11111111-0000-0000-0001-000000000004', 'Dividend Income', 'Dividends from investments', 'income', 'taxable', 
    ARRAY['dividend', 'stock dividend', 'share dividend', 'investment income'], 
    'dividends', FALSE, TRUE, 4),
  
  ('11111111-0000-0000-0001-000000000005', 'Rental Income', 'Income from property rental', 'income', 'taxable', 
    ARRAY['rent', 'rental', 'lease', 'tenant', 'property income', 'accommodation'], 
    'rent', FALSE, TRUE, 5),
  
  ('11111111-0000-0000-0001-000000000006', 'Other Income', 'Miscellaneous income', 'income', 'taxable', 
    ARRAY['other income', 'miscellaneous', 'sundry'], 
    NULL, TRUE, TRUE, 6),
  
  -- DEDUCTIBLE EXPENSES
  ('11111111-0000-0000-0002-000000000001', 'Office Expenses', 'Office supplies and stationery', 'expense', 'deductible', 
    ARRAY['office', 'supplies', 'stationery', 'paper', 'printing', 'toner'], 
    NULL, TRUE, TRUE, 10),
  
  ('11111111-0000-0000-0002-000000000002', 'Utilities', 'Electricity, water, internet, and phone', 'expense', 'deductible', 
    ARRAY['electricity', 'water', 'internet', 'utility', 'phcn', 'nepa', 'mtn', 'airtel', 'glo', 'data', 'phone', 'mobile'], 
    NULL, TRUE, TRUE, 11),
  
  ('11111111-0000-0000-0002-000000000003', 'Rent & Lease', 'Office or business premises rent', 'expense', 'deductible', 
    ARRAY['rent', 'lease', 'premises', 'office rent', 'shop rent'], 
    'rent', FALSE, TRUE, 12),
  
  ('11111111-0000-0000-0002-000000000004', 'Professional Services', 'Legal, accounting, and consulting fees', 'expense', 'deductible', 
    ARRAY['legal', 'accounting', 'consulting', 'professional', 'lawyer', 'auditor', 'consultant'], 
    'consultancy', TRUE, TRUE, 13),
  
  ('11111111-0000-0000-0002-000000000005', 'Travel & Transport', 'Business travel and transportation', 'expense', 'deductible', 
    ARRAY['travel', 'transport', 'uber', 'bolt', 'taxi', 'flight', 'air ticket', 'fuel', 'petrol', 'diesel'], 
    NULL, TRUE, TRUE, 14),
  
  ('11111111-0000-0000-0002-000000000006', 'Marketing & Advertising', 'Promotional and marketing expenses', 'expense', 'deductible', 
    ARRAY['marketing', 'advertising', 'promotion', 'ad', 'advert', 'social media', 'google ads', 'facebook'], 
    NULL, TRUE, TRUE, 15),
  
  ('11111111-0000-0000-0002-000000000007', 'Insurance', 'Business insurance premiums', 'expense', 'deductible', 
    ARRAY['insurance', 'premium', 'policy', 'cover', 'naicom'], 
    NULL, FALSE, TRUE, 16),
  
  ('11111111-0000-0000-0002-000000000008', 'Bank Charges', 'Bank fees, charges, and SMS alerts', 'expense', 'deductible', 
    ARRAY['bank charge', 'sms alert', 'maintenance fee', 'atm', 'pos', 'stamp duty', 'cot', 'commission'], 
    NULL, FALSE, TRUE, 17),
  
  ('11111111-0000-0000-0002-000000000009', 'Software & Subscriptions', 'Software licenses and SaaS subscriptions', 'expense', 'deductible', 
    ARRAY['software', 'subscription', 'license', 'saas', 'cloud', 'microsoft', 'google', 'slack', 'zoom'], 
    'royalties', TRUE, TRUE, 18),
  
  ('11111111-0000-0000-0002-000000000010', 'Equipment & Supplies', 'Business equipment purchases', 'expense', 'deductible', 
    ARRAY['equipment', 'machinery', 'computer', 'laptop', 'printer', 'phone', 'supplies'], 
    NULL, TRUE, TRUE, 19),
  
  ('11111111-0000-0000-0002-000000000011', 'Staff Welfare', 'Employee welfare and benefits', 'expense', 'deductible', 
    ARRAY['welfare', 'staff', 'employee', 'lunch', 'refreshment', 'training'], 
    NULL, TRUE, TRUE, 20),
  
  ('11111111-0000-0000-0002-000000000012', 'Repairs & Maintenance', 'Repairs and maintenance expenses', 'expense', 'deductible', 
    ARRAY['repair', 'maintenance', 'service', 'fix', 'servicing'], 
    'technical_services', TRUE, TRUE, 21),
  
  -- NON-DEDUCTIBLE EXPENSES  
  ('11111111-0000-0000-0003-000000000001', 'Personal Expenses', 'Non-business personal spending', 'personal', 'non_deductible', 
    ARRAY['personal', 'shopping', 'food', 'restaurant', 'entertainment', 'cinema', 'party'], 
    NULL, TRUE, TRUE, 30),
  
  ('11111111-0000-0000-0003-000000000002', 'Loan Principal', 'Principal portion of loan repayments', 'expense', 'non_deductible', 
    ARRAY['loan', 'repayment', 'principal', 'mortgage'], 
    NULL, FALSE, TRUE, 31),
  
  ('11111111-0000-0000-0003-000000000003', 'Donations & Gifts', 'Non-qualifying donations', 'expense', 'non_deductible', 
    ARRAY['donation', 'gift', 'charity', 'tithe', 'offering'], 
    NULL, FALSE, TRUE, 32),
  
  ('11111111-0000-0000-0003-000000000004', 'Fines & Penalties', 'Government fines and penalties', 'expense', 'non_deductible', 
    ARRAY['fine', 'penalty', 'lastma', 'frsc', 'court'], 
    NULL, FALSE, TRUE, 33),
  
  -- TRANSFERS
  ('11111111-0000-0000-0004-000000000001', 'Internal Transfer', 'Transfers between own accounts', 'transfer', 'exempt', 
    ARRAY['transfer', 'own account', 'self', 'between accounts'], 
    NULL, FALSE, TRUE, 40),
  
  ('11111111-0000-0000-0004-000000000002', 'Investment Transfer', 'Transfers to/from investment accounts', 'transfer', 'exempt', 
    ARRAY['investment', 'stock', 'shares', 'mutual fund', 'money market'], 
    NULL, FALSE, TRUE, 41),
  
  -- TAX PAYMENTS
  ('11111111-0000-0000-0005-000000000001', 'Tax Payment', 'Payments to tax authorities', 'tax', 'exempt', 
    ARRAY['tax', 'firs', 'paye', 'vat payment', 'wht payment', 'lirs', 'jtb'], 
    NULL, FALSE, TRUE, 50),
  
  ('11111111-0000-0000-0005-000000000002', 'Pension Contribution', 'Pension fund contributions', 'tax', 'deductible', 
    ARRAY['pension', 'pencom', 'pfa', 'rsa', 'retirement'], 
    NULL, FALSE, TRUE, 51),
  
  ('11111111-0000-0000-0005-000000000003', 'NHF Contribution', 'National Housing Fund contributions', 'tax', 'deductible', 
    ARRAY['nhf', 'housing fund', 'national housing'], 
    NULL, FALSE, TRUE, 52)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_group = EXCLUDED.category_group,
  tax_treatment = EXCLUDED.tax_treatment,
  keywords = EXCLUDED.keywords,
  wht_category = EXCLUDED.wht_category,
  vat_applicable = EXCLUDED.vat_applicable,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================
-- RECORD MIGRATION
-- ============================================================

INSERT INTO public._migrations (name) 
VALUES ('005_triggers.sql')
ON CONFLICT (name) DO NOTHING;
