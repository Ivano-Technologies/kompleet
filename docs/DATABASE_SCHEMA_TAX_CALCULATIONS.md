# Tax Calculations Database Schema

**Table**: `tax_calculations`
**Status**: ✅ **Production Ready** (Created in migration `003_tables.sql`)
**RLS**: ✅ **Enabled** (Policies in `004_rls.sql`)

---

## Overview

The `tax_calculations` table stores saved tax calculation results for all tax types (CIT, PIT, VAT, WHT). Users can save calculation results, view their history, and retrieve saved calculations for reference or filing.

---

## Table Schema

```sql
CREATE TABLE IF NOT EXISTS public.tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Calculation type
  tax_type public.tax_type NOT NULL,  -- 'pit', 'cit', 'vat', 'wht'
  tax_year INTEGER NOT NULL,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Input data (stored as JSONB for flexibility)
  input_data JSONB NOT NULL DEFAULT '{}',

  -- Results
  gross_amount BIGINT NOT NULL,     -- In kobo (e.g., ₦1,000.00 = 100000)
  deductions BIGINT NOT NULL DEFAULT 0,
  taxable_amount BIGINT NOT NULL,   -- In kobo
  tax_due BIGINT NOT NULL,          -- In kobo
  effective_rate DECIMAL(5, 4),     -- e.g., 0.1850 = 18.50%

  -- Detailed breakdown
  breakdown JSONB NOT NULL DEFAULT '{}',

  -- Status
  is_final BOOLEAN NOT NULL DEFAULT FALSE,  -- Locked for filing

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT tax_calculations_amounts_positive CHECK (
    gross_amount >= 0 AND taxable_amount >= 0 AND tax_due >= 0
  ),
  CONSTRAINT tax_calculations_year_valid CHECK (
    tax_year >= 2000 AND tax_year <= 2100
  )
);
```

---

## Field Descriptions

### Primary Key
- **`id`** (UUID): Unique calculation ID, auto-generated

### Ownership & Context
- **`user_id`** (UUID): Foreign key to `profiles.id`, owner of this calculation
- **`tax_type`** (ENUM): Type of tax calculation
  - `'pit'` - Personal Income Tax
  - `'cit'` - Company Income Tax
  - `'vat'` - Value Added Tax
  - `'wht'` - Withholding Tax
- **`tax_year`** (INTEGER): Tax year (2000-2100), e.g., `2026`
- **`calculation_date`** (DATE): When calculation was performed, defaults to today

### Input Data
- **`input_data`** (JSONB): Flexible storage for calculation inputs
  - Structure varies by tax_type
  - Examples below

### Calculation Results
- **`gross_amount`** (BIGINT): Gross income/revenue in kobo
- **`deductions`** (BIGINT): Total deductions in kobo
- **`taxable_amount`** (BIGINT): Amount subject to tax in kobo
- **`tax_due`** (BIGINT): Calculated tax liability in kobo
- **`effective_rate`** (DECIMAL): Effective tax rate (e.g., 0.1850 = 18.50%)

> **Note**: All amounts are stored in **kobo** (1/100 of Naira) to avoid floating point precision issues.
> Convert for display: `amount_in_naira = amount_in_kobo / 100`

### Breakdown
- **`breakdown`** (JSONB): Detailed calculation breakdown
  - Band-by-band calculations (PIT)
  - Component breakdowns (CIT: tax + levy)
  - Threshold checks (VAT)
  - Examples below

### Status
- **`is_final`** (BOOLEAN): If `true`, calculation is locked and cannot be modified
  - Set to `true` when user marks calculation as "filed" or "finalized"
  - Prevents accidental edits to filed calculations
  - RLS policies prevent UPDATE/DELETE when `is_final = true`

### Timestamps
- **`created_at`** (TIMESTAMPTZ): When the calculation was created (auto-set)

---

## Row Level Security (RLS)

**Status**: ✅ **Enabled**

### Policies

1. **SELECT**: Users can only view their own calculations
   ```sql
   CREATE POLICY "tax_calculations_select_own" ON public.tax_calculations
     FOR SELECT TO authenticated
     USING (auth.uid() = user_id);
   ```

