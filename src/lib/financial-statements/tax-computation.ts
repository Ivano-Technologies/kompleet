/**
 * Tax Computation Schedule Generator
 * Generates tax computation with 2026 Tax Act references
 */

import { IncomeStatementData } from "./income-statement";

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
 * Generate Tax Computation Schedule
 */
export function generateTaxComputation(
  incomeStatement: IncomeStatementData,
  entityType: "individual" | "company",
  annualTurnover: number,
): TaxComputationData {
  const accountingProfit = incomeStatement.netProfit;

  // Tax adjustments (add-backs and deductions)
  const addBack: Record<string, number> = {};
  const deductions: Record<string, number> = {};

  // Example adjustments (simplified)
  // In production, these would be calculated from detailed expense analysis
  if (incomeStatement.expenses.breakdown["Entertainment"]) {
    addBack["Non-deductible Entertainment"] =
      incomeStatement.expenses.breakdown["Entertainment"] * 0.5;
  }

  if (incomeStatement.expenses.breakdown["Depreciation"]) {
    addBack["Accounting Depreciation"] =
      incomeStatement.expenses.breakdown["Depreciation"];
    deductions["Capital Allowances"] =
      incomeStatement.expenses.breakdown["Depreciation"] * 0.8;
  }

  // Calculate total adjustments
  const totalAddBack = Object.values(addBack).reduce(
    (sum, val) => sum + val,
    0,
  );
  const totalDeductions = Object.values(deductions).reduce(
    (sum, val) => sum + val,
    0,
  );

  // Calculate taxable income
  const taxableIncome = Math.max(
    0,
    accountingProfit + totalAddBack - totalDeductions,
  );

  // Determine tax rate based on entity type and 2026 Tax Act
  let taxRate = 0;
  let taxLiability = 0;

  if (entityType === "company") {
    // Corporate Income Tax (CIT) rates under 2026 Tax Act
    if (annualTurnover <= 25000000) {
      // Small companies: 0% (first ₦25M turnover)
      taxRate = 0;
      taxLiability = 0;
    } else if (annualTurnover <= 100000000) {
      // Medium companies: 20%
      taxRate = 20;
      taxLiability = taxableIncome * 0.2;
    } else {
      // Large companies: 25%
      taxRate = 25;
      taxLiability = taxableIncome * 0.25;
    }
  } else {
    // Personal Income Tax (PIT) progressive rates under 2026 Tax Act
    if (taxableIncome <= 300000) {
      taxRate = 7;
      taxLiability = taxableIncome * 0.07;
    } else if (taxableIncome <= 600000) {
      taxRate = 11;
      taxLiability = 300000 * 0.07 + (taxableIncome - 300000) * 0.11;
    } else if (taxableIncome <= 1100000) {
      taxRate = 15;
      taxLiability =
        300000 * 0.07 + 300000 * 0.11 + (taxableIncome - 600000) * 0.15;
    } else if (taxableIncome <= 1600000) {
      taxRate = 19;
      taxLiability =
        300000 * 0.07 +
        300000 * 0.11 +
        500000 * 0.15 +
        (taxableIncome - 1100000) * 0.19;
    } else if (taxableIncome <= 3200000) {
      taxRate = 21;
      taxLiability =
        300000 * 0.07 +
        300000 * 0.11 +
        500000 * 0.15 +
        500000 * 0.19 +
        (taxableIncome - 1600000) * 0.21;
    } else {
      taxRate = 24;
      taxLiability =
        300000 * 0.07 +
        300000 * 0.11 +
        500000 * 0.15 +
        500000 * 0.19 +
        1600000 * 0.21 +
        (taxableIncome - 3200000) * 0.24;
    }
  }

  // Legal references from 2026 Tax Act
  const legalReferences: Record<string, string> = {
    "Tax Rates":
      entityType === "company"
        ? "Section 40(1) of Nigeria Tax Act 2025 - Corporate Income Tax rates"
        : "Section 33 of Nigeria Tax Act 2025 - Personal Income Tax rates",
    "Capital Allowances":
      "Section 44 of Nigeria Tax Act 2025 - Capital allowances on qualifying expenditure",
    "Non-deductible Expenses":
      "Section 45(2) of Nigeria Tax Act 2025 - Expenses not deductible for tax purposes",
    "Small Company Relief":
      "Section 40(3) of Nigeria Tax Act 2025 - Small company tax relief",
  };

  return {
    accountingProfit,
    taxAdjustments: {
      addBack,
      deductions,
    },
    taxableIncome,
    taxRate,
    taxLiability,
    legalReferences,
  };
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generate Tax Computation as HTML
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
