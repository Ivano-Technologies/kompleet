"use client";

import { ConvexHttpClient } from "convex/browser";
import { createClient } from "@/lib/supabase/client";
import { api, createConvexHttpClient, getConvexUrl } from "./http";

export { api };

export async function getBrowserConvex(): Promise<ConvexHttpClient | null> {
  if (!getConvexUrl()) return null;
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return createConvexHttpClient(session.access_token);
}

export async function ensureConvexProfile(): Promise<void> {
  const convex = await getBrowserConvex();
  if (!convex) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : undefined;
  await convex.mutation(api.users.ensureCurrent, {
    email: user.email ?? undefined,
    fullName,
  });
}
