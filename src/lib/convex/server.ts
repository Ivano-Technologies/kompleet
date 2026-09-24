/**
 * Server Convex client for path B.
 * Auth stays on Supabase — we pass the GoTrue access token into ConvexHttpClient.
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ConvexHttpClient } from "convex/browser";
import {
  createServerClient,
  getSupabaseForRequest,
} from "@/lib/supabase/server";
import { api, createConvexHttpClient } from "./http";

export { api };

export class ConvexUnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "ConvexUnauthorizedError";
  }
}

export interface AuthedConvex {
  supabase: SupabaseClient;
  user: User;
  convex: ConvexHttpClient;
  accessToken: string;
}

async function accessTokenFrom(
  request: Request | undefined,
  supabase: SupabaseClient,
): Promise<string | null> {
  if (request) {
    const header = request.headers.get("Authorization");
    if (header?.startsWith("Bearer ")) {
      return header.slice(7).trim();
    }
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getAuthedConvex(
  request?: Request,
): Promise<AuthedConvex | null> {
  const supabase = request
    ? await getSupabaseForRequest(request)
    : await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const accessToken = await accessTokenFrom(request, supabase);
  if (!accessToken) return null;

  const convex = createConvexHttpClient(accessToken);
  return { supabase, user, convex, accessToken };
}

export async function requireAuthedConvex(
  request?: Request,
): Promise<AuthedConvex> {
  const authed = await getAuthedConvex(request);
  if (!authed) {
    throw new ConvexUnauthorizedError();
  }
  return authed;
}

/** Idempotent Convex users upsert using a GoTrue access token. */
export async function ensureConvexUserFromToken(
  accessToken: string,
  opts?: { email?: string; fullName?: string },
): Promise<void> {
  const convex = createConvexHttpClient(accessToken);
  await convex.mutation(api.users.ensureCurrent, {
    email: opts?.email,
    fullName: opts?.fullName,
  });
}

export function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof ConvexUnauthorizedError ||
    (error instanceof Error && /not authenticated|unauthorized/i.test(error.message))
  );
}
