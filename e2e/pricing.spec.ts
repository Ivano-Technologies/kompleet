import { expect, test, type Locator } from "@playwright/test";

async function layoutBox(locator: Locator) {
  return locator.evaluate((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
}

test.describe("pricing founding lifetime card", () => {
  test("shows the free plan and a no-price lifetime card", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: "Free during beta", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Lifetime access", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "For founding users: one payment, lifetime access for one user, and it is coming soon.",
      ),
    ).toBeVisible();

    const comingSoon = page.getByRole("button", { name: "Coming soon" });
    await expect(comingSoon).toBeDisabled();
    await expect(
      page.locator("main").getByRole("link", { name: "Get started" }),
    ).toHaveAttribute("href", "/signup");
    await expect(page.getByText(/₦5,?000/)).toHaveCount(0);
  });

  test("sits beside the free card at 1280 and stacks at 390", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pricing");

    const freeHeading = page.locator("main h2").nth(0);
    const lifetimeHeading = page.getByRole("heading", {
      name: "Lifetime access",
      level: 2,
    });
    await expect(lifetimeHeading).toBeVisible();
    await expect(page.getByRole("button", { name: "Coming soon" })).toBeDisabled();

    await expect
      .poll(async () => {
        const freeBox = await layoutBox(freeHeading);
        const lifetimeBox = await layoutBox(lifetimeHeading);
        return (
          lifetimeBox.x > freeBox.x + 80 &&
          Math.abs(freeBox.y - lifetimeBox.y) < 48
        );
      })
      .toBe(true);

    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await expect(lifetimeHeading).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(async () => {
        const freeBox = await layoutBox(freeHeading);
        const lifetimeBox = await layoutBox(lifetimeHeading);
        return lifetimeBox.y - freeBox.y;
      })
      .toBeGreaterThan(80);
    await expect(page.getByRole("button", { name: "Coming soon" })).toBeVisible();
  });
});
