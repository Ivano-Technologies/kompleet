import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  generate1DayReminderEmail,
  generate3DayReminderEmail,
} from "@/lib/email-service";
import { AMOUNT_NGN_HEADER, INVOICE_FOOTER_TEXT, PREPARED_FOR_RECORDS } from "@/lib/export-chrome";
import { generateVATForm, generateCITForm, generatePITForm } from "@/lib/nrs-forms";
import { generateCITFormHTML, generatePITFormHTML, generateVATFormHTML } from "@/lib/nrs-filing/form-generator";
import { generateProfessionalTaxReport } from "@/lib/services/tax-report-template";
import { generateCalculationPDF } from "@/lib/pdf-generator";
import { generateTaxComputationHTML } from "@/lib/financial-statements/tax-computation-html";
import { generateIncomeStatementHTML } from "@/lib/financial-statements/income-statement";
import {
  generateBalanceSheetHTML,
  generateProfitLossHTML,
} from "@/lib/financial-statements/statement-html";

const jsPdfApi = jsPDF as unknown as {
  API: { autoTable?: (options: unknown) => jsPDF };
};
if (!jsPdfApi.API.autoTable) {
  jsPdfApi.API.autoTable = function (this: jsPDF, options: unknown) {
    autoTable(this, options as Parameters<typeof autoTable>[1]);
    return this;
  };
}

const TAX_ACT = /Tax\s+Act/i;
const NIGERIA_TAX_ACT = /Nigeria\s+Tax\s+Act/i;
const COMPLIANT = /\bcompliant\b/i;
const BANNED_REMINDER = /Urgent|Final notice|Last Day to File|TOMORROW!|24 HOURS|File now\. Do not delay|standing by|call our hotline|FINAL automated/i;

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(full);
  }
  return acc;
}

describe("IVA-211 copy: no Tax Act or compliant claims", () => {
  it("fails if Tax Act or compliant appears in src/ copy outside tests", () => {
    const files = walk(resolve("src")).filter(
      (file) =>
        !file.endsWith(".test.ts") &&
        !file.endsWith(".test.tsx") &&
        !file.endsWith("source-display-name.ts"),
    );
    expect(files.length).toBeGreaterThan(20);
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (TAX_ACT.test(text) || NIGERIA_TAX_ACT.test(text) || COMPLIANT.test(text)) {
        hits.push(relative(process.cwd(), file));
      }
    }
    expect(hits).toEqual([]);
    const propertyTax = files.find((file) =>
      file.replace(/\\/g, "/").endsWith("calculators/property-tax/page.tsx"),
    );
    expect(propertyTax).toBeDefined();
    expect(readFileSync(propertyTax!, "utf8")).not.toMatch(TAX_ACT);
    expect(readFileSync(propertyTax!, "utf8")).not.toMatch(NIGERIA_TAX_ACT);
  });

  it("treats a line-broken Tax Act subtitle as a hit", () => {
    const split = "under Nigeria Tax\n            Act 2025";
    expect(TAX_ACT.test(split)).toBe(true);
    expect(NIGERIA_TAX_ACT.test(split)).toBe(true);
  });

  it("fails if Tax Act or compliant appears in export output", () => {
    const vat = generateVATForm({
      businessName: "Ada Foods Ltd",
      tin: "12345678-0001",
      address: "14 Marina Road, Lagos",
      phone: "+234 801 234 5678",
      email: "ada@adafoods.ng",
      period: "October 2026",
      taxYear: 2026,
      outputVAT: 75_000,
      inputVAT: 15_000,
      netVAT: 60_000,
      penaltyIfAny: 0,
      totalDue: 60_000,
    }).output();
    const pitHtml = generatePITFormHTML({
      taxpayerName: "Ada Okonkwo",
      tin: "12345678-0001",
      taxYear: 2026,
      grossIncome: 4_500_000,
      allowableDeductions: 500_000,
      taxableIncome: 4_000_000,
      taxLiability: 412_500,
      taxPaid: 50_000,
      taxDue: 362_500,
    });
    const calc = generateCalculationPDF(
      {
        calculatorType: "VAT Calculator",
        date: "20 Oct 2026",
        inputs: { amount: 100000 },
        results: { vat_amount: 7500 },
      },
      { download: false },
    ).output();
    const report = generateProfessionalTaxReport({
      reportType: "PIT",
      taxpayerName: "Ada Okonkwo",
      tin: "12345678-0001",
      taxYear: 2026,
      generatedDate: new Date("2026-10-20"),
      sections: [{ title: "SUMMARY", rows: [{ label: "Tax", value: 1000 }] }],
    }).output();
    for (const out of [vat, pitHtml, calc, report]) {
      expect(out).not.toMatch(TAX_ACT);
      expect(out).not.toMatch(COMPLIANT);
    }
  });
});

