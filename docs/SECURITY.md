# KOMPLEET Platform - Security Documentation

## Overview

The KOMPLEET platform implements a **least-privilege security model** using Supabase Row Level Security (RLS) policies and restricted database permissions. This document explains the security architecture and how to work with it safely.

---

## Security Architecture

### 1. Row Level Security (RLS)

All tables in the `public` schema have RLS enabled. This means that even if a user has `SELECT` permission on a table, they can only access rows that match the RLS policy.

**Key Policies**:

| Table | Policy | Description |
|---|---|---|
| `profiles` | `profiles_select_own` | Users can only SELECT their own profile (WHERE `auth.uid() = id`) |
| `profiles` | `profiles_insert_own` | Users can only INSERT their own profile |
| `profiles` | `profiles_update_own` | Users can only UPDATE their own profile |
| `transactions` | `transactions_select_own` | Users can only SELECT their own transactions (WHERE `auth.uid() = user_id`) |
| `transactions` | `transactions_insert_own` | Users can only INSERT transactions for themselves |
| `transactions` | `transactions_update_own` | Users can only UPDATE their own transactions |
| `transactions` | `transactions_delete_own` | Users can only DELETE their own transactions |
| `categories` | `categories_select_all` | All authenticated users can read categories |
| `bank_configs` | `bank_configs_select_active` | All authenticated users can read active bank configs |
| `audit_logs` | `audit_logs_select_own` | Users can only view their own audit logs |

### 2. Role-Based Permissions

The platform uses three Supabase roles:

#### `authenticated` Role
- **Purpose**: For logged-in users
- **Permissions**:
  - `SELECT, INSERT, UPDATE` on `profiles`
  - `SELECT, INSERT, UPDATE, DELETE` on `transactions`
  - `SELECT` on `categories`, `bank_configs`, `audit_logs`, `clerk_users`
- **Enforcement**: All operations are further restricted by RLS policies

#### `service_role` Role
- **Purpose**: For server-side admin operations and monitoring
- **Permissions**:
  - `SELECT` on all tables (read-only)
  - `EXECUTE` on all functions
- **Usage**: Should only be used in server-side code, never exposed to the client

#### `anon` Role
- **Purpose**: For unauthenticated users
- **Permissions**: None (no table access)

### 3. Security Definer Functions

For complex operations that require additional validation or multi-table access, we provide **security definer functions**. These functions run with elevated privileges but enforce strict validation.

**Available Functions**:

- `bulk_insert_transactions(p_transactions jsonb)`: Bulk insert transactions for CSV import with error handling

---

## Working with the Security Model

### Client-Side Code (React Components)

When using the Supabase client in React components, RLS policies are automatically enforced. You can query tables directly:

```typescript
const supabase = createBrowserClient();

// This will only return the current user's transactions
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id); // RLS enforces this automatically
```

### Server-Side Code (API Routes)

In API routes, always use the **server client** with the user's session:

```typescript
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Query with RLS enforcement
  const { data, error } = await supabase
    .from('transactions')
    .select('*');
  
  // RLS ensures only the user's transactions are returned
  return NextResponse.json({ data });
}
```

### Using Security Definer Functions

For bulk operations, use the provided helper functions:

```typescript
import { bulkInsertTransactions } from '@/lib/db/functions';

const result = await bulkInsertTransactions(supabase, [
  {
    transaction_date: '2026-01-15',
    amount: 5000,
    description: 'Payment received',
    transaction_type: 'credit',
  },
  // ... more transactions
]);

console.log(`Inserted: ${result.data.inserted_count}, Failed: ${result.data.failed_count}`);
```

---

## Security Best Practices

### 1. Never Bypass RLS

**❌ Don't do this**:
```typescript
// Using service_role key to bypass RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);
const { data } = await supabase.from('transactions').select('*');
// This returns ALL users' transactions!
```

**✅ Do this**:
```typescript
// Use the authenticated user's session
const supabase = await createServerClient();
const { data } = await supabase.from('transactions').select('*');
// RLS ensures only the user's transactions are returned
```

### 2. Validate User Input

Always validate user input before passing it to the database:

```typescript
import { z } from 'zod';

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
});

const parsed = schema.safeParse(input);
if (!parsed.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

### 3. Use Type-Safe Queries

Always use the generated Supabase types:

```typescript
import { Database } from '@/lib/supabase/types';

const supabase: SupabaseClient<Database> = await createServerClient();
```

### 4. Log Security Events

Use the `audit_logs` table to track sensitive operations:

```typescript
await supabase.from('audit_logs').insert({
  user_id: user.id,
  calculation_type: 'tax_calculation',
  inputs: { year: 2025 },
  outputs: { tax_due: 50000 },
  rule_version_id: '...',
  rule_version_number: 'v1.0',
});
```

---

## Rollback Procedure

If the security hardening migration causes issues, you can roll it back:

```bash
# Apply the rollback migration
psql $DATABASE_URL -f supabase/migrations/20260219051749_security_hardening_rollback.sql
```

**Warning**: This will restore the previous broad permissions and should only be used in emergencies.

---

## Testing Security

To verify that RLS policies are working correctly, run the RLS policy tests:

```bash
pnpm test src/__tests__/rls/rls-policies.test.ts
```

These tests verify that:
- Users can only access their own data
- Unauthorized access is blocked
- Cross-user data leakage is prevented

---

## Reporting Security Issues

If you discover a security vulnerability, please report it to the security team immediately. Do not create a public GitHub issue.

**Contact**: security@kompleet.ng
