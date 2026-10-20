import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  generate1DayReminderEmail,
  generate3DayReminderEmail,
  generate7DayReminderEmail,
} from "@/lib/email-service";
import { generateCITFormHTML } from "@/lib/nrs-filing/form-generator";
import { renderInvoicePdf, type InvoicePdfInput } from "@/lib/invoices/invoice-pdf";

const EMOJI = /\p{Extended_Pictographic}/u;
const TAX_ACT = /Nigeria\s+Tax\s+Act|Tax\s+Act/i;
const FIRS = /\bFIRS\b/;
const GREEN = /#1a5f3a|#e8f5e9|#10b981|#0A6847/i;

const deadline = {
  formType: "PIT" as const,
  taxYear: 2026,
  deadlineDate: "2027-03-31",
  daysRemaining: 3,
  description: "Personal Income Tax",
};

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") && !name.endsWith(".test.tsx")) {
      acc.push(full);
    }
  }
  return acc;
}

const USER_FACING_ROOTS = [
  resolve("src/app"),
  resolve("src/components"),
  resolve("src/lib/email-service.ts"),
  resolve("src/lib/nrs-forms.ts"),
  resolve("src/lib/nrs-filing/form-generator.ts"),
  resolve("src/lib/financial-statements/tax-computation-html.ts"),
  resolve("src/lib/invoices/invoice-pdf.ts"),
];

const LEFT_ALONE = [
  "src/lib/tax/source-display-name.ts",
  "src/lib/tax/source-display-name.test.ts",
  "src/lib/services/tax-computation-service.ts",
  "src/lib/services/vat-service.ts",
  "src/lib/nrs-filing/deadline-manager.ts",
  "src/lib/env.ts",
  "src/lib/services/data-quality-service.ts",
  "src/lib/transaction-import/column-aliases.ts",
];

function userFacingFiles(): string[] {
  const files: string[] = [];
  for (const root of USER_FACING_ROOTS) {
    const info = statSync(root);
    if (info.isDirectory()) files.push(...walk(root));
    else files.push(root);
  }
  return files.filter((file) => !LEFT_ALONE.some((left) => file.endsWith(left)));
}

describe("IVA-208 leftovers", () => {
  it("invoice PDF footer is grey Powered by Kompleet with no green mark or green colour", () => {
    const input: InvoicePdfInput = {
      invoiceNumber: "INV-2026-0001",
      invoiceDate: "2026-10-17",
      dueDate: "2026-10-31",
      taxYear: 2026,
      customer: { name: "Bola Stores" },
      sender: { name: "Ada Foods Ltd" },
      lineItems: [{ description: "Catering", quantity: 1, unit_price: 1000, vat_rate: 0, amount: 1000 }],
      subtotal: 1000,
      vatAmount: 0,
      totalAmount: 1000,
    };
    const out = renderInvoicePdf(input).output();
    expect(out).toContain("Powered by Kompleet");
    expect(out).not.toMatch(/0\.039\d* 0\.408\d* 0\.278\d* rg/); // #0A6847
    expect(out).not.toMatch(/0\.063\d* 0\.725\d* 0\.506\d* rg/); // #10b981
    expect(out).not.toMatch(/0\.102\d* 0\.373\d* 0\.227\d* rg/); // #1a5f3a
    expect(out).toMatch(/\b0\. g\b/);
    expect(out).toMatch(/\b0\.33 g\b/);
  });

  it("CIT HTML uses dark ink, grey highlight rows, an en space subtitle, and no green", () => {
    const html = generateCITFormHTML({
      companyName: "Ada Foods Ltd",
      tin: "12345678-0001",
      taxYear: 2026,
      turnover: 10_000_000,
      accountingProfit: 4_500_000,
      taxAdjustments: 200_000,
      taxableIncome: 4_700_000,
      taxRate: 30,
      taxLiability: 1_410_000,
      taxPaid: 100_000,
      taxDue: 1_310_000,
    });
    const css = html.slice(0, html.indexOf("</style>"));
    expect(css).toMatch(/color:\s*#141413/);
    expect(css).toMatch(/background-color:\s*#F2F2F2/);
    expect(css).not.toMatch(GREEN);
    expect(html).toContain("Company income tax summary");
    expect(html).not.toMatch(/NIGERIA REVENUE SERVICE/);
    expect(html).not.toContain("CIT-001");
    expect(html).not.toMatch(/NRS\s-\sForm/);
    expect(html).toContain("Powered by Kompleet");
    expect(html).toContain("Prepared with Kompleet for your records.");
  });

  it("3-day and 1-day reminder subjects and bodies have no emoji", () => {
    const three = generate3DayReminderEmail("Ada Okonkwo", { ...deadline, daysRemaining: 3 });
    const one = generate1DayReminderEmail("Ada Okonkwo", {
      ...deadline,
      formType: "VAT_Q1",
      daysRemaining: 1,
    });
    for (const email of [three, one]) {
      expect(email.subject).not.toMatch(EMOJI);
      expect(email.html).not.toMatch(EMOJI);
      expect(email.text).not.toMatch(EMOJI);
    }
    expect(three.subject).toBe("Your PIT filing deadline is in 3 days");
    expect(one.subject).toBe("Your Q1 VAT return is due tomorrow");
  });

  it("user-facing UI, email templates and PDF generators have no FIRS or Tax Act copy", () => {
    const files = userFacingFiles();
    expect(files.length).toBeGreaterThan(10);
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (TAX_ACT.test(text) || FIRS.test(text)) {
        hits.push(relative(process.cwd(), file));
      }
    }
    expect(hits).toEqual([]);
  });

  it("7-day reminder also drops Tax Act wording and emoji", () => {
    const email = generate7DayReminderEmail("Ada Okonkwo", { ...deadline, daysRemaining: 7 });
    expect(email.subject + email.html + email.text).not.toMatch(EMOJI);
    expect(email.subject + email.html + email.text).not.toMatch(TAX_ACT);
  });
});
