/**
 * Server-side Supabase client factory
 * 
 * This module provides a factory function for creating Supabase clients
 * that are safe to use in Server Components, Route Handlers, and Middleware.
 * 
 * Uses @supabase/ssr for proper OAuth and cookie handling.
 */
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client configured for server-side use with proper cookie handling.
 * 
 * This client:
 * - Reads and writes auth tokens from/to cookies
 * - Handles OAuth callbacks properly
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
 *   const supabase = await createServerClient();
 *   const { data } = await supabase.from('users').select();
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

  const cookieStore = await cookies();

  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The setAll method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Type alias for server Supabase client
 * Use this for type annotations to ensure consistency
 */
export type ServerSupabaseClient = Awaited<ReturnType<typeof createServerClient>>;
