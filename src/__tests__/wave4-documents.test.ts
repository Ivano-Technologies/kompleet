import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const nav = read("src/components/layout/dashboard/nav-config.ts");
const sidebar = read("src/components/layout/dashboard/Sidebar.tsx");
const bottomNav = read("src/components/layout/dashboard/BottomNav.tsx");
const dropZone = read("src/components/documents/FileDropZone.tsx");
const statement = read("src/components/import/StatementDropZone.tsx");
const copy = read("src/components/documents/docs-copy.ts");
const hub = read("src/app/(dashboard)/documents/page.tsx");
const sheet = read("src/components/documents/AttachFileSheet.tsx");
const preview = read("src/components/documents/FilePreview.tsx");
const files = read("convex/files.ts");
const schema = read("convex/schema.ts");
const txnDetail = read("src/app/(dashboard)/transactions/[id]/page.tsx");
const invDetail = read("src/app/(dashboard)/invoices/[id]/page.tsx");
const expDetail = read("src/app/(dashboard)/expenses/[id]/page.tsx");
const invoiceSheet = read("src/components/invoices/NewInvoiceSheet.tsx");
const invoicePage = read("src/app/(dashboard)/invoices/page.tsx");

describe("IVA-75 Documents hub / More entry", () => {
  it("adds Documents as the first More row and not a sixth primary", () => {
    expect(nav).toMatch(/href: "\/documents"/);
    expect(nav).toMatch(/label: "Documents"/);
    expect(nav).toMatch(/FolderOpen/);
    expect(nav.indexOf('href: "/documents"')).toBeLessThan(
      nav.indexOf('href: "/expenses"'),
    );
    expect(nav).not.toMatch(/key: "documents"/);
    expect(sidebar).toMatch(/MORE_NAV/);
    expect(bottomNav).toMatch(/MORE_NAV/);
    expect(existsSync(resolve(process.cwd(), "src/app/(dashboard)/documents/page.tsx"))).toBe(
      true,
    );
    expect(existsSync(resolve(process.cwd(), "kompleet-design/wave4/DOCS-UPLOADS.md"))).toBe(
      true,
    );
  });

  it("keeps primary destinations at Dashboard · Books · Invoices · Tax · More", () => {
    expect(nav).toMatch(/label: "Dashboard"/);
    expect(nav).toMatch(/label: "Books"/);
    expect(nav).toMatch(/label: "Invoices"/);
    expect(nav).toMatch(/label: "Tax"/);
    expect(sidebar).toMatch(/>More</);
    expect(sidebar).not.toMatch(/href: "\/documents"/);
  });
});

describe("IVA-75 drop-first library", () => {
  it("ships FileDropZone hero/strip/compact with the Docs accept set", () => {
    expect(dropZone).toMatch(/variant === "hero"/);
    expect(dropZone).toMatch(/variant === "strip"/);
    expect(dropZone).toMatch(/variant === "compact"/);
    expect(copy).toMatch(/\.pdf,\.png,\.jpg,\.jpeg,\.webp,\.csv,\.xlsx,\.xls/);
    expect(hub).toMatch(/variant="hero"/);
    expect(hub).toMatch(/variant="strip"/);
    expect(hub).toMatch(/DOCS_COPY\.filterAll/);
    expect(hub).toMatch(/DOCS_COPY\.filterUnattached/);
  });

  it("does not overload StatementDropZone accept and reuses dashed chrome", () => {
    expect(statement).toMatch(/const ACCEPT = "\.csv,\.xlsx,\.xls,\.pdf"/);
    expect(statement).not.toMatch(/\.png/);
    expect(dropZone).toMatch(/border-2 border-dashed/);
    expect(dropZone).toMatch(/border-accent bg-accent\/5/);
    expect(dropZone).not.toMatch(/#C8F000|#E8A317|emoji|teal glow/);
    expect(hub).not.toMatch(/Supabase/);
    expect(copy).not.toMatch(/Supabase/);
  });

  it("locks empty and strip copy", () => {
    expect(copy).toMatch(/Drop PDF, image, or CSV/);
    expect(copy).toMatch(/Attach to a transaction, invoice, or expense anytime/);
    expect(copy).toMatch(/Bank statements\? Drop them on Books or Dashboard/);
    expect(copy).toMatch(/Choose file/);
    expect(copy).toMatch(/moreLabel: "Documents"/);
  });
});

describe("IVA-75 attach / preview / Convex storage", () => {
  it("opens Attach sheet with Transaction default and money-surface lock", () => {
    expect(sheet).toMatch(/lockedLink\?\.type \?\? "transaction"/);
    expect(sheet).toMatch(/DOCS_COPY\.attachTxn/);
    expect(sheet).toMatch(/DOCS_COPY\.attachInvoice/);
    expect(sheet).toMatch(/DOCS_COPY\.attachExpense/);
    expect(txnDetail).toMatch(/AttachFileButton/);
    expect(invDetail).toMatch(/AttachFileButton/);
    expect(expDetail).toMatch(/AttachFileButton/);
    expect(txnDetail).toMatch(/type: "transaction"/);
    expect(invDetail).toMatch(/type: "invoice"/);
    expect(expDetail).toMatch(/type: "expense"/);
  });

  it("previews PDF, image, and CSV table and confirms delete", () => {
    expect(preview).toMatch(/file\.kind === "pdf"/);
    expect(preview).toMatch(/file\.kind === "image"/);
    expect(preview).toMatch(/Papa\.parse/);
    expect(preview).toMatch(/CSV_PREVIEW_ROWS = 50/);
    expect(hub).toMatch(/DeleteFileDialog/);
    expect(copy).toMatch(
      /Links on transactions, invoices, or expenses are cleared/,
    );
  });

  it("uploads through Convex generateUploadUrl and saveFileMetadata", () => {
    expect(files).toMatch(/export const generateUploadUrl/);
    expect(files).toMatch(/export const saveFileMetadata/);
    expect(files).toMatch(/export const listFiles/);
    expect(files).toMatch(/export const getFileUrl/);
    expect(files).toMatch(/export const attachFile/);
    expect(files).toMatch(/export const deleteFile/);
    expect(schema).toMatch(/uploadedFiles: defineTable/);
    expect(schema).toMatch(/invoice_drop/);
    expect(read("src/components/documents/use-library-upload.ts")).toMatch(
      /generateUploadUrl/,
    );
    expect(read("src/components/documents/use-library-upload.ts")).toMatch(
      /open\("POST"/,
    );
    expect(invoiceSheet).toMatch(/source: "invoice_drop"/);
    expect(invoicePage).toMatch(/source: "invoice_drop"/);
    expect(hub).toMatch(/looksLikeBankStatement/);
    expect(hub).toMatch(/DOCS_COPY\.toastStatement/);
  });
});
