import { expect, test, type Page } from "@playwright/test";

const AUTH_ROUTES = [
  { path: "/signup", cta: /Create Free Account/ },
  { path: "/login", cta: /Sign In/ },
  { path: "/forgot-password", cta: /Send Reset Code/ },
  { path: "/reset-password", cta: /Update Password/ },
  { path: "/verify-email", cta: /Go to Login/ },
] as const;

async function pageOverflows(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollHeight > doc.clientHeight + 1;
  });
}

test.describe("IVA-90 auth density on laptop viewports", () => {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ] as const) {
    test(`auth forms fit ${viewport.width}x${viewport.height} without scroll`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);

      for (const route of AUTH_ROUTES) {
        await page.goto(route.path);
        const cta = page.getByRole("button", { name: route.cta }).or(
          page.getByRole("link", { name: route.cta }),
        );
        await expect(cta).toBeVisible();
        await expect(cta).toBeInViewport();
        expect(await pageOverflows(page), `${route.path} overflowed`).toBe(
          false,
        );
      }
    });
  }
});