2. **INSERT**: Users can only create calculations for themselves
   ```sql
   CREATE POLICY "tax_calculations_insert_own" ON public.tax_calculations
     FOR INSERT TO authenticated
     WITH CHECK (auth.uid() = user_id);
   ```

3. **UPDATE**: Users can only edit their own non-finalized calculations
   ```sql
   CREATE POLICY "tax_calculations_update_own" ON public.tax_calculations
     FOR UPDATE TO authenticated
     USING (auth.uid() = user_id AND is_final = FALSE)
     WITH CHECK (auth.uid() = user_id);
   ```

4. **DELETE**: Users can only delete their own non-finalized calculations
   ```sql
   CREATE POLICY "tax_calculations_delete_own" ON public.tax_calculations
     FOR DELETE TO authenticated
     USING (auth.uid() = user_id AND is_final = FALSE);
   ```

---

## Example Records

### Personal Income Tax (PIT) Calculation

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "tax_type": "pit",
  "tax_year": 2026,
  "calculation_date": "2026-02-11",
  "input_data": {
    "grossIncome": 1500000000,
    "rentIncome": 200000000,
    "dividends": 100000000,
    "pensionContribution": 150000000,
    "nhf": 30000000
  },
  "gross_amount": 1500000000,
  "deductions": 180000000,
  "taxable_amount": 1320000000,
  "tax_due": 252000000,
  "effective_rate": 0.1909,
  "breakdown": {
    "bands": [
      {"min": 0, "max": 30000000, "rate": 0.07, "tax": 2100000},
      {"min": 30000000, "max": 60000000, "rate": 0.11, "tax": 3300000},
      {"min": 60000000, "max": 120000000, "rate": 0.15, "tax": 9000000},
      {"min": 120000000, "max": 240000000, "rate": 0.19, "tax": 22800000},
      {"min": 240000000, "rate": 0.21, "tax": 226800000}
    ],
    "personalRelief": 21500000,
    "rentRelief": 50000000,
    "pensionRelief": 150000000,
    "totalReliefs": 221500000
  },
  "is_final": false,
  "created_at": "2026-02-11T10:30:00Z"
}
```

### Company Income Tax (CIT) Calculation

```json
{
  "id": "660e9511-f39c-52e5-b827-557766551111",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "tax_type": "cit",
  "tax_year": 2026,
  "calculation_date": "2026-02-11",
  "input_data": {
    "turnover": 10000000000,
    "totalAssets": 5000000000,
    "assessableProfit": 2000000000
  },
  "gross_amount": 10000000000,
  "deductions": 0,
  "taxable_amount": 2000000000,
  "tax_due": 680000000,
  "effective_rate": 0.3400,
  "breakdown": {
    "companyIncomeTax": {
      "rate": 0.30,
      "amount": 600000000
    },
    "developmentLevy": {
      "rate": 0.04,
      "amount": 80000000
    },
    "totalTax": 680000000,
    "isExempt": false
  },
  "is_final": false,
  "created_at": "2026-02-11T11:15:00Z"
}
```

### VAT Compliance Check

```json
{
  "id": "770f0622-g40d-63f6-c938-668877662222",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "tax_type": "vat",
  "tax_year": 2026,
  "calculation_date": "2026-02-11",
  "input_data": {
    "annualTurnover": 15000000000,
    "totalAssets": 30000000000
  },
  "gross_amount": 15000000000,
  "deductions": 0,
  "taxable_amount": 15000000000,
  "tax_due": 1125000000,
  "effective_rate": 0.0750,
  "breakdown": {
    "isExempt": false,
    "exemptReason": null,
    "turnoverThreshold": 10000000000,
    "assetThreshold": 25000000000,
    "exceedsTurnoverThreshold": true,
    "exceedsAssetThreshold": true,
    "vatRate": 0.075,
    "estimatedVAT": 1125000000
  },
  "is_final": false,
  "created_at": "2026-02-11T12:00:00Z"
}
```

---

## API Usage

### Create (Save) a Calculation

```typescript
import { createServerClient } from '@/lib/supabase/server';

