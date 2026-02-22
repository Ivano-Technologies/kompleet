# KOMPLEET Platform - Clerk Integration Guide

## ✅ Phase 1: Database Migration (COMPLETED)

The Clerk-Supabase sync migration has been successfully deployed. Your database now supports both Clerk and Supabase Auth during the migration period.

---

## 🔧 Phase 2: Configure Supabase to Accept Clerk JWTs

### Step 1: Get Clerk JWT Template

1. Go to **Clerk Dashboard** → https://dashboard.clerk.com
2. Navigate to **JWT Templates** (in the left sidebar)
3. Click **"New template"**
4. Select **"Supabase"** template
5. Name it: `kompleet-supabase`
6. **Copy the JWKS endpoint URL** (looks like: `https://YOUR_DOMAIN.clerk.accounts.dev/.well-known/jwks.json`)

### Step 2: Configure Supabase JWT Settings

1. Go to **Supabase Dashboard** → https://supabase.com/dashboard/project/frlcvkmjuhnjcicwywrh/settings/auth
2. Scroll to **"JWT Settings"**
3. Click **"Add new JWT secret"**
4. Paste the Clerk JWKS URL from Step 1
5. Click **"Save"**

### Step 3: Update Supabase JWT Verification (Alternative Method)

If the JWKS URL method doesn't work, use this SQL command in Supabase SQL Editor:

```sql
-- Configure Supabase to accept Clerk JWTs
-- Replace YOUR_CLERK_DOMAIN with your actual Clerk domain (e.g., large-cattle-80.clerk.accounts.dev)

ALTER DATABASE postgres SET "app.jwt.secret" TO 'https://YOUR_CLERK_DOMAIN/.well-known/jwks.json';
```

---

## 🔗 Phase 3: Set Up Clerk Webhooks for User Sync

### Step 1: Create Webhook Endpoint in Web Platform

Create a new API route: `src/app/api/webhooks/clerk/route.ts`

```typescript
import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  // Get the event type
  const eventType = evt.type;

  // Create Supabase client with service role
  const supabase = createClient();

  if (eventType === "user.created" || eventType === "user.updated") {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      last_sign_in_at,
    } = evt.data;

    const email = email_addresses[0]?.email_address || "";
    const full_name = [first_name, last_name].filter(Boolean).join(" ");

    // Upsert user in clerk_users table
    const { error } = await supabase.from("clerk_users").upsert(
      {
        clerk_user_id: id,
        email,
        full_name,
        profile_image_url: image_url,
        last_sign_in_at: last_sign_in_at
          ? new Date(last_sign_in_at).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "clerk_user_id",
      },
    );

    if (error) {
      console.error("Error syncing user to Supabase:", error);
      return new Response("Error: Failed to sync user", { status: 500 });
    }

    console.log(`User ${eventType}: ${id} synced to Supabase`);
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    // Delete user from clerk_users table
    const { error } = await supabase
      .from("clerk_users")
      .delete()
      .eq("clerk_user_id", id);

    if (error) {
      console.error("Error deleting user from Supabase:", error);
      return new Response("Error: Failed to delete user", { status: 500 });
    }

    console.log(`User deleted: ${id} removed from Supabase`);
  }

  return new Response("Webhook processed successfully", { status: 200 });
}
```

### Step 2: Install Required Dependencies

```bash
cd /home/ubuntu/kompleet-platform
npm install svix
```

### Step 3: Configure Clerk Webhook

1. Go to **Clerk Dashboard** → **Webhooks**
2. Click **"Add Endpoint"**
3. Enter endpoint URL: `https://techivano.com/api/webhooks/clerk`
4. Select events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
5. Click **"Create"**
6. **Copy the Signing Secret** (starts with `whsec_...`)

### Step 4: Add Webhook Secret to Vercel

Add this environment variable to Vercel:

```
CLERK_WEBHOOK_SECRET=whsec_YOUR_SIGNING_SECRET
```

---

## 🌐 Phase 4: Update Web Platform Code

### Step 1: Update Supabase Client to Use Clerk JWT

Create a new Supabase client helper: `src/lib/supabase/client-clerk.ts`

```typescript
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";

export function useSupabaseClerk() {
  const { getToken } = useAuth();

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: async () => {
          const token = await getToken({ template: "kompleet-supabase" });
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      },
    },
  );

  return supabase;
}
```

### Step 2: Update Environment Variables

Add to `.env.local`:

```env
# Supabase (already exists)
NEXT_PUBLIC_SUPABASE_URL=https://frlcvkmjuhnjcicwywrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Clerk (already exists)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGFyZ2UtY2F0dGxlLTgwLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_XGHLDsxWPLQNXBIOmJw5wd2szYlqatAzaSYoEm02WU

# Clerk Webhook (new)
CLERK_WEBHOOK_SECRET=whsec_YOUR_SIGNING_SECRET

# Database Connection String (for server-side operations)
DATABASE_URL=postgresql://postgres.frlcvkmjuhnjcicwywrh:P1n857yXmUSTnUK1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## 📱 Phase 5: Update Mobile Platform Code

### Step 1: Install Clerk React Native SDK

```bash
cd /home/ubuntu/kompleet-mobile
npm install @clerk/clerk-expo
```

### Step 2: Configure Clerk in Mobile App

Update `app/_layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      {/* Your app content */}
    </ClerkProvider>
  );
}
```

### Step 3: Create Supabase Client with Clerk JWT (Mobile)

Create `lib/supabase-clerk.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/clerk-expo";

