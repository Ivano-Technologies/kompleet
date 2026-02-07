/**
 * Supabase client with Clerk authentication integration
 * Use this client in components and API routes that require Clerk JWT authentication
 */

import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';

/**
 * Hook to get Supabase client with Clerk JWT for client-side usage
 * Use this in React components
 */
export function useSupabaseClerk() {
  const { getToken } = useAuth();

  // Note: This client is created without the Clerk token initially.
  // For authenticated requests, use createSupabaseClerkClient on the server side.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Supabase client doesn't support async headers function
        // Token must be set per-request or use server-side client
        headers: {},
      },
    }
  );

  return supabase;
}

/**
 * Create Supabase client with Clerk JWT for server-side usage
 * Use this in API routes and server components
 * 
 * @param getToken - Clerk's getToken function from auth()
 */
export async function createSupabaseClerkClient(
  getToken: (options?: { template?: string }) => Promise<string | null>
) {
  const token = await getToken({ template: 'kompleet-supabase' });

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
}

/**
 * Create Supabase admin client (service role) for server-side operations
 * Use this only in API routes that need to bypass RLS
 */
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