describe("IVA-213 reminder emails", () => {
  it("uses the calm 3-day and 1-day subjects and body", () => {
    const three = generate3DayReminderEmail("Ada Okonkwo", {
      formType: "PIT",
      taxYear: 2026,
      deadlineDate: "2027-03-31",
      daysRemaining: 3,
      description: "PIT",
    });
    const one = generate1DayReminderEmail("Ada Okonkwo", {
      formType: "VAT_Q1",
      taxYear: 2026,
      deadlineDate: "2026-04-21",
      daysRemaining: 1,
      description: "VAT Q1",
    });
    expect(three.subject).toBe("Your PIT filing deadline is in 3 days");
    expect(one.subject).toBe("Your Q1 VAT return is due tomorrow");
    expect(three.html).toContain("Due in 3 days");
    expect(one.html).toContain("Due tomorrow");
    expect(three.html).toContain("Hi Ada,");
    expect(three.html).toContain(
      "Your personal income tax for 2026 is due on 31 Mar 2027.",
    );
    expect(three.html).not.toMatch(/personal income tax for personal/i);
    expect(one.html).toContain(
      "Your VAT return for Q1 2026 is due on 21 Apr 2026.",
    );
    expect(one.html).not.toContain("Q1 VAT return for Q1");
    expect(one.html).toContain(">VAT return<");
    expect(three.html).toContain("31 Mar 2027");
    expect(three.html).toContain("Open Kompleet");
    expect(three.html).toContain("You're getting this because reminders are on in Kompleet. Change them in Settings.");
    expect(three.html).toContain("#141413");
    expect(three.html).not.toMatch(/linear-gradient/);
    expect(three.html).not.toMatch(/box-shadow/);
    expect(three.html).not.toMatch(/Days remaining/i);
    for (const email of [three, one]) {
      expect(email.subject + email.html + email.text).not.toMatch(BANNED_REMINDER);
      expect(email.subject).not.toMatch(/!/);
      expect(email.text).not.toMatch(/!/);
    }
  });
});

