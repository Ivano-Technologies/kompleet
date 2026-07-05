# KOMPLEET Platform - Clerk Authentication Developer Guide

## Overview

This guide explains how to use Clerk authentication with Supabase in the KOMPLEET platform.

---

## Architecture

```
User → Clerk (Authentication) → JWT Token → Supabase (Database + RLS)
                                     ↓
                                 Webhook → clerk_users table
```

**Key Components:**

1. **Clerk**: Handles user authentication, session management, and JWT generation
2. **Supabase**: Database with Row Level Security (RLS) that validates Clerk JWTs
3. **Webhook**: Syncs user data from Clerk to Supabase `clerk_users` table
4. **RLS Policies**: Automatically filter data based on Clerk user ID from JWT

---

## Client-Side Usage (React Components)

### Using Clerk Authentication

```tsx
"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useSupabaseClerk } from "@/lib/supabase-clerk";
import { useEffect, useState } from "react";

export default function MyComponent() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const supabase = useSupabaseClerk();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (isSignedIn) {
      fetchTransactions();
    }
  }, [isSignedIn]);

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching transactions:", error);
      return;
    }

    setTransactions(data);
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id}>{tx.description}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Protecting Client Components

```tsx
"use client";

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function ProtectedPage() {
  return (
    <>
      <SignedIn>
        {/* Content visible only to signed-in users */}
        <h1>Protected Content</h1>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
```

---

## Server-Side Usage (API Routes)

### Basic API Route with Clerk Auth

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseClerkClient } from "@/lib/supabase-clerk";

export async function GET() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseClerkClient(getToken);

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

### API Route with POST Request

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClerkClient } from "@/lib/supabase-clerk";

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createSupabaseClerkClient(getToken);

  // Insert transaction (RLS will automatically set clerk_user_id)
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      description: body.description,
      amount: body.amount,
      transaction_type: body.type,
      transaction_date: body.date,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
```

---

## Server Components

### Using Clerk in Server Components

```tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseClerkClient } from "@/lib/supabase-clerk";

export default async function ServerPage() {
  const { userId, getToken } = await auth();
  const user = await currentUser();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const supabase = await createSupabaseClerkClient(getToken);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .limit(10);

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <ul>
        {transactions?.map((tx) => (
          <li key={tx.id}>{tx.description}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Middleware (Route Protection)

### Protect Routes with Middleware

Update `src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
  "/",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

---

## Database Queries

### Inserting Data

```typescript
// RLS policies will automatically populate clerk_user_id
const { data, error } = await supabase
  .from("transactions")
  .insert({
    description: "Office supplies",
    amount: 150.0,
    transaction_type: "expense",
    transaction_date: new Date().toISOString(),
  })
  .select()
  .single();
```

### Querying Data

```typescript
// RLS automatically filters to current user's data
const { data, error } = await supabase
  .from("transactions")
  .select("*")
  .order("transaction_date", { ascending: false });
```

### Updating Data

```typescript
// Can only update own records due to RLS
const { data, error } = await supabase
  .from("transactions")
  .update({ description: "Updated description" })
  .eq("id", transactionId)
  .select()
  .single();
```

### Deleting Data

```typescript
// Can only delete own records due to RLS
const { error } = await supabase
  .from("transactions")
  .delete()
  .eq("id", transactionId);
```

---

## Common Patterns

### Check if User Exists in Database

```typescript
const { userId } = await auth();

if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const supabase = await createSupabaseClerkClient(getToken);

const { data: user, error } = await supabase
  .from("clerk_users")
  .select("*")
  .eq("clerk_user_id", userId)
  .single();

if (error || !user) {
  // User not synced yet, webhook might still be processing
  return NextResponse.json(
    { error: "User not found in database" },
    { status: 404 },
  );
}
```

### Create Profile on First Login

```typescript
const { userId, getToken } = await auth();
const user = await currentUser();

if (!userId || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const supabase = await createSupabaseClerkClient(getToken);

// Check if profile exists
const { data: existingProfile } = await supabase
  .from("profiles")
  .select("*")
  .eq("clerk_user_id", userId)
  .single();

if (!existingProfile) {
  // Create profile
  await supabase.from("profiles").insert({
    clerk_user_id: userId,
    email: user.emailAddresses[0]?.emailAddress,
    full_name: `${user.firstName} ${user.lastName}`,
  });
}
```

---

## Error Handling

### Handle Authentication Errors

```typescript
try {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const supabase = await createSupabaseClerkClient(getToken);

  const { data, error } = await supabase.from("transactions").select("*");

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json(
      {
        error: "Database error",
        code: "DATABASE_ERROR",
        details: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
} catch (error) {
  console.error("Unexpected error:", error);
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
```

---

## Testing

### Test Authentication Flow

1. **Sign up a new user** via Clerk UI
2. **Check webhook logs** in Clerk Dashboard
3. **Verify user in Supabase:**
   ```sql
   SELECT * FROM clerk_users WHERE clerk_user_id = 'user_xxx';
   ```
4. **Test API endpoint:**
   ```bash
   curl -H "Authorization: Bearer <clerk_jwt>" \
        https://techivano.com/api/example-clerk-auth
   ```

### Test RLS Policies

```sql
-- Test as authenticated user (simulates Clerk JWT)
SET request.jwt.claims = '{"sub": "user_39LS1QcvTQ2aoF0D9cwNcUWHFi2"}';

-- Should only return this user's transactions
SELECT * FROM transactions;

-- Should fail (trying to access another user's data)
SELECT * FROM transactions WHERE clerk_user_id = 'user_different';
```

---

## Migration from Supabase Auth

### Gradual Migration Strategy

1. **Phase 1:** Deploy Clerk integration (both auth systems work)
2. **Phase 2:** New users use Clerk, existing users use Supabase Auth
3. **Phase 3:** Encourage existing users to re-authenticate with Clerk
4. **Phase 4:** Deprecate Supabase Auth after all users migrated

### Link Existing Users

```sql
-- Link existing profiles to Clerk users by email
UPDATE profiles p
SET clerk_user_id = cu.clerk_user_id
FROM clerk_users cu
WHERE p.email = cu.email
AND p.clerk_user_id IS NULL;
```

---

## Troubleshooting

### Issue: "Unauthorized" error when accessing Supabase

**Solution:** Verify JWT template name matches in code (`kompleet-supabase`)

### Issue: User not found in database

**Solution:** Check webhook logs in Clerk Dashboard, verify webhook secret is correct

### Issue: RLS blocking access

**Solution:** Verify JWT claims contain correct `sub` field (Clerk user ID)

### Issue: Webhook not firing

**Solution:** Check Clerk Dashboard → Webhooks → Logs for delivery errors

---

## Best Practices

1. ✅ **Always check authentication** before accessing Supabase
2. ✅ **Use `useSupabaseClerk()` in client components**
3. ✅ **Use `createSupabaseClerkClient()` in API routes**
4. ✅ **Never expose service role key** in client-side code
5. ✅ **Handle webhook failures** gracefully (retry logic)
6. ✅ **Log authentication errors** for debugging
7. ✅ **Test RLS policies** thoroughly before production

---

## Resources

- **Clerk Documentation:** https://clerk.com/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Clerk + Supabase Guide:** https://clerk.com/docs/integrations/databases/supabase

---

**Last Updated:** 2026-02-07
