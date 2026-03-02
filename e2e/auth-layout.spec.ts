import { test, expect } from "@playwright/test";

const AUTH_LAYOUT_SELECTORS = {
  backgroundImage: 'img[src*="auth-lifestyle"]',
  logo: 'img[alt="Kompleet Logo"]',
  brandNameInHeader: 'header a[href="/dashboard"] span:has-text("KOMPLEET")',
  featuresLink: 'a[href*="features"]',
  contactLink: 'a[href="/contact"]',
  themeToggle: 'button[aria-label="Toggle theme"]',
};

test.describe("Auth layout verification", () => {
  test("login page has shared premium background layout", async ({ page }) => {
    await page.goto("/login");

    // Background image (next/image renders img with src containing the path)
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.backgroundImage)).toBeVisible();

    // Header elements
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.logo)).toBeVisible();
    await expect(page.getByRole("link", { name: /Kompleet Logo KOMPLEET/ })).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.featuresLink)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.contactLink)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.themeToggle)).toBeVisible();

    // Auth card with form
    await expect(page.getByText("Sign in to KOMPLEET")).toBeVisible();
    await expect(page.getByText("Welcome Back")).toBeVisible();
    await expect(page.getByPlaceholder("you@company.ng")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In/ })).toBeVisible();

    // Copy preserved
    await expect(page.getByText("Control Your Money.")).toBeVisible();
    await expect(page.getByText("Grow Your Business.")).toBeVisible();
  });

  test("signup page has shared premium background layout", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.locator(AUTH_LAYOUT_SELECTORS.backgroundImage)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.logo)).toBeVisible();
    await expect(page.getByRole("link", { name: /Kompleet Logo KOMPLEET/ })).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.featuresLink)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.contactLink)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.themeToggle)).toBeVisible();

    await expect(page.getByText("Built for Nigerian SMEs")).toBeVisible();
    await expect(page.getByText("Create Account")).toBeVisible();
    await expect(page.getByText("Already have an account?", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  });

  test("forgot-password page has shared premium background layout", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.locator(AUTH_LAYOUT_SELECTORS.backgroundImage)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.logo)).toBeVisible();
    await expect(page.getByRole("link", { name: /Kompleet Logo KOMPLEET/ })).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.featuresLink)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.contactLink)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.themeToggle)).toBeVisible();

    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to Login/ })).toBeVisible();
    await expect(page.getByPlaceholder("name@company.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /Send Reset Link/ })).toBeVisible();
  });

  test("reset-password page has shared premium background layout", async ({ page }) => {
    await page.goto("/reset-password");

    // Reset page shows loading or one of the states (expired/invalid typically without token)
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.backgroundImage)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.logo)).toBeVisible();
    await expect(page.getByRole("link", { name: /Kompleet Logo KOMPLEET/ })).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.featuresLink)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.contactLink)).toBeVisible();
    await expect(page.locator(AUTH_LAYOUT_SELECTORS.themeToggle)).toBeVisible();

    // One of: loading, form, expired, or error state
    const hasExpectedContent =
      (await page.getByText("Verifying reset link").isVisible()) ||
      (await page.getByText("Set New Password").isVisible()) ||
      (await page.getByText("Link Expired").isVisible()) ||
      (await page.getByText("Something Went Wrong").isVisible()) ||
      (await page.getByText("Back to Login").isVisible());
    expect(hasExpectedContent).toBeTruthy();
  });
});
