/**
 * Money path: receipt photo -> OCR extraction -> categorisation review queue.
 *
 * Drives src/app/(dashboard)/transactions/add-from-receipt/page.tsx, which POSTs
 * the image to /api/expenses/ocr, asks /api/ai/categorize for a category
 * suggestion, then creates the expense through POST /api/transactions. The
 * uncategorised result is what feeds the review queue at /transactions/review.
 *
 * /api/expenses/ocr runs Tesseract server-side: it is slow, needs a language
 * pack, and its output on a synthetic fixture image is not deterministic. Both
 * OCR and the AI categoriser are therefore intercepted, so this spec asserts the
 * *application* wiring (extraction -> prefilled form -> ledger -> review queue)
 * rather than Tesseract's accuracy. Parsing of the raw OCR text itself is
 * covered by unit tests around src/lib/expense-ocr/parse-receipt-text.ts.
 */

import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";
import { login, requireTestCredentials, runId } from "./helpers/auth";

const RECEIPT_SELECTORS = {
  uploadButton: /Upload or take a photo of your receipt/,
  description: "e.g. Shop name",
  amount: "0.00",
  submit: /Add transaction/,
  searchInput: "Search transactions...",
};

const RECEIPT_FIXTURE = fileURLToPath(
  new URL("./fixtures/receipt-sample.png", import.meta.url),
);

const OCR_AMOUNT = 12500.75;
const OCR_VAT = 937.5;
const SUGGESTED_CATEGORY = "Office Supplies";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Stubs the OCR and AI-categorisation boundaries with a deterministic receipt. */
async function stubReceiptPipeline(page: Page, vendor: string): Promise<void> {
  await page.route("**/api/expenses/ocr", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        text: [
          vendor,
          "12 Adeola Odeku Street, Victoria Island",
          `Date: ${today()}`,
          `VAT: NGN ${OCR_VAT}`,
          `TOTAL: NGN ${OCR_AMOUNT}`,
        ].join("\n"),
        vendor,
        date: today(),
        amount: OCR_AMOUNT,
        vat: OCR_VAT,
      }),
    });
  });

  await page.route("**/api/ai/categorize", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ category: SUGGESTED_CATEGORY, confidence: 92 }),
    });
  });
}

test.describe("Receipt OCR", () => {
  test.beforeEach(async ({ page }) => {
    requireTestCredentials();
    await login(page);
  });

  test("extracts a receipt, records it, and queues it for review", async ({
    page,
  }) => {
    const vendor = `Kompleet OCR ${runId()}`;
    await stubReceiptPipeline(page, vendor);

    await page.goto("/transactions/add-from-receipt");
    await expect(
      page.getByRole("heading", {
        name: "Add transaction from receipt",
        level: 1,
      }),
    ).toBeVisible();

    // The visible drop zone is a button; the real input is hidden behind it.
    await expect(
      page.getByRole("button", { name: RECEIPT_SELECTORS.uploadButton }),
    ).toBeVisible();

    await page
      .locator('input[type="file"][accept="image/*"]')
      .setInputFiles(RECEIPT_FIXTURE);

    // OCR results are pushed straight into the review form.
    await expect(
      page.getByPlaceholder(RECEIPT_SELECTORS.description, { exact: true }),
    ).toHaveValue(vendor);
    await expect(
      page.getByPlaceholder(RECEIPT_SELECTORS.amount, { exact: true }),
    ).toHaveValue(
      String(OCR_AMOUNT),
    );
    await expect(page.locator('input[type="date"]')).toHaveValue(today());
    await expect(
      page.getByText(`Suggested category: ${SUGGESTED_CATEGORY}`),
    ).toBeVisible();

    const createResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/transactions" &&
        response.request().method() === "POST",
      { timeout: 60_000 },
    );

    await page.getByRole("button", { name: RECEIPT_SELECTORS.submit }).click();

    const response = await createResponse;
    expect(response.ok()).toBe(true);

    await expect(
      page.getByRole("heading", { name: "Transaction added", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByText("The receipt has been recorded as an expense."),
    ).toBeVisible();

    // The expense is now in the ledger.
    await page.goto("/transactions");
    await page
      .getByPlaceholder(RECEIPT_SELECTORS.searchInput, { exact: true })
      .fill(vendor);
    await expect(page.getByText(vendor).first()).toBeVisible();

    // ...and, because no category was chosen, in the review queue.
    await page.goto("/transactions/review");
    await expect(
      page.getByRole("heading", { name: "Review Transactions", level: 1 }),
    ).toBeVisible();

    // TODO(verify): the review queue renders only the *current* item, taken from
    // the first page of GET /api/transactions ordered by transaction_date desc,
    // then created_at desc. The receipt above is dated today so it should be at
    // the head of the queue, but on an account with >100 transactions dated in
    // the future this assertion would need a sessionId or a filter to be stable.
    await expect(page.getByText(vendor).first()).toBeVisible();
  });

  test("rejects a non-image file before calling OCR", async ({ page }) => {
    let ocrCalled = false;
    await page.route("**/api/expenses/ocr", async (route) => {
      ocrCalled = true;
      await route.fulfill({ status: 200, body: "{}" });
    });

    await page.goto("/transactions/add-from-receipt");
    await expect(
      page.getByRole("heading", {
        name: "Add transaction from receipt",
        level: 1,
      }),
    ).toBeVisible();
    await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
      name: "statement.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("Date,Transaction Details\n", "utf-8"),
    });

    await expect(
      page.getByText("Please select an image file (e.g. JPG, PNG)."),
    ).toBeVisible();
    expect(ocrCalled).toBe(false);
  });

  test("surfaces an OCR failure instead of silently continuing", async ({
    page,
  }) => {
    await page.route("**/api/expenses/ocr", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "OCR failed" }),
      });
    });

    await page.goto("/transactions/add-from-receipt");
    await expect(
      page.getByRole("heading", {
        name: "Add transaction from receipt",
        level: 1,
      }),
    ).toBeVisible();
    await page
      .locator('input[type="file"][accept="image/*"]')
      .setInputFiles(RECEIPT_FIXTURE);

    await expect(page.getByText("OCR failed")).toBeVisible();
    await expect(
      page.getByPlaceholder(RECEIPT_SELECTORS.description, { exact: true }),
    ).toHaveCount(0);
  });
});
