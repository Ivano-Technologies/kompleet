/**
 * Shared E2E auth helpers.
 *
 * SECURITY: this repository is PUBLIC. No credential is ever hard-coded here.
 * The test account is supplied entirely through environment variables:
 *
 *   E2E_USER_EMAIL      email of a seeded, email-confirmed test user
 *   E2E_USER_PASSWORD   that user's password
 *
 * See e2e/README.md for how to seed the account. Specs that need a session call
 * `requireTestCredentials()` in a `beforeEach` so the suite skips (rather than
 * fails) on machines and forks where the account is not configured.
 */

import { expect, test, type Page } from "@playwright/test";

export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL ?? "";
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? "";

export const MISSING_CREDENTIALS_MESSAGE =
  "E2E_USER_EMAIL / E2E_USER_PASSWORD are not set — see e2e/README.md.";

/** True when a test user has been configured for this run. */
export function hasTestCredentials(): boolean {
  return E2E_USER_EMAIL.length > 0 && E2E_USER_PASSWORD.length > 0;
}

/**
 * Skips the current test when no test account is configured. Call this from a
 * `beforeEach` in every spec that needs an authenticated session.
 */
export function requireTestCredentials(): void {
  test.skip(!hasTestCredentials(), MISSING_CREDENTIALS_MESSAGE);
}

/**
 * Signs in through the real login form (src/app/login/page.tsx), which POSTs to
 * /api/auth/login and then hands the returned session to the Supabase browser
 * client. Cookies are written by @supabase/ssr, so the server components under
 * src/app/(dashboard) see the same session afterwards.
 *
 * NOTE: /api/auth/login rate-limits to 5 attempts per 15 minutes per IP+email,
 * but the counter is reset on every successful login, so repeated successful
 * sign-ins across specs are safe. A run with a *wrong* password will lock the
 * account out of the API for the rest of the window.
 */
export async function login(page: Page): Promise<void> {
  await page.goto("/login");

  await page.getByPlaceholder("you@company.ng").fill(E2E_USER_EMAIL);
  await page.getByPlaceholder("Enter your password").fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: /Sign In/ }).click();

  // requireAuth() in src/app/(dashboard)/layout.tsx bounces unverified users to
  // /verify-email, so landing anywhere else means the seeded user is not
  // email-confirmed. Assert the happy path explicitly for a clear failure.
  await page.waitForURL(/\/dashboard(\?|$|\/)/, { timeout: 45_000 });
  await expect(page.getByPlaceholder("you@company.ng")).toHaveCount(0);
}

/** Short, per-run identifier used to keep created records distinguishable. */
export function runId(): string {
  return Math.random().toString(36).slice(2, 8);
}
