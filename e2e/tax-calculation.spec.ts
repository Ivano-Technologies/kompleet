/**
 * Money path: run a tax calculation -> save it -> retrieve it from history.
 *
 * Drives src/app/(dashboard)/calculators/individual-tax/page.tsx (PIT), which
 * pulls its bands from GET /api/tax-rules?type=individual_income_tax via
 * useTaxRules, saves through POST /api/calculations/save (amounts converted to
 * kobo by SaveCalculationButton), and is read back by
 * src/app/(dashboard)/calculators/history/page.tsx via GET /api/calculations.
 */

import { test, expect } from "@playwright/test";
import { login, requireTestCredentials } from "./helpers/auth";

const CALCULATOR_SELECTORS = {
  grossIncome: "#income",
  rentPaid: "#rent",
  ownerOccupierInterest: "#interest",
  calculate: /Calculate Tax/,
  save: /Save to Account/,
  saved: /Saved!/,
  exportPdf: /Export as PDF/,
};

const GROSS_INCOME = "15000000";
const RENT_PAID = "3000000";

test.describe("Tax calculation", () => {
  test.beforeEach(async ({ page }) => {
    requireTestCredentials();
    await login(page);
  });

  test("calculates PIT from seeded tax rules", async ({ page }) => {
    await page.goto("/calculators/individual-tax");

    await expect(
      page.getByRole("heading", {
        name: "Individual Tax Calculator",
        level: 1,
      }),
    ).toBeVisible();

    const calculateButton = page.getByRole("button", {
      name: CALCULATOR_SELECTORS.calculate,
    });

    // The button stays disabled (and labelled "Loading Rules…") until
    // /api/tax-rules resolves. After hardening, authenticated SELECT on
    // tax_rules/rule_versions must be granted or this stays "Rules Unavailable".
    await expect(calculateButton).toBeEnabled({ timeout: 30_000 });

    // If the tax_rules table is not seeded the page falls back to an error
    // banner and calculateIndividualTax() refuses to run at all. Fail here with
    // a readable message instead of on a confusing downstream assertion.
    await expect(
      page.getByText(/Failed to load tax rules/),
      "tax rules are not seeded — run populate_tax_rules.sql against the test project",
    ).toHaveCount(0);

    await page.locator(CALCULATOR_SELECTORS.grossIncome).fill(GROSS_INCOME);
    await page.locator(CALCULATOR_SELECTORS.rentPaid).fill(RENT_PAID);

    await calculateButton.click();

    // Results panel. Only assert on values that are pure functions of the input:
    // gross income is echoed back verbatim, everything else depends on the bands
    // stored in the tax rules engine.
    await expect(page.getByText("Tax Summary")).toBeVisible();
    await expect(page.getByText("Gross Income:")).toBeVisible();
    await expect(page.getByText(/15,000,000\.00/).first()).toBeVisible();
    await expect(page.getByText("Taxable Income:")).toBeVisible();
    await expect(page.getByText("Total Tax:")).toBeVisible();
    await expect(page.getByText("Effective Tax Rate:")).toBeVisible();
    await expect(page.getByText("Tax Bracket Breakdown")).toBeVisible();
  });

  // tax_calculations is Phase 3 Wave E (docs/PHASE_3_BRIEF.md). The table is
  // still in the drift baseline; POST /api/calculations/save cannot succeed
  // until that wave. Keep the spec so Wave E unskips it rather than rewriting.
  test.skip(
    "saves a PIT calculation and finds it again in history",
    async ({ page }) => {
    await page.goto("/calculators/individual-tax");

    await expect(
      page.getByRole("heading", {
        name: "Individual Tax Calculator",
        level: 1,
      }),
    ).toBeVisible();

    const calculateButton = page.getByRole("button", {
      name: CALCULATOR_SELECTORS.calculate,
    });

    // The button stays disabled (and labelled "Loading Rules…") until
    // /api/tax-rules resolves.
    await expect(calculateButton).toBeEnabled({ timeout: 30_000 });

    // If the tax_rules table is not seeded the page falls back to an error
    // banner and calculateIndividualTax() refuses to run at all. Fail here with
    // a readable message instead of on a confusing downstream assertion.
    await expect(
      page.getByText(/Failed to load tax rules/),
      "tax rules are not seeded — run populate_tax_rules.sql against the test project",
    ).toHaveCount(0);

    await page.locator(CALCULATOR_SELECTORS.grossIncome).fill(GROSS_INCOME);
    await page.locator(CALCULATOR_SELECTORS.rentPaid).fill(RENT_PAID);

    await calculateButton.click();

    // Results panel. Only assert on values that are pure functions of the input:
    // gross income is echoed back verbatim, everything else depends on the bands
    // stored in the tax rules engine.
    await expect(page.getByText("Tax Summary")).toBeVisible();
    await expect(page.getByText("Gross Income:")).toBeVisible();
    await expect(page.getByText(/15,000,000\.00/).first()).toBeVisible();
    await expect(page.getByText("Taxable Income:")).toBeVisible();
    await expect(page.getByText("Total Tax:")).toBeVisible();
    await expect(page.getByText("Effective Tax Rate:")).toBeVisible();
    await expect(page.getByText("Tax Bracket Breakdown")).toBeVisible();

    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/calculations/save") &&
        response.request().method() === "POST",
      { timeout: 60_000 },
    );

    await page.getByRole("button", { name: CALCULATOR_SELECTORS.save }).click();

    const response = await saveResponse;
    expect(response.status()).toBe(200);

    const saved = (await response.json()) as {
      success: boolean;
      calculation: { id: string; tax_type: string; gross_amount: number };
    };
    expect(saved.success).toBe(true);
    expect(saved.calculation.tax_type).toBe("pit");
    // SaveCalculationButton converts naira to kobo before POSTing.
    expect(saved.calculation.gross_amount).toBe(Number(GROSS_INCOME) * 100);

    await expect(
      page.getByRole("button", { name: CALCULATOR_SELECTORS.saved }),
    ).toBeVisible();

    // Retrieve from history.
    await page.goto("/calculators/history");
    await expect(
      page.getByRole("heading", { name: "Calculation History", level: 1 }),
    ).toBeVisible();

    const historyResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/calculations") &&
        response.request().method() === "GET",
      { timeout: 60_000 },
    );

    // Narrow to PIT so the assertion does not depend on how much other history
    // the test account has accumulated.
    await page.getByRole("button", { name: "PIT", exact: true }).click();
    await historyResponse;

    await expect(
      page.getByText("Personal Income Tax").first(),
    ).toBeVisible();
    await expect(page.getByText("Gross Amount").first()).toBeVisible();
    await expect(page.getByText("Tax Due").first()).toBeVisible();
    // The history page divides the stored kobo value back down to naira.
    await expect(page.getByText(/15,000,000\.00/).first()).toBeVisible();
    },
  );

  test("rejects a negative gross income", async ({ page }) => {
    await page.goto("/calculators/individual-tax");
    await expect(
      page.getByRole("heading", {
        name: "Individual Tax Calculator",
        level: 1,
      }),
    ).toBeVisible();

    const calculateButton = page.getByRole("button", {
      name: CALCULATOR_SELECTORS.calculate,
    });
    await expect(calculateButton).toBeEnabled({ timeout: 30_000 });

    await page.locator(CALCULATOR_SELECTORS.grossIncome).fill("-1");
    await calculateButton.click();

    await expect(
      page.getByText("Please enter a valid gross income amount"),
    ).toBeVisible();
    await expect(page.getByText("Tax Summary")).toHaveCount(0);
  });

  test("the calculators index links to every phase 1 calculator", async ({
    page,
  }) => {
    await page.goto("/calculators");

    await expect(
      page.getByRole("link", { name: /Business Tax \(CIT\)/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Individual Tax \(PIT\)/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /VAT Compliance/ }),
    ).toBeVisible();
  });
});
