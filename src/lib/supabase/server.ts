/**
 * Server-side Supabase client factory
 * 
 * This module provides factory functions for creating Supabase clients
 * that work with Clerk authentication in Server Components, Route Handlers, and Middleware.
 * 
 * Uses Clerk JWT for authentication instead of Supabase Auth.
 */
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client configured for server-side use with Clerk authentication.
 * 
 * This client:
 * - Uses Clerk JWT for authentication
 * - Respects RLS policies based on Clerk user ID
 * - Is safe for Server Components and Route Handlers
 * - Automatically includes Clerk JWT in requests
 * 
 * @returns A configured Supabase client instance with Clerk authentication
 * 
 * @example
 * ```ts
 * import { createServerClient } from '@/lib/supabase/server';
 * 
 * export async function GET() {
 *   const supabase = await createServerClient();
 *   const { data } = await supabase.from('transactions').select();
 *   return Response.json(data);
 * }
 * ```
 */
export async function createServerClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  // Get Clerk authentication
  const { getToken } = await auth();
  const token = await getToken({ template: 'kompleet-supabase' });

  // Create Supabase client with Clerk JWT
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

/**
 * Creates a Supabase admin client with service role access.
 * 
 * This client:
 * - Bypasses RLS policies
 * - Should only be used for administrative operations
 * - Never expose service role key to client-side
 * 
 * @returns A configured Supabase admin client instance
 * 
 * @example
 * ```ts
 * import { createAdminClient } from '@/lib/supabase/server';
 * 
 * export async function POST() {
 *   const supabase = createAdminClient();
 *   // Admin operations that bypass RLS
 *   const { data } = await supabase.from('users').select();
 *   return Response.json(data);
 * }
 * ```
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Type alias for server Supabase client
 * Use this for type annotations to ensure consistency
 */
export type ServerSupabaseClient = Awaited<ReturnType<typeof createServerClient>>;
