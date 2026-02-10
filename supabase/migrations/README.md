# KOMPLEET Database Migrations

## Overview

This directory contains the Supabase database migrations for KOMPLEET, a Nigerian tax compliance platform.

## Migration Files

| File | Description |
|------|-------------|
| `001_init.sql` | Extensions, schemas, helper functions |
| `002_enums.sql` | All enum type definitions |
| `003_tables.sql` | Table definitions with indexes and constraints |
| `004_rls.sql` | Row Level Security policies |
| `005_triggers.sql` | Functions, triggers, and seed data |
| `rollback_all.sql` | Complete rollback script (development only) |

## Running Migrations

### Local Development (Supabase CLI)

```bash
# Start local Supabase
supabase start

# Apply all migrations
supabase db reset

# Apply new migrations only
supabase db push

# Generate migration from schema changes
supabase db diff -f migration_name
```

### Production (Supabase Dashboard)

1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order (001 → 005)
3. Or use the migration feature in the dashboard

### Direct PostgreSQL

```bash
# Connect to database
psql postgresql://postgres:password@localhost:54322/postgres

# Run migrations
\i supabase/migrations/001_init.sql
\i supabase/migrations/002_enums.sql
\i supabase/migrations/003_tables.sql
\i supabase/migrations/004_rls.sql
\i supabase/migrations/005_triggers.sql
```

## Migration Principles

### Idempotent Operations

All migrations are idempotent (safe to run multiple times):

```sql
-- Enum creation with existence check
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'my_enum') THEN
    CREATE TYPE my_enum AS ENUM ('value1', 'value2');
  END IF;
END $$;

-- Table with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS my_table (...);

-- Index with IF NOT EXISTS  
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- Trigger with DROP + CREATE
DROP TRIGGER IF EXISTS trigger_name ON table;
CREATE TRIGGER trigger_name ...;

-- Seed data with ON CONFLICT
INSERT INTO table (...) VALUES (...)
ON CONFLICT (id) DO UPDATE SET ...;
```

### Rollback Strategy

Each migration should have a corresponding rollback. The `rollback_all.sql` file provides a complete reset.

**⚠️ WARNING**: Never run `rollback_all.sql` on production!

## Schema Overview

### Core Tables

```
auth.users (Supabase managed)
    │
    ▼
profiles (1:1 with auth.users)
    │
    ├──► transactions
    │        │
    │        └──► categories (FK)
    │
    ├──► tax_calculations
    │
    ├──► reports
    │
    ├──► import_batches
    │        │
    │        └──► transactions (FK)
    │
    ├──► ai_category_overrides
    │
    ├──► ai_audit_logs
    │
    └──► audit_logs (immutable)
```

### Enums

| Enum | Values |
|------|--------|
| `entity_type` | individual, company |
| `transaction_type` | credit, debit |
| `tax_treatment_type` | taxable, deductible, exempt, non_deductible, capital |
| `category_group_type` | income, expense, transfer, tax, personal |
| `subscription_tier_type` | free, starter, professional, enterprise |
| `tax_type` | pit, cit, vat, wht |
| `audit_action_type` | create, update, delete, restore, export, login, logout |
| `report_status_type` | pending, generating, completed, failed |
| `import_status_type` | pending, processing, completed, failed, partial |
| `wht_category_type` | dividends, interest, royalties, rent, commission, etc. |
| `member_role_type` | owner, accountant, staff |

## RLS Policies Summary

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| profiles | Own only | Trigger | Own only | No |
| categories | All (auth) | Service | Service | Service |
| transactions | Own only | Own only | Own only | Own only |
| tax_calculations | Own only | Own only | Own (not final) | Own (not final) |
| reports | Own only | Own only | Own only | Own only |
| audit_logs | Own only | Service | No | No |
| import_batches | Own only | Own only | Own only | Own only |
| ai_category_overrides | Own only | Own only | Own only | Own only |
| ai_audit_logs | Own only | Own only | No | No |

## Triggers Summary

| Trigger | Table | Event | Purpose |
|---------|-------|-------|---------|
| on_auth_user_created | auth.users | INSERT | Create profile |
| on_auth_user_email_changed | auth.users | UPDATE | Sync email |
| tr_*_update_timestamp | All | UPDATE | Set updated_at |
| tr_transactions_set_hash | transactions | INSERT | Deduplication hash |
| tr_transactions_set_tax_year | transactions | INSERT | Auto tax year |
| tr_transactions_increment_count | transactions | INSERT | Usage tracking |
| tr_transactions_check_limit | transactions | INSERT | Enforce limits |
| tr_*_audit | transactions, tax_calculations | ALL | Audit logging |

## Seed Data

The `005_triggers.sql` migration includes seed data for:

- **Categories**: 25+ Nigerian tax categories with keywords
  - Income: Salary, Business Revenue, Interest, Dividends, Rental
  - Expenses: Office, Utilities, Rent, Professional Services, etc.
  - Personal: Non-deductible spending
  - Transfer: Internal transfers
  - Tax: Tax payments, Pension, NHF

## Testing Migrations

```bash
# Reset and run all migrations
supabase db reset

# Check for errors
supabase db lint

# Verify tables exist
psql -c "\dt public.*"

# Verify RLS is enabled
psql -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"

# Test as authenticated user
psql -c "SET request.jwt.claim.sub = 'user-uuid'; SELECT * FROM profiles;"
```

## Troubleshooting

### Migration Fails

1. Check if running in correct order (001 → 005)
2. Ensure extensions are enabled
3. Check for existing objects (migrations are idempotent)

### RLS Blocking Access

1. Verify user is authenticated
2. Check user_id matches auth.uid()
3. Test with service_role key to bypass RLS

### Trigger Errors

1. Check function exists before trigger
2. Verify SECURITY DEFINER for auth triggers
3. Check search_path settings
