# Type Safety & CI

**Last Updated**: February 19, 2026  
**Status**: ✅ Implemented

---

## Overview

The KOMPLEET platform uses TypeScript for type safety and has automated checks to ensure database schema changes are reflected in TypeScript types.

---

## Type Generation

### Supabase Types

TypeScript types are automatically generated from the Supabase database schema:

```bash
# Generate types from local Supabase instance
pnpm supabase gen types typescript --local > src/lib/supabase/types.ts

# Generate types from remote Supabase instance
pnpm supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
```

### Type Location

All Supabase-generated types are located in:
```
src/lib/supabase/types.ts
```

---

## Type Drift Detection

### What is Type Drift?

Type drift occurs when the database schema changes but the TypeScript types are not updated. This can lead to runtime errors that TypeScript cannot catch.

### Checking for Type Drift

Run the type drift check locally:

```bash
pnpm check:types
```

This script will:
1. Generate fresh types from your local Supabase instance
2. Compare them with the current types in `src/lib/supabase/types.ts`
3. Report any differences found

### Example Output

**✅ Types in sync:**
```bash
$ pnpm check:types
🔍 Checking for Supabase type drift...
📝 Generating fresh types from Supabase schema...
✅ Types are in sync with Supabase schema
```

**❌ Type drift detected:**
```bash
$ pnpm check:types
🔍 Checking for Supabase type drift...
📝 Generating fresh types from Supabase schema...
❌ Type drift detected!

The TypeScript types are out of sync with the Supabase schema.
Differences found:

< export interface Transaction {
<   amount: number;
---
> export interface Transaction {
>   amount: number;
>   tax_amount?: number;

To fix this, run:
  pnpm supabase gen types typescript --local > src/lib/supabase/types.ts
```

---

## CI/CD Integration

### GitHub Actions

The CI workflow includes a dedicated `typecheck` job that:

1. **Runs TypeScript Compiler** (`tsc --noEmit`)
   - Checks for type errors across the entire codebase
   - Fails the build if any type errors are found

2. **Type Drift Warning** (informational only)
   - Reminds developers to check for type drift locally
   - Does not fail the build (requires local Supabase instance)

### CI Workflow

```yaml
typecheck:
  name: typecheck
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
      with:
        version: 10
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - name: Run TypeScript type checking
      run: pnpm typecheck
    - name: Check for Supabase type drift
      run: |
        echo "⚠️  Supabase type drift check skipped in CI"
        echo "   Run 'pnpm check:types' locally to verify type sync"
      continue-on-error: true
```

---

## Best Practices

### When to Regenerate Types

Regenerate types whenever you:
- Add a new table to Supabase
- Modify a table schema (add/remove/change columns)
- Add or modify RLS policies that affect type definitions
- Update database functions or views
- Apply new migrations

### Development Workflow

1. **Make schema changes** in Supabase migration files
2. **Apply migrations** locally:
   ```bash
   pnpm supabase db reset
   ```
3. **Regenerate types**:
   ```bash
   pnpm supabase gen types typescript --local > src/lib/supabase/types.ts
   ```
4. **Verify no type drift**:
   ```bash
   pnpm check:types
   ```
5. **Run type checking**:
   ```bash
   pnpm typecheck
   ```
6. **Commit both migration and types** together

### Pre-commit Hook

The pre-commit hook automatically runs:
```bash
pnpm lint && pnpm typecheck && pnpm test
```

This ensures:
- ✅ Code is properly formatted
- ✅ No TypeScript errors
- ✅ All tests pass

---

## Type Safety Features

### 1. Supabase Client Type Safety

The Supabase client is fully typed:

```typescript
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';

const supabase = createClient<Database>();

// TypeScript knows the exact schema
const { data, error } = await supabase
  .from('transactions')  // ✅ Autocomplete for table names
  .select('*')
  .eq('user_id', userId);  // ✅ Autocomplete for column names

// data is typed as Transaction[]
data?.forEach(transaction => {
  console.log(transaction.amount);  // ✅ Type-safe property access
});
```

### 2. Type-Safe Query Wrappers

Custom query wrappers provide additional type safety:

```typescript
// src/lib/db/queries.ts
export async function getTransactionsByUser(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });
  
  if (error) throw error;
  return data;  // Return type is Transaction[]
}
```

### 3. Strict TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

---

## Troubleshooting

### Type Drift Check Fails

**Problem**: `pnpm check:types` reports type drift

**Solution**:
1. Review the differences shown in the output
2. If the schema changes are intentional, regenerate types:
   ```bash
   pnpm supabase gen types typescript --local > src/lib/supabase/types.ts
   ```
3. Commit the updated types with your schema changes

### Cannot Connect to Supabase

**Problem**: Type drift check shows "Could not connect to local Supabase"

**Solution**:
1. Start local Supabase:
   ```bash
   pnpm supabase start
   ```
2. Run the check again:
   ```bash
   pnpm check:types
   ```

### TypeScript Errors After Schema Change

**Problem**: TypeScript errors appear after applying a migration

**Solution**:
1. Regenerate types from the updated schema
2. Update code to match the new schema
3. Run typecheck to verify:
   ```bash
   pnpm typecheck
   ```

---

## Scripts Reference

| Script | Command | Description |
|---|---|---|
| **typecheck** | `pnpm typecheck` | Run TypeScript compiler without emitting files |
| **check:types** | `pnpm check:types` | Check for Supabase type drift |
| **gen:types** | `pnpm supabase gen types typescript --local > src/lib/supabase/types.ts` | Generate fresh types from Supabase |
| **precommit** | `pnpm precommit` | Run lint, typecheck, and tests before commit |
| **ci** | `pnpm ci` | Full CI pipeline (lint, typecheck, test, build) |

---

## Related Documentation

- **Security**: `/docs/SECURITY.md`
- **Bank Parsers**: `/docs/BANK_PARSERS.md`
- **AI Providers**: `/docs/AI_PROVIDERS.md`

---

**Type Safety Status**: ✅ **FULLY IMPLEMENTED**
