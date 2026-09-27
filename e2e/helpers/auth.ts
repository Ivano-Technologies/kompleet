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
 * Isolated CI Convex (`convex dev --once` / anonymous) starts empty. GitHub
 * secrets still supply E2E_USER_* so specs do not skip — but that account is
 * not in the local backend (`InvalidAccountId`). Waiting 45s for /dashboard
 * then retrying twice blew the 45-minute e2e job. Seed via signup, then sign in.
 */
async function seedE2eUserViaSignup(page: Page): Promise<void> {
  if (E2E_USER_PASSWORD.length < 8 || !/\d/.test(E2E_USER_PASSWORD)) {
    throw new Error(
      "Isolated Convex has no E2E user, and E2E_USER_PASSWORD cannot be used for signup (need 8+ characters and a digit).",
    );
  }

  await page.goto("/signup");
  await fillHydrated(page.getByPlaceholder("e.g. Tunde", { exact: true }), "E2E");
  await fillHydrated(page.getByPlaceholder("e.g. Balogun", { exact: true }), "Tester");
  await fillHydrated(
    page.getByPlaceholder("e.g. Tunde Ventures Ltd", { exact: true }),
    "Kompleet E2E",
  );
  await fillHydrated(
    page.getByPlaceholder("name@company.ng", { exact: true }),
    E2E_USER_EMAIL,
  );
  await fillHydrated(
    page.getByPlaceholder("Minimum 8 characters", { exact: true }),
    E2E_USER_PASSWORD,
  );
  await page.getByRole("button", { name: /Create Free Account/ }).click();

  const created = page.getByRole("heading", { name: "Account Created!" });
  const already = page.getByText(/already exists/i);
  const jwtMissing = page.getByText(/JWT_PRIVATE_KEY|Missing environment variable/i);
  const outcome = await Promise.race([
    created.waitFor({ state: "visible", timeout: 20_000 }).then(() => "created" as const),
    already.waitFor({ state: "visible", timeout: 20_000 }).then(() => "already" as const),
    jwtMissing
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "jwt" as const),
  ]);

  if (outcome === "jwt") {
    throw new Error(
      "Isolated Convex is missing JWT_PRIVATE_KEY / JWKS — scripts/ci-provision-convex.sh must set Convex Auth keys.",
    );
  }

  if (outcome === "already") {
    return;
  }

  await page.getByRole("link", { name: "Go to Dashboard" }).click();
  await page.waitForURL(/\/dashboard(\?|$|\/)/, { timeout: 20_000 });
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

  const invalid = page.getByText(/Invalid email or password/);
  const reachedDashboard = page
    .waitForURL(/\/dashboard(\?|$|\/)/, { timeout: 20_000 })
    .then(() => "dashboard" as const);
  const sawInvalid = invalid
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => "invalid" as const);

  const outcome = await Promise.race([reachedDashboard, sawInvalid]);

  if (outcome === "invalid") {
    await seedE2eUserViaSignup(page);
    if (!/\/dashboard(\?|$|\/)/.test(page.url())) {
      await page.goto("/login");
      await fillHydrated(
        page.getByPlaceholder("you@company.ng", { exact: true }),
        E2E_USER_EMAIL,
      );
      await fillHydrated(
        page.getByPlaceholder("Enter your password", { exact: true }),
        E2E_USER_PASSWORD,
      );
      await page.getByRole("button", { name: "Sign In →" }).click();
      await page.waitForURL(/\/dashboard(\?|$|\/)/, { timeout: 20_000 });
    }
  }

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
