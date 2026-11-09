/**
 * Cookie banner and Google Analytics gating.
 *
 * Default Playwright storageState seeds a stored Decline so money-path specs
 * are not blocked by the banner. This file opts out of that so it can assert
 * first-visit behaviour.
 */

import { test, expect } from "@playwright/test";
import { COMPANY_LEGAL } from "../src/lib/legal";
import {
  COOKIE_BANNER_HEIGHT_VAR,
  COOKIE_CONSENT_STORAGE_KEY,
} from "../src/lib/cookie-consent";
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

  test("signup submit scrolls clear of the banner at 390x844", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/signup");

    const banner = page.getByRole("dialog", { name: "Cookie notice" });
    await expect(banner).toBeVisible();

    const inset = await page.evaluate((varName) => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
    }, COOKIE_BANNER_HEIGHT_VAR);
    const bannerBox = await banner.boundingBox();
    expect(bannerBox).not.toBeNull();
    expect(Number.parseFloat(inset)).toBeGreaterThanOrEqual(
      Math.floor(bannerBox!.height),
    );

    const decline = banner.getByRole("button", { name: "Decline" });
    const accept = banner.getByRole("button", { name: "Accept" });
    const declineBox = await decline.boundingBox();
    const acceptBox = await accept.boundingBox();
    expect(declineBox).not.toBeNull();
    expect(acceptBox).not.toBeNull();
    expect(Math.abs(declineBox!.y - acceptBox!.y)).toBeLessThan(2);
    expect(Math.abs(declineBox!.width - acceptBox!.width)).toBeLessThan(2);
    expect(acceptBox!.x).toBeGreaterThan(declineBox!.x);

    const submit = page.getByRole("button", { name: /Create Free Account/ });
    await submit.scrollIntoViewIfNeeded();
    const submitBox = await submit.boundingBox();
    expect(submitBox).not.toBeNull();
    expect(submitBox!.y + submitBox!.height).toBeLessThanOrEqual(
      bannerBox!.y + 1,
    );
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
