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
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

/**
 * In-page friendly error copy. `useErrorRef` console.errors the same string,
 * and Next.js's dev overlay then also contains it, so a page-wide getByText
 * is a strict-mode miss. Scope to the banner (alert or AUTH_ERROR).
 */
export function inPageError(page: Page, text: string | RegExp): Locator {
  return page
    .locator('[role="alert"], .bg-error-bg')
    .filter({ hasText: text });
}

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
 * Isolated CI stores the last OTP per email when AUTH_RESEND_KEY is unset.
 * AUTH_E2E_OTP is the read secret, not the code: Convex Auth looks up OTPs
 * by a unique hash, so a shared 8 digit value collides across signups.
 */
async function fetchE2eOtp(email: string): Promise<string> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim() ?? "";
  const secret = process.env.AUTH_E2E_OTP?.trim() ?? "";
  if (!convexUrl || !secret) {
    throw new Error(
      "Email verification required but AUTH_E2E_OTP / NEXT_PUBLIC_CONVEX_URL are unset.",
    );
  }
  const client = new ConvexHttpClient(convexUrl);
  const token = await client.query(api.e2eOtp.getForEmail, {
    email: email.trim().toLowerCase(),
    secret,
  });
  if (!token) {
    throw new Error("No CI verification code is stored for this email.");
  }
  return token;
}

async function completeEmailVerification(
  page: Page,
  email: string,
): Promise<void> {
  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
  const code = await fetchE2eOtp(email);
  await fillHydrated(page.getByLabel("Verification code"), code);
  await page.getByRole("button", { name: "Verify email" }).click();
  await page.waitForURL(/\/dashboard(\?|$|\/)/, { timeout: 20_000 });
}

type LoginOutcome = "dashboard" | "verify" | "invalid";

async function waitForLoginOutcome(page: Page): Promise<LoginOutcome> {
  const invalid = page.getByText(/That email or password doesn't match/);
  const dashboard = page
    .waitForURL(/\/dashboard(\?|$|\/)/, { timeout: 20_000 })
    .then(() => "dashboard" as const);
  const verify = page
    .waitForURL(/\/verify-email/, { timeout: 20_000 })
    .then(() => "verify" as const);
  const invalidSeen = invalid
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => "invalid" as const);
  void dashboard.catch(() => {});
  void verify.catch(() => {});
  void invalidSeen.catch(() => {});
  return await Promise.race([dashboard, verify, invalidSeen]);
}

async function submitLoginForm(page: Page): Promise<LoginOutcome> {
  await fillHydrated(
    page.getByPlaceholder("you@company.ng", { exact: true }),
    E2E_USER_EMAIL,
  );
  await fillHydrated(
    page.getByPlaceholder("Enter your password", { exact: true }),
    E2E_USER_PASSWORD,
  );
  const submit = page.getByRole("button", { name: "Sign in" });
  await expect(submit).toBeEnabled();
  await submit.click();
  return await waitForLoginOutcome(page);
}

/**
 * Isolated CI Convex (`convex dev --once` / anonymous) starts empty. GitHub
 * secrets still supply E2E_USER_* so specs do not skip — but that account is
 * not in the local backend (`InvalidAccountId`). Waiting 45s for /dashboard
 * then retrying twice blew the 45-minute e2e job. Seed via signup, verify
 * the email OTP, then sign in.
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
  await page.getByRole("button", { name: /Create account/ }).click();

  const verifyHeading = page.getByRole("heading", { name: "Check your email" });
  const already = page.getByText(/already exists/i);
  const jwtMissing = page.getByText(/JWT_PRIVATE_KEY|Missing environment variable/i);
  const verifySeen = verifyHeading
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => "verify" as const);
  const alreadySeen = already
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => "already" as const);
  const jwtSeen = jwtMissing
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => "jwt" as const);
  void verifySeen.catch(() => {});
  void alreadySeen.catch(() => {});
  void jwtSeen.catch(() => {});
  const outcome = await Promise.race([verifySeen, alreadySeen, jwtSeen]);

  if (outcome === "jwt") {
    throw new Error(
      "Isolated Convex is missing JWT_PRIVATE_KEY / JWKS — scripts/ci-provision-convex.sh must set Convex Auth keys.",
    );
  }

  if (outcome === "already") {
    return;
  }

  await completeEmailVerification(page, E2E_USER_EMAIL);
}

/**
 * Signs in through the real login form (src/app/login/page.tsx) using
 * Convex Auth (`useAuthActions` → `/api/auth`). Cookies are written by
 * `@convex-dev/auth/nextjs` middleware.
 */
export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  let outcome = await submitLoginForm(page);

  if (outcome === "invalid") {
    await seedE2eUserViaSignup(page);
    if (/\/verify-email/.test(page.url())) {
      await completeEmailVerification(page, E2E_USER_EMAIL);
      outcome = "dashboard";
    } else if (!/\/dashboard(\?|$|\/)/.test(page.url())) {
      await page.goto("/login");
      outcome = await submitLoginForm(page);
    } else {
      outcome = "dashboard";
    }
  }

  if (outcome === "verify") {
    await completeEmailVerification(page, E2E_USER_EMAIL);
    outcome = "dashboard";
  }

  if (outcome !== "dashboard" && !/\/dashboard(\?|$|\/)/.test(page.url())) {
    const path = new URL(page.url()).pathname;
    throw new Error(`Login did not reach the dashboard (path=${path}).`);
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
