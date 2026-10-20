/**
 * Tax Computation Report Helpers
 * ===============================
 * `TaxComputationData` (the legacy report/form shape) + HTML renderer,
 * consumed by src/lib/nrs-filing/form-generator.ts and the financial
 * statements HTML report.
 *
 * This module intentionally contains NO tax rates or thresholds of its
 * own — `toTaxComputationData` only reshapes an already-computed
 * `TaxComputationResult` (from the rule-driven
 * src/lib/services/tax-computation-service.ts) into the legacy field
 * names these renderers expect. See docs/TAX_RULE_PROVENANCE.md.
 */
import type { TaxComputationResult } from "@/lib/services/tax-computation-service";
import {
  AMOUNT_NGN_HEADER,
  exportHtmlChrome,
} from "@/lib/export-chrome";

export interface TaxComputationData {
  accountingProfit: number;
  taxAdjustments: {
    addBack: Record<string, number>;
    deductions: Record<string, number>;
  };
  taxableIncome: number;
  taxRate: number;
  taxLiability: number;
}

/**
 * Adapt a `TaxComputationService.computeTax()` result into the legacy
 * `TaxComputationData` shape. `addBack`/`deductions` are derived from the
 * result's own labeled tax breakdown lines ("Add: ...", "Less: ...")
 * rather than re-deriving them from raw income-statement categories.
 */
export function toTaxComputationData(
  result: TaxComputationResult,
): TaxComputationData {
  const addBack: Record<string, number> = {};
  const deductions: Record<string, number> = {};

  for (const item of result.taxBreakdown) {
    if (item.description.startsWith("Add: ")) {
      addBack[item.description.replace(/^Add: /, "")] = item.amount;
    } else if (item.description.startsWith("Less: ")) {
      deductions[item.description.replace(/^Less: /, "")] = Math.abs(
        item.amount,
      );
    }
  }

  const incomeTaxBreakdownItem = result.taxBreakdown.find(
    (item) => item.description === "Income Tax",
  );

  return {
    accountingProfit: result.grossIncome - result.deductibleExpenses,
    taxAdjustments: { addBack, deductions },
    taxableIncome: result.taxableIncome,
    taxRate: incomeTaxBreakdownItem?.rate ?? 0,
    taxLiability: result.incomeTax,
  };
}

function formatCurrency(amount: number): string {
  return `NGN ${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generate Tax Computation Schedule as HTML.
 */
export function generateTaxComputationHTML(data: TaxComputationData): string {
  const {
    accountingProfit,
    taxAdjustments,
    taxableIncome,
    taxRate,
    taxLiability,
  } = data;

  const totalAddBack = Object.values(taxAdjustments.addBack).reduce(
    (sum, val) => sum + val,
    0,
  );
  const totalDeductions = Object.values(taxAdjustments.deductions).reduce(
    (sum, val) => sum + val,
    0,
  );

  return exportHtmlChrome({
    title: "Tax Computation Schedule",
    body: `
  <style>
    .total-row { font-weight: bold; background-color: #f9f9f9; }
    .highlight-row {
      font-weight: bold;
      font-size: 1.1em;
      background-color: #F2F2F2;
      color: #141413;
    }
    .section-header { background-color: #F2F2F2; color: #333; font-weight: bold; }
    .section-header th { background-color: #F2F2F2; color: #333; }
  </style>
  <h1>Tax Computation Schedule</h1>
  <table>
    <tr>
      <td>Accounting Profit (from Income Statement)</td>
      <td class="amount">${formatCurrency(accountingProfit)}</td>
    </tr>
  </table>
  <table>
    <tr class="section-header">
      <th>ADD BACK: Non-Deductible Expenses</th>
      <th class="amount">${AMOUNT_NGN_HEADER}</th>
    </tr>
    ${Object.entries(taxAdjustments.addBack)
      .map(
        ([item, amount]) => `
      <tr>
        <td>${item}</td>
        <td class="amount">${formatCurrency(amount)}</td>
      </tr>
    `,
      )
      .join("")}
    <tr class="total-row">
      <td>Total Add-Backs</td>
      <td class="amount">${formatCurrency(totalAddBack)}</td>
    </tr>
  </table>
  <table>
    <tr class="section-header">
      <th>LESS: Allowable Deductions</th>
      <th class="amount">${AMOUNT_NGN_HEADER}</th>
    </tr>
    ${Object.entries(taxAdjustments.deductions)
      .map(
        ([item, amount]) => `
      <tr>
        <td>${item}</td>
        <td class="amount">${formatCurrency(amount)}</td>
      </tr>
    `,
      )
      .join("")}
    <tr class="total-row">
      <td>Total Deductions</td>
      <td class="amount">${formatCurrency(totalDeductions)}</td>
    </tr>
  </table>
  <table>
    <tr class="highlight-row">
      <td>Taxable Income</td>
      <td class="amount">${formatCurrency(taxableIncome)}</td>
    </tr>
    <tr>
      <td>Tax Rate</td>
      <td class="amount">${taxRate}%</td>
    </tr>
    <tr class="highlight-row">
      <td>Tax Liability</td>
      <td class="amount">${formatCurrency(taxLiability)}</td>
    </tr>
  </table>`,
  });
}
