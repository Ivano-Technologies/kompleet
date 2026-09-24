/**
 * Server-side Supabase client factory
 *
 * This module provides factory functions for creating Supabase clients
 * that work with Supabase Auth in Server Components, Route Handlers, and Middleware.
 * Route handlers should use getSupabaseForRequest(request) so that both cookie-based
 * (web) and Bearer token (mobile) authentication work.
 */
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { getCompatUser } from "@/lib/auth/session";
import type { CompatUser } from "@/lib/auth/compat-user";

const getEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    );
  }
  return { supabaseUrl, supabaseAnonKey };
};

/**
 * Returns a Supabase client for the current request. Accepts either cookie-based
 * session (web) or Authorization: Bearer <access_token> (e.g. mobile). Use this
 * in API route handlers so mobile app requests with Bearer token are authenticated.
 */
function withCompatAuth(
  client: SupabaseClient,
  user: CompatUser | null,
): SupabaseClient {
  const shaped = user as unknown as User | null;
  const auth = new Proxy(client.auth, {
    get(target, prop, receiver) {
      if (prop === "getUser") {
        return async () => ({
          data: { user: shaped },
          error: shaped ? null : { message: "Unauthorized", name: "AuthError" },
        });
      }
      if (prop === "getSession") {
        return async () => ({
          data: {
            session: shaped
              ? {
                  access_token: "convex",
                  refresh_token: "",
                  expires_in: 3600,
                  expires_at: Math.floor(Date.now() / 1000) + 3600,
                  token_type: "bearer",
                  user: shaped,
                }
              : null,
          },
          error: null,
        });
      }
      return Reflect.get(target, prop, receiver);
    },
  });
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "auth") return auth;
      return Reflect.get(target, prop, receiver);
    },
  });
}

/**
 * Returns a Supabase data client for leftover Postgres tables.
 * Auth identity comes from Convex Auth (or a Bearer JWT). RLS is bypassed
 * via the service role; callers must filter by `user.id` (externalId).
 */
export async function getSupabaseForRequest(
  request: Request,
): Promise<SupabaseClient> {
  const user = await getCompatUser(request);
  try {
    return withCompatAuth(createAdminClient(), user);
  } catch {
    return withCompatAuth(await createCookieClient(), user);
  }
}

/**
 * Creates a Supabase client configured for server-side use with Supabase Auth.
 *
 * This client:
 * - Uses Supabase Auth for authentication
 * - Respects RLS policies based on authenticated user
 * - Is safe for Server Components and Route Handlers
 * - Automatically manages auth cookies
 *
 * @returns A configured Supabase client instance with Supabase Auth
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
async function createCookieClient(): Promise<SupabaseClient> {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          console.error("Error setting cookies:", error);
        }
      },
    },
  });
}

/**
 * Leftover Postgres client for Server Components. Auth is Convex Auth;
 * data access uses the service role and must filter by user id.
 */
export async function createServerClient(): Promise<SupabaseClient> {
  const user = await getCompatUser();
  try {
    return withCompatAuth(createAdminClient(), user);
  } catch {
    return withCompatAuth(await createCookieClient(), user);
  }
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
 *   const { data } = await supabase.from('profiles').select();
 *   return Response.json(data);
 * }
 * ```
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
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
export type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerClient>
>;
