/**
 * Authentication helpers for server-side route protection.
 *
 * Use `requireAuth()` in server components or layouts to gate access.
 * Redirects unauthenticated users to /login, and unverified users to
 * /verify-email.
 */

import { redirect } from "next/navigation";
import { getCompatUser } from "@/lib/auth/session";
import type { CompatUser } from "@/lib/auth/compat-user";
import { isCompatEmailVerified } from "@/lib/auth/email-verified";
import { verifyEmailPath } from "@/lib/auth/sign-in-result";

/**
 * Require an authenticated, email-verified user.
 * Unauthenticated users go to /login. Unverified users go to /verify-email.
 */
export async function requireAuth(): Promise<CompatUser> {
  const user = await getCompatUser();

  if (!user) {
    redirect("/login");
  }

  if (!isCompatEmailVerified(user)) {
    redirect(verifyEmailPath(user.email));
  }

  return user;
}
