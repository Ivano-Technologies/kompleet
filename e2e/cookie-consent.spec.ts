/**
 * Cookie banner and Google Analytics gating.
 *
 * Default Playwright storageState seeds a stored Decline so money-path specs
 * are not blocked by the banner. This file opts out of that so it can assert
 * first-visit behaviour.
 */

import { test, expect } from "@playwright/test";
import { COMPANY_LEGAL } from "../src/lib/legal";
import { COOKIE_CONSENT_STORAGE_KEY } from "../src/lib/cookie-consent";
import { EMPTY_STORAGE_STATE } from "./helpers/cookie-consent";

test.use({ storageState: EMPTY_STORAGE_STATE });

const GA_SCRIPT = 'script[src*="googletagmanager.com/gtag/js"]';

test.describe("Cookie consent", () => {
  test("does not load Google Analytics until the visitor accepts", async ({
    page,
  }) => {
    await page.goto("/pricing");

    const banner = page.getByRole("dialog", { name: "Cookie notice" });
    await expect(banner).toBeVisible();
    await expect(page.locator(GA_SCRIPT)).toHaveCount(0);

    await banner.getByRole("button", { name: "Decline" }).click();
    await expect(banner).toHaveCount(0);
    await expect(page.locator(GA_SCRIPT)).toHaveCount(0);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), COOKIE_CONSENT_STORAGE_KEY),
    ).toBe("denied");

    await page.reload();
    await expect(banner).toHaveCount(0);
    await expect(page.locator(GA_SCRIPT)).toHaveCount(0);

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(banner).toBeVisible();
    await expect(page.locator(GA_SCRIPT)).toHaveCount(0);

    await banner.getByRole("button", { name: "Accept" }).click();
    await expect(banner).toHaveCount(0);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), COOKIE_CONSENT_STORAGE_KEY),
    ).toBe("granted");
    // CI does not set NEXT_PUBLIC_GA_MEASUREMENT_ID, so even Accept must not
    // inject gtag.js. When the id is present, the unit suite covers the load.
    await expect(page.locator(GA_SCRIPT)).toHaveCount(0);
  });

  test("footer legal links point at the company site", async ({ page }) => {
    await page.goto("/pricing");

    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      COMPANY_LEGAL.privacy,
    );
    await expect(footer.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      COMPANY_LEGAL.terms,
    );
    await expect(footer.getByRole("link", { name: "Refunds" })).toHaveAttribute(
      "href",
      COMPANY_LEGAL.refunds,
    );
  });
});
