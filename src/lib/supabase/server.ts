/**
 * Server-side Supabase client factory
 * 
 * This module provides a factory function for creating Supabase clients
 * that are safe to use in Server Components, Route Handlers, and Middleware.
 * 
 * Key principles:
 * - Uses cookies for session management
 * - Server-only (never imported in client components)
 * - No deprecated @supabase/ssr APIs
 * - Explicit client creation (no globals)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client configured for server-side use.
 * 
 * This client:
 * - Reads auth tokens from cookies
 * - Is safe for Server Components and Route Handlers
 * - Respects Next.js request lifecycle
 * 
 * @returns A configured Supabase client instance
 * 
 * @example
 * ```ts
 * import { createServerClient } from '@/lib/supabase/server';
 * 
 * export async function GET() {
 *   const supabase = createServerClient();
 *   const { data } = await supabase.from('users').select();
 *   return Response.json(data);
 * }
 * ```
 */
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  // Get the cookie store from Next.js
  const cookieStore = cookies();

  // Extract auth token from cookies
  // Supabase stores the session in cookies with specific naming convention
  const authToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  // Create client with auth tokens if available
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Persist session using cookies
      persistSession: false, // Server doesn't persist; cookies handle this
      autoRefreshToken: false, // Server doesn't auto-refresh
      detectSessionInUrl: false, // Server doesn't detect URL params
    },
    global: {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    },
  });

  return client;
}

/**
 * Type alias for server Supabase client
 * Use this for type annotations to ensure consistency
 */
export type ServerSupabaseClient = ReturnType<typeof createServerClient>;
