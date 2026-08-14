/**
 * Money path: export transactions and reports, and assert the file actually
 * comes down the wire.
 *
 * Covers two independent export surfaces:
 *   1. src/app/(dashboard)/export/page.tsx — NDPR consent gate, then
 *      POST /api/export/transactions (CSV + XLSX) and POST /api/export/bulk
 *      (ZIP), each returning an `attachment` Content-Disposition.
 *   2. The inline Export menu on src/app/(dashboard)/transactions/page.tsx,
 *      which streams GET /api/transactions/export into a blob download.
 *
 * NOTE: the "Export PDF" buttons on the report pages (profit-loss,
 * balance-sheet) call window.print() rather than producing a file, so there is
 * no download to assert there. The only true PDF download in the product is the
 * jsPDF one on the calculator pages, which is covered below.
 */

import { test, expect, type Page } from "@playwright/test";
import { login, requireTestCredentials } from "./helpers/auth";

const EXPORT_SELECTORS = {
  consent: "#consent",
  downloadCsv: "Download CSV",
  downloadExcel: "Download Excel",
  downloadArchive: "Download Complete Archive",
};

const DOWNLOAD_TIMEOUT = 120_000;

async function gotoExportCentre(page: Page): Promise<void> {
  await page.goto("/export");
  await expect(
    page.getByRole("heading", { name: "Export Center", level: 1 }),
  ).toBeVisible();
}

test.describe("Export centre", () => {
  test.beforeEach(async ({ page }) => {
    requireTestCredentials();
    await login(page);
  });

  test("gates every export behind the NDPR consent checkbox", async ({
    page,
  }) => {
    await gotoExportCentre(page);

    await expect(
      page.getByText("Data Export Consent (NDPR Compliance)"),
    ).toBeVisible();

    const csvButton = page.getByRole("button", {
      name: EXPORT_SELECTORS.downloadCsv,
    });
    const excelButton = page.getByRole("button", {
      name: EXPORT_SELECTORS.downloadExcel,
    });
    const archiveButton = page.getByRole("button", {
      name: EXPORT_SELECTORS.downloadArchive,
    });

    await expect(csvButton).toBeDisabled();
    await expect(excelButton).toBeDisabled();
    await expect(archiveButton).toBeDisabled();

    await page.locator(EXPORT_SELECTORS.consent).check();

    await expect(csvButton).toBeEnabled();
    await expect(excelButton).toBeEnabled();
    await expect(archiveButton).toBeEnabled();
  });

  test("downloads transactions as CSV", async ({ page }) => {
    await gotoExportCentre(page);
    await page.locator(EXPORT_SELECTORS.consent).check();

    const exportResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/export/transactions" &&
        response.request().method() === "POST",
      { timeout: DOWNLOAD_TIMEOUT },
    );
    const downloadPromise = page.waitForEvent("download", {
      timeout: DOWNLOAD_TIMEOUT,
    });

    await page
      .getByRole("button", { name: EXPORT_SELECTORS.downloadCsv })
      .click();

    const response = await exportResponse;
    expect(
      response.status(),
      `export POST returned HTTP ${response.status()} content-type=${response.headers()["content-type"] ?? "missing"}`,
    ).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(/csv/i);
    expect(response.headers()["content-disposition"]).toContain("attachment");

    const download = await downloadPromise;
    // The page derives the filename from Content-Disposition, which the route
    // sets to transactions_<taxYear>.csv (or transactions_all.csv).
    expect(download.suggestedFilename()).toMatch(/^transactions_.*\.csv$/);

    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test("downloads transactions as Excel", async ({ page }) => {
    await gotoExportCentre(page);
    await page.locator(EXPORT_SELECTORS.consent).check();

    const exportResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/export/transactions" &&
        response.request().method() === "POST",
      { timeout: DOWNLOAD_TIMEOUT },
    );
    const downloadPromise = page.waitForEvent("download", {
      timeout: DOWNLOAD_TIMEOUT,
    });

    await page
      .getByRole("button", { name: EXPORT_SELECTORS.downloadExcel })
      .click();

    const response = await exportResponse;
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain(
      "spreadsheetml.sheet",
    );

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^transactions_.*\.xlsx$/);

    // An .xlsx is a zip container: assert the magic bytes so an HTML error page
    // renamed to .xlsx cannot pass this test.
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
      if (Buffer.concat(chunks).length >= 4) break;
    }
    expect(Buffer.concat(chunks).subarray(0, 2).toString("latin1")).toBe("PK");
  });

  test("records completed exports in the export history table", async ({
    page,
  }) => {
    await gotoExportCentre(page);
    await page.locator(EXPORT_SELECTORS.consent).check();

    const downloadPromise = page.waitForEvent("download", {
      timeout: DOWNLOAD_TIMEOUT,
    });
    await page
      .getByRole("button", { name: EXPORT_SELECTORS.downloadCsv })
      .click();
    await downloadPromise;

    // /api/export/transactions inserts the export_history row fire-and-forget,
    // so the in-page refresh that fires immediately after the download can beat
    // the insert. Reload instead of racing it.
    await page.reload();
    await expect(page.getByText("Export History")).toBeVisible();

    // The history table only renders its header row once at least one export
    // exists; before that the page shows "No exports yet".
    await expect(
      page.getByRole("columnheader", { name: "Format" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("cell", { name: "csv", exact: true }).first())
      .toBeVisible();
    await expect(page.getByText("No exports yet")).toHaveCount(0);
  });

  test("exports the transactions list from the ledger toolbar", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expect(
      page.getByRole("heading", { name: "Transactions", level: 1 }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Export", exact: true }).click();

    const downloadPromise = page.waitForEvent("download", {
      timeout: DOWNLOAD_TIMEOUT,
    });
    await page.getByRole("button", { name: "Export as CSV" }).click();
    const download = await downloadPromise;

    // The page names the blob transactions_<YYYY-MM-DD>.csv client-side.
    expect(download.suggestedFilename()).toMatch(
      /^transactions_\d{4}-\d{2}-\d{2}\.csv$/,
    );
  });

  test("downloads a calculation as PDF", async ({ page }) => {
    // Like tax-calculation.spec.ts, this needs the tax_rules table seeded —
    // without it the calculator never renders a result and the PDF button never
    // appears. See e2e/README.md.
    await page.goto("/calculators/individual-tax");
    await expect(
      page.getByRole("heading", {
        name: "Individual Tax Calculator",
        level: 1,
      }),
    ).toBeVisible();

    const calculateButton = page.getByRole("button", {
      name: /Calculate Tax/,
    });
    await expect(calculateButton).toBeEnabled({ timeout: 30_000 });

    await page.locator("#income").fill("15000000");
    await calculateButton.click();
    await expect(page.getByText("Tax Summary")).toBeVisible();

    const downloadPromise = page.waitForEvent("download", {
      timeout: DOWNLOAD_TIMEOUT,
    });
    await page.getByRole("button", { name: /Export as PDF/ }).click();
    const download = await downloadPromise;

    // src/lib/pdf-generator.ts builds KOMPLEET-<calculator-slug>-<date>.pdf.
    expect(download.suggestedFilename()).toMatch(
      /^KOMPLEET-individual-income-tax-calculator-\d{4}-\d{2}-\d{2}\.pdf$/,
    );

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
      if (Buffer.concat(chunks).length >= 5) break;
    }
    expect(Buffer.concat(chunks).subarray(0, 5).toString("latin1")).toBe(
      "%PDF-",
    );
  });
});
