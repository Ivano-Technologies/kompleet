/**
 * Server Session Helpers
 *
 * This module provides explicit server-side session management functions.
 * All functions use the server Supabase client and are designed for:
 * - Server Components
 * - Route Handlers
 * - Server Actions
 *
 * Key principles:
 * - Accept SupabaseClient as parameter (no implicit clients)
 * - Return structured errors (no redirects)
 * - Fully typed responses
 * - Unit-testable with mocked clients
 */

import { SupabaseClient, Session, User } from "@supabase/supabase-js";

/**
 * Result type for session operations
 */
export type SessionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Retrieves the current server session
 *
 * @param client - Server Supabase client instance
 * @returns Session result with session data or error
 *
 * @example
 * ```ts
 * const supabase = createServerClient();
 * const result = await getServerSession(supabase);
 * if (result.success) {
 *   console.log('Session:', result.data);
 * }
 * ```
 */
export async function getServerSession(
  client: SupabaseClient,
): Promise<SessionResult<Session | null>> {
  try {
    const { data, error } = await client.auth.getSession();

    if (error) {
      return {
        success: false,
        error: `Failed to retrieve session: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data.session,
    };
  } catch (err) {
    return {
      success: false,
      error: `Unexpected error retrieving session: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Retrieves the current authenticated user
 *
 * @param client - Server Supabase client instance
 * @returns Session result with user data or error
 *
 * @example
 * ```ts
 * const supabase = createServerClient();
 * const result = await getServerUser(supabase);
 * if (result.success && result.data) {
 *   console.log('User ID:', result.data.id);
 * }
 * ```
 */
export async function getServerUser(
  client: SupabaseClient,
): Promise<SessionResult<User | null>> {
  try {
    const { data, error } = await client.auth.getUser();

    if (error) {
      return {
        success: false,
        error: `Failed to retrieve user: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data.user,
    };
  } catch (err) {
    return {
      success: false,
      error: `Unexpected error retrieving user: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Requires an authenticated user, throwing an error if not found
 *
 * Use this in protected routes/handlers where authentication is mandatory.
 *
 * @param client - Server Supabase client instance
 * @returns The authenticated user
 * @throws Error if user is not authenticated
 *
 * @example
 * ```ts
 * const supabase = createServerClient();
 * try {
 *   const user = await requireServerUser(supabase);
 *   // Proceed with authenticated user
 * } catch (error) {
 *   return Response.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function requireServerUser(client: SupabaseClient): Promise<User> {
  const result = await getServerUser(client);

  if (!result.success) {
    throw new Error(result.error);
  }

  if (!result.data) {
    throw new Error("Authentication required: No user session found");
  }

  return result.data;
}

/**
 * Checks if a user is authenticated
 *
 * @param client - Server Supabase client instance
 * @returns true if user is authenticated, false otherwise
 *
 * @example
 * ```ts
 * const supabase = createServerClient();
 * const isAuth = await isAuthenticated(supabase);
 * if (!isAuth) {
 *   redirect('/login');
 * }
 * ```
 */
export async function isAuthenticated(
  client: SupabaseClient,
): Promise<boolean> {
  const result = await getServerUser(client);
  return result.success && result.data !== null;
}

/**
 * Retrieves user ID from session
 *
 * @param client - Server Supabase client instance
 * @returns User ID or null if not authenticated
 *
 * @example
 * ```ts
 * const supabase = createServerClient();
 * const userId = await getUserId(supabase);
 * if (userId) {
 *   // Fetch user-specific data
 * }
 * ```
 */
export async function getUserId(
  client: SupabaseClient,
): Promise<string | null> {
  const result = await getServerUser(client);
  return result.success && result.data ? result.data.id : null;
}
