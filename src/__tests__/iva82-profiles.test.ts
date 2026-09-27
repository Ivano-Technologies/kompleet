import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("IVA-82 business + client profiles", () => {
  it("adds Business and Clients to SettingsModal after Account", () => {
    const modal = read("src/components/layout/dashboard/SettingsModal.tsx");
    expect(modal).toMatch(/id: "business", label: "Business"/);
    expect(modal).toMatch(/id: "clients", label: "Clients"/);
    expect(modal.indexOf('id: "general"')).toBeLessThan(modal.indexOf('id: "business"'));
    expect(modal.indexOf('id: "business"')).toBeLessThan(modal.indexOf('id: "clients"'));
    expect(modal).toMatch(/BusinessProfileSection/);
    expect(modal).toMatch(/ClientsSection/);
    expect(modal).not.toMatch(/logo upload control/i);
  });

  it("extends IVA-78 inline create with address line 1 + city and keeps A/B/C", () => {
    const sheet = read("src/components/invoices/NewInvoiceSheet.tsx");
    const combobox = read("src/components/invoices/CustomerCombobox.tsx");
    expect(sheet).toMatch(/A · Drop/);
    expect(sheet).toMatch(/B · Quick create/);
    expect(sheet).toMatch(/INV_COPY\.fullLink/);
    expect(combobox).toMatch(/INV_COPY\.clientAddress1/);
    expect(combobox).toMatch(/INV_COPY\.clientCity/);
  });

  it("kills Plot 42 / support@ivanotechnologies fixtures on invoice preview", () => {
    const invoices = read("src/app/(dashboard)/invoices/page.tsx");
    const preview = read("src/components/invoices/InvoicePreview.tsx");
    expect(invoices).not.toMatch(/Plot 42/);
    expect(invoices).not.toMatch(/support@ivanotechnologies\.com/);
    expect(preview).not.toMatch(/Plot 42/);
    expect(preview).not.toMatch(/support@ivanotechnologies\.com/);
    expect(invoices).toMatch(/InvoicePreview/);
    expect(preview).toMatch(/INV_COPY\.fromFallback|BrandWordmark/);
  });

  it("maps drop filename to title only — never creates a client from the filename", () => {
    const invoices = read("src/app/(dashboard)/invoices/page.tsx");
    const sheet = read("src/components/invoices/NewInvoiceSheet.tsx");
    const actions = read("src/components/invoices/invoice-actions.ts");
    expect(invoices).toMatch(/titleFromFile\(file\.name\)/);
    expect(sheet).toMatch(/titleFromFile\(file\.name\)/);
    expect(invoices).not.toMatch(/ensureClientFromName/);
    expect(sheet).not.toMatch(/ensureClientFromName/);
    expect(invoices).not.toMatch(/clientNameFromFile/);
    expect(sheet).not.toMatch(/clientNameFromFile/);
    expect(actions).toMatch(/export async function createInvoiceDraft/);
    expect(actions).not.toMatch(/ensureClientFromName/);
  });

  it("keeps the status chip outside BILL TO", () => {
    const invoices = read("src/app/(dashboard)/invoices/page.tsx");
    expect(invoices).toMatch(/StatusBadge status=\{selectedInvoice\.status\}/);
    expect(invoices).toMatch(/InvoicePreview/);
    const billToBlock = invoices.slice(
      invoices.indexOf("<InvoicePreview"),
      invoices.indexOf("Line Items"),
    );
    expect(billToBlock).not.toMatch(/StatusBadge/);
  });

  it("ships locked comps under kompleet-design/iva-82-profiles/comps", () => {
    for (const file of [
      "kompleet-design/iva-82-profiles/comps/settings-business-profile.html",
      "kompleet-design/iva-82-profiles/comps/settings-business-profile.png",
      "kompleet-design/iva-82-profiles/comps/invoice-preview-personalised.html",
      "kompleet-design/iva-82-profiles/comps/invoice-preview-personalised.png",
      "kompleet-design/iva-82-profiles/comps/invoice-billto-empty.html",
      "kompleet-design/iva-82-profiles/comps/invoice-billto-empty.png",
      "kompleet-design/iva-82-profiles/BUSINESS-CLIENT-PROFILES.md",
    ]) {
      expect(existsSync(resolve(process.cwd(), file))).toBe(true);
    }
  });
});
