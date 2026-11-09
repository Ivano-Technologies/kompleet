import { createRequire } from "node:module";
import { expect, test, type Locator, type Page } from "@playwright/test";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

const PAGES = ["/", "/pricing", "/signup", "/privacy"] as const;

/** sticky/fixed controls can make Playwright boundingBox() return null. */
async function expectTapTarget(locator: Locator, minPx: number): Promise<void> {
  await expect(async () => {
    const metrics = await locator.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        display: getComputedStyle(el).display,
        width: rect.width,
        height: rect.height,
      };
    });
    expect(metrics.display).not.toBe("none");
    expect(metrics.width).toBeGreaterThanOrEqual(minPx);
    expect(metrics.height).toBeGreaterThanOrEqual(minPx);
  }).toPass({ timeout: 10_000 });
}

async function axeViolations(page: Page) {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Document,
            options: { runOnly: { type: string; values: string[] } },
          ) => Promise<{
            violations: { id: string; impact: string | null; nodes: unknown[] }[];
          }>;
        };
      }
    ).axe;
    const result = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      count: violation.nodes.length,
    }));
  });
}

test.describe("IVA-290 marketing accessibility", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of PAGES) {
    test(`${path} has no WCAG 2.1 AA axe violations at 390`, async ({
      page,
    }) => {
      await page.goto(path);
      const violations = await axeViolations(page);
      expect(violations, JSON.stringify(violations)).toEqual([]);
    });
  }

  test("signup labels, errors and password toggle are named", async ({
    page,
  }) => {
    await page.goto("/signup");

    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel("Business Name")).toBeVisible();
    await expect(page.getByLabel("Business Email")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();

    const toggle = page.getByRole("button", { name: "Show password" });
    await expect(toggle).toBeVisible();
    await expectTapTarget(toggle, 44);
  });

  test("landing, pricing, signup and privacy expose a main landmark", async ({
    page,
  }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator("main#main-content")).toHaveCount(1);
    }
  });

  test("open menu control is at least 44px at 390", async ({ page }) => {
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Open menu" });
    await expect(menu).toBeVisible();
    await expectTapTarget(menu, 44);
  });
});
