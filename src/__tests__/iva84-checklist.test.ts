import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("IVA-84 post-signup business checklist", () => {
  it("places a soft dashboard card above DropZone — not a hard modal gate", () => {
    const dashboard = read("src/app/(dashboard)/dashboard/DashboardClient.tsx");
    const card = read("src/components/dashboard/SetupChecklistCard.tsx");
    expect(dashboard).toMatch(/SetupChecklist/);
    expect(dashboard.indexOf("<SetupChecklist")).toBeLessThan(
      dashboard.indexOf('variant="hero"'),
    );
    expect(card).not.toMatch(/Dialog|modal gate/i);
    expect(card).toMatch(/SETUP_COPY\.ctaLater/);
    expect(card).toMatch(/SETUP_COPY\.ctaPrimary/);
  });

  it("has exactly four items and omits logo as a checklist row", () => {
    const card = read("src/components/dashboard/SetupChecklistCard.tsx");
    const copy = read("src/components/dashboard/setup-copy.ts");
    const logic = read("src/lib/invoices/setup-checklist.ts");
    expect(copy).toMatch(/itemLegalName: "Legal name"/);
    expect(copy).toMatch(/itemAddress: "Business address"/);
    expect(copy).toMatch(/itemContact: "Contact \(email or phone\)"/);
    expect(copy).toMatch(/itemTax: "Tax IDs \(TIN \/ VAT\)"/);
    expect(copy).toMatch(/logoDeferred: "Logo upload coming later"/);
    expect(logic).toMatch(/CHECKLIST_ITEM_COUNT = 4/);
    expect(logic).toMatch(/id: "legalName"/);
    expect(logic).toMatch(/id: "address"/);
    expect(logic).toMatch(/id: "contact"/);
    expect(logic).toMatch(/id: "tax"/);
    expect(card).not.toMatch(/itemLogo|Logo upload<\/);
    expect(logic).not.toMatch(/id: "logo"/);
  });

  it("opens SettingsModal Business tab via the IVA-82 query, with no duplicate form", () => {
    const checklist = read("src/components/dashboard/SetupChecklist.tsx");
    const card = read("src/components/dashboard/SetupChecklistCard.tsx");
    expect(checklist).toMatch(/\/dashboard\?settings=business/);
    expect(checklist).not.toMatch(/<form/);
    expect(card).not.toMatch(/<form|<input/);
  });

  it("does not weaken IVA-82 Issue/Send legalName gates", () => {
    const invoices = read("src/app/(dashboard)/invoices/page.tsx");
    const issue = read("src/app/api/invoices/[id]/issue/route.ts");
    expect(invoices).toMatch(/hasLegalName\(profile/);
    expect(invoices).toMatch(/BIZ_COPY\.blockLegalName/);
    expect(issue).toMatch(/Add your business name in Settings before issuing/);
  });

  it("never seeds Plot 42 / support@ivanotechnologies fixtures", () => {
    const checklist = read("src/components/dashboard/SetupChecklist.tsx");
    const logic = read("src/lib/invoices/setup-checklist.ts");
    expect(checklist).not.toMatch(/Plot 42/);
    expect(checklist).not.toMatch(/support@ivanotechnologies\.com/);
    expect(logic).not.toMatch(/Plot 42/);
    expect(logic).not.toMatch(/support@ivanotechnologies\.com/);
  });

  it("ships locked comps under kompleet-design/iva-84-checklist/comps", () => {
    for (const file of [
      "kompleet-design/iva-84-checklist/POST-SIGNUP-CHECKLIST.md",
      "kompleet-design/iva-84-checklist/shipping-handoff-iva84.txt",
      "kompleet-design/iva-84-checklist/comps/checklist-card.html",
      "kompleet-design/iva-84-checklist/comps/checklist-complete.html",
    ]) {
      expect(existsSync(resolve(process.cwd(), file))).toBe(true);
    }
  });
});
