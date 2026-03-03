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
  // #region agent log
  fetch("http://127.0.0.1:7618/ingest/0be0fd3d-ce28-4416-8e00-446736413fdd", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "b3c43a"
    },
    body: JSON.stringify({
      sessionId: "b3c43a",
      runId: "pre-fix",
      hypothesisId: "H2",
      location: "src/lib/supabase/client.ts:63",
      message: "createSupabaseClient invoked",
      data: {
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion

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
