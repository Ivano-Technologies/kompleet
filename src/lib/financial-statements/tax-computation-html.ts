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

export interface TaxComputationData {
  accountingProfit: number;
  taxAdjustments: {
    addBack: Record<string, number>;
    deductions: Record<string, number>;
  };
  taxableIncome: number;
  taxRate: number;
  taxLiability: number;
  legalReferences: Record<string, string>;
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

  const legalReferences: Record<string, string> =
    result.businessClassification === "Individual Taxpayer"
      ? {
          "Tax Rates":
            "Section 33 of Nigeria Tax Act 2025 - Personal Income Tax rates",
          "Non-deductible Expenses":
            "Section 45(2) of Nigeria Tax Act 2025 - Expenses not deductible for tax purposes",
        }
      : {
          "Tax Rates":
            "Section 40(1) of Nigeria Tax Act 2025 - Corporate Income Tax rates",
          "Capital Allowances":
            "Section 44 of Nigeria Tax Act 2025 - Capital allowances on qualifying expenditure",
          "Non-deductible Expenses":
            "Section 45(2) of Nigeria Tax Act 2025 - Expenses not deductible for tax purposes",
          "Small Company Relief":
            "Section 40(3) of Nigeria Tax Act 2025 - Small company tax relief",
        };

  return {
    accountingProfit: result.grossIncome - result.deductibleExpenses,
    taxAdjustments: { addBack, deductions },
    taxableIncome: result.taxableIncome,
    taxRate: incomeTaxBreakdownItem?.rate ?? 0,
    taxLiability: result.incomeTax,
    legalReferences,
  };
}

function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
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
    legalReferences,
  } = data;

  const totalAddBack = Object.values(taxAdjustments.addBack).reduce(
    (sum, val) => sum + val,
    0,
  );
  const totalDeductions = Object.values(taxAdjustments.deductions).reduce(
    (sum, val) => sum + val,
    0,
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tax Computation Schedule</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #1a5f3a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .amount {
      text-align: right;
    }
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .highlight-row {
      font-weight: bold;
      font-size: 1.1em;
      background-color: #e8f5e9;
    }
    .section-header {
      background-color: #1a5f3a;
      color: white;
      font-weight: bold;
    }
    .legal-ref {
      font-size: 0.85em;
      color: #666;
      font-style: italic;
      margin-top: 30px;
    }
  </style>
</head>
<body>
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
      <th class="amount">Amount (₦)</th>
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
      <th class="amount">Amount (₦)</th>
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
  </table>

  <div class="legal-ref">
    <h3>Legal References (Nigeria Tax Act 2025)</h3>
    ${Object.entries(legalReferences)
      .map(
        ([title, reference]) => `
      <p><strong>${title}:</strong> ${reference}</p>
    `,
      )
      .join("")}
  </div>

  <div style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
    <p>Generated by KOMPLEET Platform</p>
    <p>Kompleet records. Kompleet filings. Kompleet compliance.</p>
  </div>
</body>
</html>
  `;
}
