/**
 * Authentication helpers for server-side route protection.
 *
 * Use `requireAuth()` in server components or layouts to gate access.
 * Redirects unauthenticated users to /login with a returnTo parameter.
 */

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Require an authenticated user. Redirects to /login if not authenticated.
 * Use in server components and layouts to protect routes.
 */
export async function requireAuth() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect unverified users to email verification page
  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  return user;
}