describe("IVA-213 export house style", () => {
  it("uses Amount (NGN), Powered by Kompleet, and summary titles on forms", () => {
    const vat = generateVATForm({
      businessName: "Ada Foods Ltd",
      tin: "12345678-0001",
      address: "14 Marina Road, Lagos",
      phone: "+234 801 234 5678",
      email: "ada@adafoods.ng",
      period: "October 2026",
      taxYear: 2026,
      outputVAT: 75_000,
      inputVAT: 15_000,
      netVAT: 60_000,
      penaltyIfAny: 0,
      totalDue: 60_000,
    });
    const vatText = vat.output().replace(/\\([()])/g, "$1");
    expect(vatText).toContain("VAT return summary");
    expect(vatText).toContain(AMOUNT_NGN_HEADER);
    expect(vatText).toContain(INVOICE_FOOTER_TEXT);
    expect(vatText).toContain(PREPARED_FOR_RECORDS);
    expect(vatText).not.toContain("NIGERIA REVENUE SERVICE");
    expect(vatText).not.toContain("VAT-01");
    expect(vatText).not.toContain("official use");
    expect(vatText).not.toContain("₦");
    expect(vatText).not.toContain("¦");

    const cit = generateCITForm({
      companyName: "Ada Foods Ltd",
      rcNumber: "RC123",
      tin: "12345678-0001",
      address: "14 Marina",
      phone: "+234 801 234 5678",
      email: "ada@adafoods.ng",
      taxYear: 2026,
      turnover: 10_000_000,
      costOfSales: 4_000_000,
      grossProfit: 6_000_000,
      operatingExpenses: 1_500_000,
      profitBeforeTax: 4_500_000,
      capitalAllowances: 200_000,
      taxableProfit: 4_300_000,
      taxRate: 30,
      taxPayable: 1_290_000,
      advancePayments: 100_000,
      balanceDue: 1_190_000,
    }).output().replace(/\\([()])/g, "$1");
    expect(cit).toContain("Company income tax summary");
    expect(cit).not.toContain("CIT-01");

    const pit = generatePITForm({
      taxpayerName: "Ada Okonkwo",
      tin: "12345678-0001",
      address: "14 Marina",
      phone: "+234 801 234 5678",
      email: "ada@adafoods.ng",
      taxYear: 2026,
      grossIncome: 4_500_000,
      consolidatedRelief: 200_000,
      otherReliefs: 50_000,
      taxableIncome: 4_250_000,
      taxPayable: 400_000,
      withholdingTax: 20_000,
      balanceDue: 380_000,
    }).output().replace(/\\([()])/g, "$1");
    expect(pit).toContain("Personal income tax summary");
    expect(pit).not.toContain("PIT-01");

    const vatHtml = generateVATFormHTML({
      businessName: "Ada Foods Ltd",
      tin: "12345678-0001",
      period: "Q1 2026",
      outputVAT: 75_000,
      inputVAT: 15_000,
      netVAT: 60_000,
    });
    expect(vatHtml).toContain("VAT return summary");
    expect(vatHtml).toContain(AMOUNT_NGN_HEADER);
    expect(vatHtml).toContain('class="amount"');
    expect(vatHtml).toContain(PREPARED_FOR_RECORDS);

    const pitHtml = generatePITFormHTML({
      taxpayerName: "Ada Okonkwo",
      tin: "12345678-0001",
      taxYear: 2026,
      grossIncome: 4_500_000,
      allowableDeductions: 500_000,
      taxableIncome: 4_000_000,
      taxLiability: 412_500,
      taxPaid: 50_000,
      taxDue: 362_500,
    });
    expect(pitHtml).toContain("Personal income tax summary");
    expect(pitHtml).toContain(AMOUNT_NGN_HEADER);

    const citHtml = generateCITFormHTML({
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
    expect(citHtml).toContain("Company income tax summary");
    expect(citHtml).toContain(AMOUNT_NGN_HEADER);

    const pnl = generateProfitLossHTML({
      period: { start: "2026-01-01", end: "2026-03-31" },
      revenue: { items: [{ category: "Sales", amount: 100000 }], total: 100000 },
      expenses: { items: [{ category: "Rent", amount: 20000 }], total: 20000 },
      netIncome: 80000,
      taxableIncome: 80000,
    });
    expect(pnl).toContain(AMOUNT_NGN_HEADER);
    expect(pnl).toContain(INVOICE_FOOTER_TEXT);
    expect(pnl).toContain("th class=\"amount\"");

    const bs = generateBalanceSheetHTML({
      period: { asOf: "2026-03-31" },
      assets: {
        current: { items: [{ category: "Cash", amount: 50000 }], total: 50000 },
        nonCurrent: { items: [], total: 0 },
        total: 50000,
      },
      liabilities: {
        current: { items: [], total: 0 },
        nonCurrent: { items: [], total: 0 },
      },
      equity: { items: [{ category: "Capital", amount: 50000 }], total: 50000 },
      totalLiabilitiesAndEquity: 50000,
    });
    expect(bs).toContain(AMOUNT_NGN_HEADER);
    expect(bs).toContain(INVOICE_FOOTER_TEXT);

    const income = generateIncomeStatementHTML({
      period: { startDate: "2026-01-01", endDate: "2026-03-31" },
      revenue: { total: 100000, breakdown: { Sales: 100000 } },
      expenses: { total: 20000, breakdown: { Rent: 20000 } },
      grossProfit: 80000,
      netProfit: 80000,
      profitMargin: 80,
    });
    expect(income).toContain(AMOUNT_NGN_HEADER);

    const calc = generateCalculationPDF(
      {
        calculatorType: "VAT Calculator",
        date: "20 Oct 2026",
        inputs: { amount: 100000 },
        results: { vat_amount: 7500 },
      },
      { download: false },
    )
      .output()
      .replace(/\\([()])/g, "$1");
    expect(calc).toContain("VAT amount");
    expect(calc).not.toContain("Vat Amount");

    const pitReport = generateProfessionalTaxReport({
      reportType: "PIT",
      taxpayerName: "Ada Okonkwo",
      tin: "12345678-0001",
      taxYear: 2026,
      generatedDate: new Date("2026-10-20"),
      sections: [{ title: "SUMMARY", rows: [{ label: "Tax", value: 412500 }] }],
    })
      .output()
      .replace(/\\([()])/g, "$1");
    expect(pitReport).toContain(AMOUNT_NGN_HEADER);
    expect(pitReport).toContain("412,500.00");
    expect(pitReport).not.toMatch(/NGN 412/);

    const taxHtml = generateTaxComputationHTML({
      accountingProfit: 4_500_000,
      taxAdjustments: { addBack: { "Disallowed expenses": 120_000 }, deductions: {} },
      taxableIncome: 4_620_000,
      taxRate: 30,
      taxLiability: 1_386_000,
    });
    expect(taxHtml).toContain(AMOUNT_NGN_HEADER);
    expect(taxHtml).toContain("text-align: right");
  });

  it("Excel and Word source use Amount (NGN), not the naira glyph", () => {
    const text = readFileSync(resolve("src/lib/export-service.ts"), "utf8");
    expect(text).toContain('Amount (NGN)');
    expect(text).not.toContain("Amount (₦)");
  });
});

describe("IVA-213 admin team at 390", () => {
  it("stacks the title block and uses cards under 640px", () => {
    const text = readFileSync(resolve("src/app/admin/team/page.tsx"), "utf8");
    expect(text).toContain("Team management");
    expect(text).toContain("Role permissions");
    expect(text).not.toContain("Team Management");
    expect(text).not.toContain("Role Permissions");
    expect(text).toContain("flex flex-col gap-1");
    expect(text).toContain("sm:hidden");
    expect(text).toContain("hidden sm:block");
  });
});

describe("IVA-211 tax report print tagline", () => {
  it("uses Prepared with Kompleet instead of a Tax Platform claim", () => {
    const text = readFileSync(
      resolve("src/app/(dashboard)/tax-reports/[id]/page.tsx"),
      "utf8",
    );
    expect(text).toContain("Prepared with Kompleet");
    expect(text).not.toMatch(/Nigerian Tax Platform/i);
    expect(text).not.toMatch(/Tax Act/i);
  });
});
