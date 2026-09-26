/**
 * Money path: bank statement upload → parse → transactions land in the ledger.
 *
 * Wave 3 (IVA-77) demotes /transactions/upload to Advanced import. The happy
 * path is the Books DropZone (AUTO). This spec still drives Advanced so we can
 * pin a known bank (GTB) against the GTBank fixture, then land on Books.
 *
 * POST /api/transactions/upload-v2 runs the CSV through the GTBank adapter in
 * src/lib/transaction-import/.
 *
 * The fixture at e2e/fixtures/gtbank-statement.csv matches the GTB csvConfig in
 * src/lib/transaction-import/bank-configs.ts exactly:
 *   Date (DD/MM/YYYY) | Transaction Details | Debit | Credit | Balance
 * Running balances in the fixture are internally consistent so the balance
 * validator does not raise a mismatch warning.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";
import { login, requireTestCredentials, runId } from "./helpers/auth";

const UPLOAD_SELECTORS = {
  bankSelect: 'select:has(option[value="GTB"])',
  fileInput: "#advanced-statement-input",
  searchInput: "Search transactions...",
};

const FIXTURE_PATH = fileURLToPath(
  new URL("./fixtures/gtbank-statement.csv", import.meta.url),
);

/**
 * Reads the checked-in fixture and tags every merchant with a per-run marker so
 * repeated runs against the same account stay distinguishable in the ledger.
 */
function buildStatement(marker: string): Buffer {
  const csv = readFileSync(FIXTURE_PATH, "utf-8").replaceAll(
    "Kompleet Fixture",
    `Kompleet Fixture ${marker}`,
  );
  return Buffer.from(csv, "utf-8");
}

async function gotoAdvancedImport(page: Page): Promise<void> {
  await page.goto("/transactions/upload");
  await expect(
    page.getByRole("heading", { name: "Advanced import", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Books" })).toBeVisible();
  // Client-rendered DropZone; wait until bank override + file input hydrate.
  await expect(page.locator(UPLOAD_SELECTORS.bankSelect)).toBeEnabled();
  await expect(page.locator(UPLOAD_SELECTORS.fileInput)).toBeEnabled();
}

test.describe("Bank statement upload", () => {
  test.beforeEach(async ({ page }) => {
    requireTestCredentials();
    await login(page);
  });

  test("imports a GTBank CSV from Advanced import and shows the transactions", async ({
    page,
  }) => {
    const marker = runId();
    await gotoAdvancedImport(page);

    await expect(page.locator(UPLOAD_SELECTORS.bankSelect)).toHaveValue("AUTO");
    await page.locator(UPLOAD_SELECTORS.bankSelect).selectOption("GTB");
    await expect(page.locator(UPLOAD_SELECTORS.bankSelect)).toHaveValue("GTB");

    const uploadResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/transactions/upload-v2") &&
        response.request().method() === "POST",
      { timeout: 90_000 },
    );

    // DropZone uploads as soon as a supported file is attached.
    await page.locator(UPLOAD_SELECTORS.fileInput).setInputFiles({
      name: `gtbank-statement-${marker}.csv`,
      mimeType: "text/csv",
      buffer: buildStatement(marker),
    });

    const response = await uploadResponse;
    expect(
      response.status(),
      "upload-v2 rejected the fixture — check the response body for the parser error",
    ).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      imported: number;
      errors: number;
      sessionId?: string;
    };
    expect(body.success).toBe(true);
    expect(body.errors).toBe(0);
    expect(body.imported).toBe(5);

    await expect(
      page.getByText("5 transactions added · books updated"),
    ).toBeVisible();

    await page.getByRole("link", { name: "View books" }).click();
    await expect(page).toHaveURL(/\/transactions/);
    await expect(page.getByRole("heading", { name: "Books", level: 1 })).toBeVisible();

    await page
      .getByPlaceholder(UPLOAD_SELECTORS.searchInput, { exact: true })
      .fill(marker);
    await expect(page.getByText(new RegExp(marker, "i")).first()).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Kompleet Fixture ${marker}`, "i")).first(),
    ).toBeVisible();
  });

  test("defaults Advanced import to AUTO bank detection", async ({ page }) => {
    await gotoAdvancedImport(page);
    await expect(page.locator(UPLOAD_SELECTORS.bankSelect)).toHaveValue("AUTO");
    await expect(
      page.getByRole("button", { name: "Upload Transactions" }),
    ).toHaveCount(0);
  });

  test("rejects a file type the adapters cannot parse", async ({ page }) => {
    await gotoAdvancedImport(page);

    await page.locator(UPLOAD_SELECTORS.fileInput).setInputFiles({
      name: "not-a-statement.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("this is not a bank statement", "utf-8"),
    });

    await expect(
      page.getByText("Please select a CSV, Excel, or PDF file"),
    ).toBeVisible();
  });
});
