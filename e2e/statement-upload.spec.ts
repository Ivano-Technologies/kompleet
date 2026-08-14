/**
 * Money path: bank statement upload -> parse -> transactions land in the ledger.
 *
 * Drives src/app/(dashboard)/transactions/upload/page.tsx against the real
 * POST /api/transactions/upload-v2 handler, which runs the CSV through the
 * GTBank adapter in src/lib/transaction-import/.
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
  // The only <select> on the page is the bank picker; anchor on a known option
  // value so it stays unambiguous if the dashboard shell ever grows one.
  bankSelect: 'select:has(option[value="GTB"])',
  fileInput: "#file-input",
  uploadButton: "Upload Transactions",
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

async function gotoUploadPage(page: Page): Promise<void> {
  await page.goto("/transactions/upload");
  await expect(
    page.getByRole("heading", { name: "Upload Transactions", level: 1 }),
  ).toBeVisible();
}

test.describe("Bank statement upload", () => {
  test.beforeEach(async ({ page }) => {
    requireTestCredentials();
    await login(page);
  });

  test("imports a GTBank CSV statement and shows the transactions", async ({
    page,
  }) => {
    const marker = runId();
    await gotoUploadPage(page);

    // All 11 Nigerian bank adapters are rendered from SUPPORTED_BANKS.
    await expect(page.locator(UPLOAD_SELECTORS.bankSelect)).toBeVisible();
    await page.locator(UPLOAD_SELECTORS.bankSelect).selectOption("GTB");
    await expect(page.locator(UPLOAD_SELECTORS.bankSelect)).toHaveValue("GTB");

    await page.locator(UPLOAD_SELECTORS.fileInput).setInputFiles({
      name: `gtbank-statement-${marker}.csv`,
      mimeType: "text/csv",
      buffer: buildStatement(marker),
    });

    // The page renders the filename once a file is attached.
    await expect(
      page.getByText(`gtbank-statement-${marker}.csv`),
    ).toBeVisible();

    const uploadResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/transactions/upload-v2") &&
        response.request().method() === "POST",
      { timeout: 90_000 },
    );

    await page
      .getByRole("button", { name: UPLOAD_SELECTORS.uploadButton })
      .click();

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
    // Five data rows in the fixture, none of which the parser should drop.
    expect(body.imported).toBe(5);

    await expect(page.getByText("Upload Complete")).toBeVisible();
    await expect(page.getByText("Imported:")).toBeVisible();
    await expect(page.getByText("5 transactions")).toBeVisible();

    await page.getByRole("button", { name: "View Transactions" }).click();
    await expect(page).toHaveURL(/\/transactions/);

    // The importer stores the *normalized* merchant (title-cased, prefixes
    // stripped by src/lib/transaction-import/normalizer.ts), so match the run
    // marker case-insensitively rather than the raw CSV text. The search filter
    // itself is an ilike, so the query string casing does not matter either.
    await page
      .getByPlaceholder(UPLOAD_SELECTORS.searchInput, { exact: true })
      .fill(marker);
    await expect(page.getByText(new RegExp(marker, "i")).first()).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Kompleet Fixture ${marker}`, "i")).first(),
    ).toBeVisible();
  });

  test("blocks upload until both a bank and a file are chosen", async ({
    page,
  }) => {
    await gotoUploadPage(page);

    const uploadButton = page.getByRole("button", {
      name: UPLOAD_SELECTORS.uploadButton,
    });
    await expect(uploadButton).toBeDisabled();

    await page.locator(UPLOAD_SELECTORS.fileInput).setInputFiles({
      name: "gtbank-statement.csv",
      mimeType: "text/csv",
      buffer: buildStatement(runId()),
    });
    // File attached, bank still unset.
    await expect(uploadButton).toBeDisabled();

    await page.locator(UPLOAD_SELECTORS.bankSelect).selectOption("GTB");
    await expect(page.locator(UPLOAD_SELECTORS.bankSelect)).toHaveValue("GTB");
    await expect(uploadButton).toBeEnabled();
  });

  test("rejects a file type the adapters cannot parse", async ({ page }) => {
    await gotoUploadPage(page);

    await page.locator(UPLOAD_SELECTORS.fileInput).setInputFiles({
      name: "not-a-statement.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("this is not a bank statement", "utf-8"),
    });

    await expect(
      page.getByText("Please select a CSV, Excel, or PDF file"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: UPLOAD_SELECTORS.uploadButton }),
    ).toBeDisabled();
  });
});
