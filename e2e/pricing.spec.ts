import { expect, test } from "@playwright/test";

test.describe("pricing is off while prices stay unpublished", () => {
  test("redirects /pricing to /signup and does not show a lifetime card", async ({
    page,
  }) => {
    await page.goto("/pricing");

    await expect(page).toHaveURL(/\/signup/);
    await expect(
      page.getByRole("heading", { name: "Lifetime access", level: 2 }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Opening soon to founding users."),
    ).toHaveCount(0);
    await expect(page.locator('[data-plan="lifetime"]')).toHaveCount(0);
  });
});
