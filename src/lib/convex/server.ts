/**
 * Server Convex client. Auth is Convex Auth (cookies) or a Bearer JWT
 * (mobile / API clients, including leftover Supabase GoTrue tokens).
 */
import type { ConvexHttpClient } from "convex/browser";
import { api, createConvexHttpClient } from "./http";
import {
  getCompatUser,
  getConvexAccessToken,
} from "@/lib/auth/session";
import type { CompatUser } from "@/lib/auth/compat-user";

export { api };

export class ConvexUnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "ConvexUnauthorizedError";
  }
}

export interface AuthedConvex {
  user: CompatUser;
  convex: ConvexHttpClient;
  accessToken: string;
}

export async function getAuthedConvex(
  request?: Request,
): Promise<AuthedConvex | null> {
  const accessToken = await getConvexAccessToken(request);
  if (!accessToken) return null;
  const user = await getCompatUser(request);
  if (!user) return null;
  return {
    user,
    convex: createConvexHttpClient(accessToken),
    accessToken,
  };
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
    (error instanceof Error &&
      /not authenticated|unauthorized|authentication required/i.test(
        error.message,
      ))
  );
}