export function useSupabaseClerk() {
  const { getToken } = useAuth();

  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: async () => {
          const token = await getToken({ template: "kompleet-supabase" });
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      },
    },
  );

  return supabase;
}
```

### Step 4: Add Environment Variables (Mobile)

Create `.env` file:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGFyZ2UtY2F0dGxlLTgwLmNsZXJrLmFjY291bnRzLmRldiQ
EXPO_PUBLIC_SUPABASE_URL=https://frlcvkmjuhnjcicwywrh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## ✅ Phase 6: Verification Checklist

### Database Verification

Run this in Supabase SQL Editor:

```sql
-- Check clerk_users table exists
SELECT * FROM public.clerk_users LIMIT 5;

-- Check clerk_user_id columns added
SELECT column_name FROM information_schema.columns
WHERE table_name = 'transactions' AND column_name = 'clerk_user_id';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'clerk_user_id';

-- Check helper functions exist
SELECT proname FROM pg_proc WHERE proname IN ('get_clerk_user_id', 'get_current_user_id');
```

### Web Platform Verification

1. ✅ Clerk middleware configured
2. ✅ Login/signup pages use Clerk components
3. ✅ Webhook endpoint created
4. ✅ Environment variables added to Vercel
5. ✅ Supabase client uses Clerk JWT

### Mobile Platform Verification

1. ✅ Clerk SDK installed
2. ✅ ClerkProvider configured
3. ✅ Supabase client uses Clerk JWT
4. ✅ Environment variables configured

---

## 🚀 Deployment Steps

### 1. Deploy Web Platform

```bash
cd /home/ubuntu/kompleet-platform

# Commit changes
git add .
git commit -m "feat: Integrate Clerk authentication with Supabase sync"
git push origin main

# Vercel will auto-deploy
```

### 2. Add Environment Variables to Vercel

Go to Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGFyZ2UtY2F0dGxlLTgwLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_XGHLDsxWPLQNXBIOmJw5wd2szYlqatAzaSYoEm02WU
CLERK_WEBHOOK_SECRET=whsec_YOUR_SIGNING_SECRET
NEXT_PUBLIC_SUPABASE_URL=https://frlcvkmjuhnjcicwywrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=postgresql://postgres.frlcvkmjuhnjcicwywrh:P1n857yXmUSTnUK1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### 3. Redeploy After Adding Env Vars

Trigger a new deployment in Vercel after adding environment variables.

---

## 🧪 Testing

### Test User Creation Flow

1. Sign up a new user via Clerk
2. Check Clerk Dashboard → Users (user should appear)
3. Check Supabase → clerk_users table (user should be synced)
4. Try accessing protected routes
5. Verify transactions can be created with clerk_user_id

### Test Authentication Flow

1. **Web:** Visit https://techivano.com → Sign in with Clerk
2. **Mobile:** Open app → Sign in with Clerk
3. **Database:** Verify user appears in `clerk_users` table
4. **API:** Test creating a transaction (should populate `clerk_user_id`)

---

## 📊 Migration Strategy

### Gradual Migration Plan

1. **Week 1:** Deploy Clerk integration (both auth systems work)
2. **Week 2:** Encourage existing users to re-authenticate with Clerk
3. **Week 3:** Monitor adoption, fix issues
4. **Week 4:** Deprecate Supabase Auth, remove fallback policies

### Data Migration Script

Run this to link existing Supabase users to Clerk (after users sign in with Clerk):

```sql
-- Link existing profiles to Clerk users by email
UPDATE public.profiles p
SET clerk_user_id = cu.clerk_user_id
FROM public.clerk_users cu
WHERE p.email = cu.email
AND p.clerk_user_id IS NULL;

-- Link existing transactions to Clerk users
UPDATE public.transactions t
SET clerk_user_id = p.clerk_user_id
FROM public.profiles p
WHERE t.user_id = p.id
AND t.clerk_user_id IS NULL
AND p.clerk_user_id IS NOT NULL;
```

---

## 🆘 Troubleshooting

### Issue: Webhook not receiving events

**Solution:** Check Clerk Dashboard → Webhooks → View logs for errors

### Issue: JWT verification fails

**Solution:** Verify JWT template name matches in code (`kompleet-supabase`)

### Issue: User not synced to Supabase

**Solution:** Check webhook endpoint logs, verify service role permissions

### Issue: RLS policies blocking access

**Solution:** Verify JWT claims contain correct `sub` field (Clerk user ID)

---

## 📝 Next Steps

After completing this integration:

1. ✅ Update coordination document with Clerk auth details
2. ✅ Update API contracts to use `clerk_user_id`
3. ✅ Test Sprint 1 features with Clerk auth
4. ✅ Begin parallel Web/Mobile development

---

**Status:** Ready for Phase 2 implementation
**Last Updated:** 2026-02-07
