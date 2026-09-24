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

import { expect, test, type Locator, type Page } from "@playwright/test";

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
 * Fill a controlled React input after hydration. SSR HTML can accept a DOM
 * fill that React then resets to useState("") — native submit then never POSTs.
 */
export async function fillHydrated(
  locator: Locator,
  value: string,
): Promise<void> {
  await expect(locator).toBeVisible();
  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }).toPass({ timeout: 30_000 });
}

/**
 * Signs in through the real login form (src/app/login/page.tsx) using
 * Convex Auth (`useAuthActions` → `/api/auth`). Cookies are written by
 * `@convex-dev/auth/nextjs` middleware.
 */
export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  const email = page.getByPlaceholder("you@company.ng", { exact: true });
  const password = page.getByPlaceholder("Enter your password", { exact: true });
  const submit = page.getByRole("button", { name: "Sign In →" });

  await fillHydrated(email, E2E_USER_EMAIL);
  await fillHydrated(password, E2E_USER_PASSWORD);
  await expect(submit).toBeEnabled();

  await submit.click();

  // requireAuth() in src/app/(dashboard)/layout.tsx bounces unverified users to
  // /verify-email, so landing anywhere else means the seeded user is not
  // email-confirmed. Assert the happy path explicitly for a clear failure.
  await page.waitForURL(/\/dashboard(\?|$|\/)/, { timeout: 45_000 });
  await expect(page.getByPlaceholder("you@company.ng", { exact: true })).toHaveCount(0);

  // Isolated CI Convex starts empty. Money-path specs call Convex
  // getCurrentUser; wait until the users row exists for this session.
  const ensure = await page.request.post("/api/auth/ensure-profile");
  if (!ensure.ok()) {
    throw new Error(
      `ensure-profile returned HTTP ${ensure.status()} ${await ensure.text()}`,
    );
  }
}

/** Short, per-run identifier used to keep created records distinguishable. */
export function runId(): string {
  return Math.random().toString(36).slice(2, 8);
}
