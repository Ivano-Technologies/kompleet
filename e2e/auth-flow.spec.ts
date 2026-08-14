/**
 * Money path: signup -> email verification -> login -> protected routes.
 *
 * Signup is stubbed at the Supabase network boundary so the suite never creates
 * throwaway accounts in a real project. Login uses the seeded test account from
 * E2E_USER_EMAIL / E2E_USER_PASSWORD (see e2e/README.md) — no credential is ever
 * written into this file.
 */

import { test, expect } from "@playwright/test";
import { login, requireTestCredentials, runId } from "./helpers/auth";

const SIGNUP_SELECTORS = {
  // "e.g. Tunde" is a substring of businessName. Locators must use { exact: true }.
  firstName: "e.g. Tunde",
  lastName: "e.g. Balogun",
  businessName: "e.g. Tunde Ventures Ltd",
  businessEmail: "name@company.ng",
  password: "Minimum 8 characters",
  submit: /Create Free Account/,
};

const LOGIN_SELECTORS = {
  email: "you@company.ng",
  password: "Enter your password",
  submit: /Sign In/,
};

/** Routes rendered under src/app/(dashboard)/layout.tsx, which calls requireAuth(). */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/transactions",
  "/expenses",
  "/calculators",
  "/export",
];

test.describe("Auth flow", () => {
  test("signup rejects a password with no digit before any network call", async ({
    page,
  }) => {
    await page.goto("/signup");

    await page
      .getByPlaceholder(SIGNUP_SELECTORS.firstName, { exact: true })
      .fill("Tunde");
    await page
      .getByPlaceholder(SIGNUP_SELECTORS.lastName, { exact: true })
      .fill("Balogun");
    await page
      .getByPlaceholder(SIGNUP_SELECTORS.businessName, { exact: true })
      .fill("Kompleet E2E Ventures");
    await page
      .getByPlaceholder(SIGNUP_SELECTORS.businessEmail, { exact: true })
      .fill(`e2e-${runId()}@example.test`);
    await page
      .getByPlaceholder(SIGNUP_SELECTORS.password, { exact: true })
      .fill("abcdefgh");

    await page.getByRole("button", { name: SIGNUP_SELECTORS.submit }).click();

    await expect(
      page.getByText("Password must contain at least one number"),
    ).toBeVisible();
  });

  test("signup shows the email verification prompt", async ({ page }) => {
    const email = `e2e-${runId()}@example.test`;

    // Stub the Supabase GoTrue signup endpoint. When email confirmation is
    // required GoTrue answers with the bare User object and no session, which is
    // exactly what src/app/signup/page.tsx branches on (`if (data.user)`).
    //
    // TODO(verify): the shape below matches supabase-js v2 `_sessionResponse`
    // (user object, no access_token => session === null). If @supabase/supabase-js
    // is upgraded and signUp stops resolving `data.user`, re-check this stub
    // against node_modules/@supabase/auth-js before assuming a product bug.
    await page.route(/\/auth\/v1\/signup/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "00000000-0000-4000-8000-000000000001",
          aud: "authenticated",
          role: "authenticated",
          email,
          email_confirmed_at: null,
          confirmation_sent_at: new Date().toISOString(),
          phone: "",
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: { full_name: "Tunde Balogun" },
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto("/signup");

    await page
      .getByPlaceholder(SIGNUP_SELECTORS.firstName, { exact: true })
      .fill("Tunde");
    await page
      .getByPlaceholder(SIGNUP_SELECTORS.lastName, { exact: true })
      .fill("Balogun");
    await page
      .getByPlaceholder(SIGNUP_SELECTORS.businessName, { exact: true })
      .fill("Kompleet E2E Ventures");
    await page
      .getByPlaceholder(SIGNUP_SELECTORS.businessEmail, { exact: true })
      .fill(email);
    await page
      .getByPlaceholder(SIGNUP_SELECTORS.password, { exact: true })
      .fill("kompleet-e2e-1");

    await page.getByRole("button", { name: SIGNUP_SELECTORS.submit }).click();

    await expect(
      page.getByRole("heading", { name: "Account Created!" }),
    ).toBeVisible();
    await expect(
      page.getByText("Check your email to verify your account before signing in."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Login" })).toBeVisible();

    await page.getByRole("link", { name: "Go to Login" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("verification callback without a code bounces back to login", async ({
    page,
  }) => {
    // src/app/auth/callback/route.ts redirects to /login?error=missing_code when
    // neither a `code` nor a recovery `token` is present.
    await page.goto("/auth/callback");

    await expect(page).toHaveURL(/\/login\?error=missing_code/);
    await expect(
      page.getByPlaceholder(LOGIN_SELECTORS.email, { exact: true }),
    ).toBeVisible();
  });

  test("an expired verification link surfaces an error on the login page", async ({
    page,
  }) => {
    const message = "This link has expired. Please request a new one.";
    await page.goto(
      `/login?error=expired_link&message=${encodeURIComponent(message)}`,
    );

    await expect(page.getByText(message)).toBeVisible();
  });

  for (const route of PROTECTED_ROUTES) {
    test(`unauthenticated visit to ${route} redirects to login`, async ({
      page,
    }) => {
      await page.goto(route);

      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.getByPlaceholder(LOGIN_SELECTORS.email, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: LOGIN_SELECTORS.submit }),
      ).toBeVisible();
    });
  }

  test("wrong credentials are rejected with a generic message", async ({
    page,
  }) => {
    // /api/auth/login deliberately returns the same message for unknown users and
    // bad passwords to avoid account enumeration. Uses a throwaway address so the
    // seeded account's rate-limit bucket (IP+email) is never poisoned.
    await page.goto("/login");
    await page
      .getByPlaceholder(LOGIN_SELECTORS.email, { exact: true })
      .fill(`e2e-${runId()}@example.test`);
    await page
      .getByPlaceholder(LOGIN_SELECTORS.password, { exact: true })
      .fill("definitely-not-the-password");

    const loginResponse = page.waitForResponse(
      (res) =>
        new URL(res.url()).pathname === "/api/auth/login" &&
        res.request().method() === "POST",
    );
    await page.getByRole("button", { name: LOGIN_SELECTORS.submit }).click();
    const response = await loginResponse;
    expect(response.status()).toBe(401);

    await expect(page.getByText(/Invalid email or password\./)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe("with a seeded test user", () => {
    test.beforeEach(() => {
      requireTestCredentials();
    });

    test("valid credentials land on the dashboard", async ({ page }) => {
      await login(page);
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("a signed-in user can reach the protected money paths", async ({
      page,
    }) => {
      await login(page);

      await page.goto("/transactions");
      await expect(page).toHaveURL(/\/transactions/);
      await expect(
        page.getByRole("heading", { name: "Transactions", level: 1 }),
      ).toBeVisible();

      await page.goto("/export");
      await expect(page).toHaveURL(/\/export/);
      await expect(
        page.getByRole("heading", { name: "Export Center", level: 1 }),
      ).toBeVisible();
    });
  });
});
