/**
 * Supabase Client (Browser-Only)
 * ==============================
 * Creates a cookie-based Supabase client for browser/client-side use.
 *
 * Uses @supabase/ssr's createBrowserClient which stores sessions in cookies
 * (not localStorage). This ensures the server-side client (which also reads
 * cookies) can see the same session — fixing the auth mismatch that caused
 * login failures.
 *
 * USAGE:
 *   import { createSupabaseClient } from '@/lib/supabase/client';
 *   const supabase = createSupabaseClient();
 *   const { data } = await supabase.from('profiles').select();
 */

import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. " +
        "Please add it to your .env.local file.",
    );
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. " +
        "Please add it to your .env.local file.",
    );
  }
  return key;
}

// ============================================================
// CLIENT CREATION
// ============================================================

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Creates a cookie-based Supabase browser client.
 *
 * This client:
 * - Uses @supabase/ssr for cookie-based session storage
 * - Sessions are stored in cookies (readable by server components)
 * - Auto-refreshes tokens
 * - Compatible with the server-side createServerClient
 */
export function createSupabaseClient(): TypedSupabaseClient {
  return createSSRBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
  );
}

// ============================================================
// ALIASES FOR BACKWARDS COMPATIBILITY
// ============================================================

export { createSupabaseClient as createClient };
export { createSupabaseClient as createBrowserClient };

// Re-export types from supabase-js for convenience
export type { SupabaseClient, Session, User } from "@supabase/supabase-js";
