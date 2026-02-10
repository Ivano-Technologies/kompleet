/**
 * Supabase Client (Browser-Only)
 * ==============================
 * Creates a Supabase client for browser/client-side use only.
 * 
 * DEPENDENCIES:
 *   - @supabase/supabase-js (only)
 *   - NO @supabase/ssr
 *   - NO cookies
 *   - NO middleware
 *
 * USAGE:
 *   import { createSupabaseClient } from '@/lib/supabase/client';
 *   const supabase = createSupabaseClient();
 *   const { data } = await supabase.from('profiles').select();
 *
 * NOTE:
 *   This creates a new client instance each time.
 *   For React components, consider memoizing or using context (future phase).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

/**
 * Gets the Supabase URL from environment variables.
 * Throws if not configured.
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file.'
    );
  }

  return url;
}

/**
 * Gets the Supabase anon key from environment variables.
 * Throws if not configured.
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env.local file.'
    );
  }

  return key;
}

// ============================================================
// CLIENT CREATION
// ============================================================

/**
 * Typed Supabase client for this project.
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Creates a new Supabase client instance.
 * 
 * This client:
 * - Uses the anon (public) key
 * - Respects Row Level Security policies
 * - Stores session in localStorage (browser default)
 * - Auto-refreshes tokens
 *
 * @example
 * const supabase = createSupabaseClient();
 * 
 * // Query data
 * const { data, error } = await supabase
 *   .from('transactions')
 *   .select('*');
 *
 * // Auth
 * const { data: { user } } = await supabase.auth.getUser();
 */
export function createSupabaseClient(): TypedSupabaseClient {
  return createClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        // Use localStorage for session persistence (browser default)
        persistSession: true,
        // Auto-refresh tokens before expiry
        autoRefreshToken: true,
        // Detect session from URL (for OAuth callbacks)
        detectSessionInUrl: true,
      },
    }
  );
}

/**
 * Creates a Supabase client with custom options.
 * Use this for specific configurations.
 *
 * @example
 * const supabase = createSupabaseClientWithOptions({
 *   auth: { persistSession: false }
 * });
 */
export function createSupabaseClientWithOptions(
  options?: Parameters<typeof createClient<Database>>[2]
): TypedSupabaseClient {
  return createClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    options
  );
}

// ============================================================
// RE-EXPORTS
// ============================================================

// ============================================================
// ALIASES FOR BACKWARDS COMPATIBILITY
// ============================================================

/**
 * Alias for createSupabaseClient for backwards compatibility.
 * Use createSupabaseClient in new code.
 */
export { createSupabaseClient as createClient };

/**
 * Alias for createBrowserClient (legacy naming)
 */
export { createSupabaseClient as createBrowserClient };

// ============================================================
// RE-EXPORTS
// ============================================================

// Re-export types from supabase-js for convenience
export type { SupabaseClient, Session, User } from '@supabase/supabase-js';
