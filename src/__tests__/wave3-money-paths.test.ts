import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const books = read("src/app/(dashboard)/transactions/page.tsx");
const upload = read("src/app/(dashboard)/transactions/upload/page.tsx");
const dropZone = read("src/components/import/StatementDropZone.tsx");
const copy = read("src/components/import/statement-copy.ts");
const invoices = read("src/app/(dashboard)/invoices/page.tsx");
const sheet = read("src/components/invoices/NewInvoiceSheet.tsx");
const invCopy = read("src/components/invoices/invoice-copy.ts");
const taxHub = read("src/app/(dashboard)/tax/page.tsx");
const taxCard = read("src/components/tax/GenerateFromBooksCard.tsx");
const taxCopy = read("src/components/tax/tax-copy.ts");
const override = read("src/app/(dashboard)/tax-reports/generate/page.tsx");
const filing = read("src/app/(dashboard)/filing/page.tsx");
const filingSheet = read("src/components/tax/FilingGenerateSheet.tsx");
const nav = read("src/components/layout/dashboard/nav-config.ts");
const sidebar = read("src/components/layout/dashboard/Sidebar.tsx");
const dashboard = read("src/app/(dashboard)/dashboard/DashboardClient.tsx");

describe("IVA-77 Import AUTO on Books", () => {
  it("uses strip above filters and hero when empty, with Import as primary", () => {
    expect(books).toMatch(/DROP_COPY\.ctaImportShort/);
    expect(books).toMatch(/variant="hero"/);
    expect(books).toMatch(/variant="strip"/);
    expect(books).toMatch(/DROP_COPY\.booksStripTitle/);
    expect(books.indexOf("variant=\"strip\"")).toBeLessThan(
      books.indexOf("Search transactions"),
    );
    expect(books).not.toMatch(/Review Uncategorized/);
    expect(books).not.toMatch(/<Upload/);
    expect(books).toMatch(/DROP_COPY\.advancedTrouble/);
  });

  it("stays on Books after AUTO upload and shows toast plus exception banner", () => {
    expect(dropZone).toMatch(/DEFAULT_BANK_CODE/);
    expect(dropZone).toMatch(/\/api\/transactions\/upload-v2/);
    expect(books).toMatch(/ImportToast/);
    expect(books).toMatch(/ExceptionBanner/);
    expect(copy).toMatch(/transactions added · books updated/);
  });

  it("demotes /transactions/upload to Advanced import", () => {
    expect(existsSync(resolve(process.cwd(), "src/app/(dashboard)/transactions/upload/page.tsx"))).toBe(
      true,
    );
    expect(upload).toMatch(/DROP_COPY\.advancedTitle/);
    expect(upload).toMatch(/DROP_COPY\.advancedBack/);
    expect(upload).toMatch(/showBankSelect/);
    expect(upload).toMatch(/advanced-statement-input/);
    expect(nav).not.toMatch("/transactions/upload");
    expect(sidebar).not.toMatch("/transactions/upload");
  });
});

describe("IVA-78 Invoices drop + quick create", () => {
  it("opens New as A/B/C sheet with Issue as the quick-create primary", () => {
    expect(invoices).toMatch(/NewInvoiceSheet/);
    expect(invoices).toMatch(/setSheetOpen\(true\)/);
    expect(sheet).toMatch(/A · Drop/);
    expect(sheet).toMatch(/B · Quick create/);
    expect(sheet).toMatch(/INV_COPY\.fullLink/);
    expect(sheet).toMatch(/INV_COPY\.quickIssue/);
    expect(invCopy).toMatch(/quickIssue: "Issue"/);
    expect(sheet.indexOf("INV_COPY.quickSaveDraft")).toBeLessThan(
      sheet.indexOf("INV_COPY.quickIssue"),
    );
  });

  it("gives empty-state drop and create equal weight and creates clients inline", () => {
    expect(invoices).toMatch(/InvoiceDropZone/);
    expect(invoices).toMatch(/INV_COPY\.emptyCreateTitle/);
    expect(invoices).toMatch(/grid md:grid-cols-2/);
    expect(sheet).toMatch(/CustomerCombobox/);
    expect(read("src/app/api/clients/route.ts")).toMatch(/handlePOST/);
    expect(dashboard).toMatch(/\/invoices\?new=1/);
  });
});

describe("IVA-79 Tax generate from books + Filing PDF", () => {
  it("asks period + entity only when books exist and demotes override", () => {
    expect(taxHub).toMatch(/GenerateFromBooksCard/);
    expect(taxCard).toMatch(/TAX_COPY\.period/);
    expect(taxCard).toMatch(/TAX_COPY\.entity/);
    expect(taxCard).toMatch(/TAX_COPY\.advanced/);
    expect(taxCard).toMatch(/\/api\/tax-reports\/generate/);
    expect(taxCard).not.toMatch(/name="totalRevenue"/);
    expect(override).toMatch(/Override figures/);
    expect(override).toMatch(/Back to Tax/);
    expect(taxCopy).toMatch(/Drop a statement first/);
  });

  it("renders a real Filing Generate PDF sheet and mark-filed confirmation", () => {
    expect(filing).toMatch(/showGenerateModal/);
    expect(filing).toMatch(/FilingGenerateSheet/);
    expect(filingSheet).toMatch(/\/api\/forms\/generate/);
    expect(filingSheet).toMatch(/TAX_COPY\.filingGenCta/);
    expect(filingSheet).toMatch(/confirmationNumber/);
    expect(filing).not.toMatch(/href="\/tax-reports\/generate"/);
  });

  it("keeps Wave 2 sidebar IA and Option C tokens", () => {
    expect(nav).toMatch(/label: "Books"/);
    expect(nav).toMatch(/label: "Invoices"/);
    expect(nav).toMatch(/label: "Tax"/);
    expect(sidebar).toMatch(/>More</);
    expect(books).toMatch(/text-success/);
    expect(books).not.toMatch(/#C8F000|#E8A317/);
    expect(sheet).not.toMatch(/#C8F000|#E8A317/);
    expect(taxCard).not.toMatch(/#C8F000|#E8A317/);
  });
});
