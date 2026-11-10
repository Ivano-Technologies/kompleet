import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("10 Nov audit UI copy and wiring", () => {
  it("relabels the invoice list Send control to View invoice and keeps Issue/Send for real actions", () => {
    const list = read("src/app/(dashboard)/invoices/page.tsx");
    const detail = read("src/app/(dashboard)/invoices/[id]/page.tsx");
    const copy = read("src/components/invoices/invoice-copy.ts");
    expect(list).toMatch(/INV_COPY\.openInvoice/);
    expect(list).not.toMatch(/> Send/);
    expect(copy).toMatch(/openInvoice: "View invoice"/);
    expect(copy).toMatch(/sendInvoice: "Send"/);
    expect(copy).toMatch(/sendConfirmTitle:/);
    expect(copy).toMatch(/issueToast: "Invoice issued\."/);
    expect(copy).toMatch(/emailSent:/);
    expect(detail).toMatch(/INV_COPY\.issueToast/);
    expect(detail).toMatch(/INV_COPY\.sendInvoice/);
    expect(detail).toMatch(/INV_COPY\.emailSent/);
    expect(detail).toMatch(/INV_COPY\.sendConfirmTitle/);
    expect(detail).toMatch(/ConfirmDialog/);
    expect(detail).toMatch(/role="status"/);
  });

  it("uses the app confirm dialog for books row and bulk delete", () => {
    const books = read("src/app/(dashboard)/transactions/page.tsx");
    expect(books).toMatch(/ConfirmDialog/);
    expect(books).toMatch(/AnchoredPortal/);
    expect(books).not.toMatch(/\bconfirm\(/);
  });

  it("raises sidebar email contrast on navy", () => {
    const sidebar = read("src/components/layout/dashboard/Sidebar.tsx");
    expect(sidebar).toMatch(/text-white\/60/);
    expect(sidebar).not.toMatch(/text-white\/45/);
  });

  it("shows first + last name in Settings Account and the sidebar", () => {
    const modal = read("src/components/layout/dashboard/SettingsModal.tsx");
    const sidebar = read("src/components/layout/dashboard/Sidebar.tsx");
    const layout = read("src/app/(dashboard)/layout.tsx");
    const signup = read("src/app/signup/page.tsx");
    expect(modal).toMatch(/value=\{profile\.fullName\}/);
    expect(modal).not.toMatch(/value=\{profile\.firstName\}/);
    expect(signup).toMatch(/joinPersonName\(firstName, lastName\)/);
    expect(layout).toMatch(/user_metadata\.full_name/);
    expect(layout).toMatch(/displayName/);
    expect(sidebar).toMatch(/userDisplayName/);
    expect(sidebar).toMatch(/sidebarName/);
  });

  it("stores export expiry on create and hides empty history when rows exist", () => {
    const exportsSrc = read("convex/exports.ts");
    const page = read("src/app/(dashboard)/export/page.tsx");
    expect(exportsSrc).toMatch(/expiresAt: exportExpiresAt\(now\)/);
    expect(exportsSrc).toMatch(/expires_at: exportExpiresAtIso/);
    expect(page).toMatch(/shouldShowExportEmptyState/);
    expect(page).toMatch(/formatExportExpiry/);
    expect(page).toMatch(/historyLoading/);
  });
});