export async function saveTaxCalculation(
  userId: string,
  calculationData: {
    tax_type: 'pit' | 'cit' | 'vat' | 'wht';
    tax_year: number;
    input_data: any;
    gross_amount: number; // in kobo
    deductions: number;
    taxable_amount: number;
    tax_due: number;
    effective_rate: number;
    breakdown: any;
  }
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('tax_calculations')
    .insert({
      user_id: userId,
      ...calculationData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Retrieve User's Calculations

```typescript
export async function getUserCalculations(
  userId: string,
  filters?: {
    tax_type?: 'pit' | 'cit' | 'vat' | 'wht';
    tax_year?: number;
  }
) {
  const supabase = await createServerClient();

  let query = supabase
    .from('tax_calculations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.tax_type) {
    query = query.eq('tax_type', filters.tax_type);
  }

  if (filters?.tax_year) {
    query = query.eq('tax_year', filters.tax_year);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}
```

### Update a Calculation (if not finalized)

```typescript
export async function updateTaxCalculation(
  calculationId: string,
  updates: Partial<{
    input_data: any;
    gross_amount: number;
    deductions: number;
    taxable_amount: number;
    tax_due: number;
    effective_rate: number;
    breakdown: any;
  }>
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('tax_calculations')
    .update(updates)
    .eq('id', calculationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Finalize a Calculation (lock it)

```typescript
export async function finalizeCalculation(calculationId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('tax_calculations')
    .update({ is_final: true })
    .eq('id', calculationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Delete a Calculation (if not finalized)

```typescript
export async function deleteCalculation(calculationId: string) {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('tax_calculations')
    .delete()
    .eq('id', calculationId);

  if (error) throw error;
}
```

---

## Indexes

The table should have indexes on commonly queried columns for performance:

```sql
-- Index on user_id for fast filtering by user
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_id
  ON public.tax_calculations(user_id);

-- Composite index for user + tax_type filtering
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_tax_type
  ON public.tax_calculations(user_id, tax_type);

-- Composite index for user + tax_year filtering
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_tax_year
  ON public.tax_calculations(user_id, tax_year);

-- Index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_tax_calculations_created_at
  ON public.tax_calculations(created_at DESC);
```

> **Note**: Check if these indexes exist in migration `003_tables.sql`. If not, add them in a new migration.

---

## Best Practices

### Amount Storage
- ✅ **DO**: Store amounts in **kobo** (smallest currency unit)
- ❌ **DON'T**: Store amounts as floats or decimals for currency

### JSONB Fields
- ✅ **DO**: Validate JSON structure in application code before saving
- ✅ **DO**: Keep JSONB structure consistent per tax_type
- ❌ **DON'T**: Store excessive data in JSONB (>100KB)

### Finalization
- ✅ **DO**: Set `is_final = true` only when user explicitly confirms
- ✅ **DO**: Show clear warning before finalizing (cannot be undone)
- ❌ **DON'T**: Auto-finalize calculations

### Queries
- ✅ **DO**: Always filter by `user_id` first (uses RLS)
- ✅ **DO**: Use indexes for large datasets
- ✅ **DO**: Limit results for pagination (e.g., `.limit(20)`)

---

## Migration Status

| Migration File | Description | Status |
|----------------|-------------|--------|
| `002_enums.sql` | Created `tax_type` enum | ✅ Applied |
| `003_tables.sql` | Created `tax_calculations` table | ✅ Applied |
| `004_rls.sql` | Enabled RLS + policies | ✅ Applied |

---

## Next Steps for MVP

1. ✅ Table schema exists - no migration needed
2. 🔲 Create API routes for save/retrieve operations
3. 🔲 Add "Save to Account" button to calculators
4. 🔲 Build calculation history page
5. 🔲 Add export to PDF functionality for saved calculations

---

**Last Updated**: February 11, 2026
**Owner**: Backend Team
**Review Frequency**: Quarterly
