/**
 * Money path: signup -> login -> protected routes.
 *
 * Web auth is Convex Auth (Password). Isolated CI Convex is empty, so signup
 * here creates a real local account. Login money-path specs use the seeded
 * E2E_USER_EMAIL / E2E_USER_PASSWORD (see e2e/README.md) — no credential is
 * ever written into this file.
 */

import { test, expect } from "@playwright/test";
import {
  fillHydrated,
  login,
  requireTestCredentials,
  runId,
} from "./helpers/auth";

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
  submit: "Sign In →",
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

    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.firstName, { exact: true }),
      "Tunde",
    );
    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.lastName, { exact: true }),
      "Balogun",
    );
    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.businessName, { exact: true }),
      "Kompleet E2E Ventures",
    );
    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.businessEmail, { exact: true }),
      `e2e-${runId()}@example.test`,
    );
    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.password, { exact: true }),
      "abcdefgh",
    );

    await page.getByRole("button", { name: SIGNUP_SELECTORS.submit }).click();

    await expect(
      page.getByText("Password must contain at least one number"),
    ).toBeVisible();
  });

  test("signup creates an account and offers the dashboard", async ({
    page,
  }) => {
    const email = `e2e-${runId()}@example.test`;

    await page.goto("/signup");

    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.firstName, { exact: true }),
      "Tunde",
    );
    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.lastName, { exact: true }),
      "Balogun",
    );
    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.businessName, { exact: true }),
      "Kompleet E2E Ventures",
    );
    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.businessEmail, { exact: true }),
      email,
    );
    await fillHydrated(
      page.getByPlaceholder(SIGNUP_SELECTORS.password, { exact: true }),
      "kompleet-e2e-1",
    );

    await page.getByRole("button", { name: SIGNUP_SELECTORS.submit }).click();

    await expect(
      page.getByRole("heading", { name: "Account Created!" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Go to Dashboard" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Go to Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("legacy auth callback without a code lands on login", async ({
    page,
  }) => {
    // src/app/auth/callback/route.ts is a leftover Supabase link target.
    // It always redirects to /login so old email links do not 404.
    await page.goto("/auth/callback");

    await expect(page).toHaveURL(/\/login/);
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
        page.getByRole("button", { name: LOGIN_SELECTORS.submit, exact: true }),
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
    await fillHydrated(
      page.getByPlaceholder(LOGIN_SELECTORS.email, { exact: true }),
      `e2e-${runId()}@example.test`,
    );
    await fillHydrated(
      page.getByPlaceholder(LOGIN_SELECTORS.password, { exact: true }),
      "definitely-not-the-password",
    );
    await expect(
      page.getByRole("button", { name: LOGIN_SELECTORS.submit, exact: true }),
    ).toBeEnabled();

    await page
      .getByRole("button", { name: LOGIN_SELECTORS.submit, exact: true })
      .click();

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
        page.getByRole("heading", { name: "Books", level: 1 }),
      ).toBeVisible();

      await page.goto("/export");
      await expect(page).toHaveURL(/\/export/);
      await expect(
        page.getByRole("heading", { name: "Export Center", level: 1 }),
      ).toBeVisible();
    });
  });
});
