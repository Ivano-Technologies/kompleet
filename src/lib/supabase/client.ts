/**
 * Client-side Supabase Client
 * 
 * This module provides a browser-safe Supabase client for client components.
 * Used for authentication flows (login, signup, logout) in the browser.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

/**
 * Creates or returns the singleton Supabase client for browser use
 * 
 * @returns SupabaseClient configured for browser authentication
 * @throws Error if required environment variables are missing
 */
export function createBrowserClient(): SupabaseClient {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  // Create client with browser-specific configuration
  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Persist session in browser storage
      autoRefreshToken: true, // Automatically refresh expired tokens
      detectSessionInUrl: true, // Handle OAuth callbacks
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });

  return clientInstance;
}

export type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;
