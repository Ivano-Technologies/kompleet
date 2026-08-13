/**
 * NRS Form Generator
 * Generates NRS-compliant tax forms (PIT, CIT, VAT)
 */

import { TaxComputationData } from "../financial-statements/tax-computation-html";
import { IncomeStatementData } from "../financial-statements/income-statement";

export interface PITFormData {
  taxpayerName: string;
  tin: string;
  taxYear: number;
  grossIncome: number;
  allowableDeductions: number;
  taxableIncome: number;
  taxLiability: number;
  taxPaid: number;
  taxDue: number;
}

export interface CITFormData {
  companyName: string;
  tin: string;
  taxYear: number;
  turnover: number;
  accountingProfit: number;
  taxAdjustments: number;
  taxableIncome: number;
  taxRate: number;
  taxLiability: number;
  taxPaid: number;
  taxDue: number;
}

export interface VATFormData {
  businessName: string;
  tin: string;
  period: string;
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
}

/**
 * Generate PIT Form (Personal Income Tax)
 */
export function generatePITForm(
  taxpayerInfo: { name: string; tin: string },
  taxComputation: TaxComputationData,
  taxYear: number,
  taxPaid: number = 0,
): PITFormData {
  const allowableDeductions = Object.values(
    taxComputation.taxAdjustments.deductions,
  ).reduce((sum, val) => sum + val, 0);

  return {
    taxpayerName: taxpayerInfo.name,
    tin: taxpayerInfo.tin,
    taxYear,
    grossIncome: taxComputation.accountingProfit,
    allowableDeductions,
    taxableIncome: taxComputation.taxableIncome,
    taxLiability: taxComputation.taxLiability,
    taxPaid,
    taxDue: Math.max(0, taxComputation.taxLiability - taxPaid),
  };
}

/**
 * Generate CIT Form (Corporate Income Tax)
 */
export function generateCITForm(
  companyInfo: { name: string; tin: string },
  incomeStatement: IncomeStatementData,
  taxComputation: TaxComputationData,
  taxYear: number,
  taxPaid: number = 0,
): CITFormData {
  const taxAdjustments =
    Object.values(taxComputation.taxAdjustments.addBack).reduce(
      (sum, val) => sum + val,
      0,
    ) -
    Object.values(taxComputation.taxAdjustments.deductions).reduce(
      (sum, val) => sum + val,
      0,
    );

  return {
    companyName: companyInfo.name,
    tin: companyInfo.tin,
    taxYear,
    turnover: incomeStatement.revenue.total,
    accountingProfit: taxComputation.accountingProfit,
    taxAdjustments,
    taxableIncome: taxComputation.taxableIncome,
    taxRate: taxComputation.taxRate,
    taxLiability: taxComputation.taxLiability,
    taxPaid,
    taxDue: Math.max(0, taxComputation.taxLiability - taxPaid),
  };
}

/**
 * Generate VAT Form (Value Added Tax)
 */
export function generateVATForm(
  businessInfo: { name: string; tin: string },
  period: string,
  sales: number,
  purchases: number,
  vatRate: number = 7.5,
): VATFormData {
  const outputVAT = sales * (vatRate / 100);
  const inputVAT = purchases * (vatRate / 100);
  const netVAT = outputVAT - inputVAT;

  return {
    businessName: businessInfo.name,
    tin: businessInfo.tin,
    period,
    outputVAT,
    inputVAT,
    netVAT: Math.max(0, netVAT),
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
 * Generate PIT Form as HTML
 */
export function generatePITFormHTML(data: PITFormData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Personal Income Tax (PIT) Return</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #1a5f3a;
      margin-bottom: 10px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .form-section {
      margin-bottom: 30px;
    }
    .form-row {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .form-label {
      font-weight: bold;
    }
    .form-value {
      text-align: right;
    }
    .highlight {
      background-color: #e8f5e9;
      font-weight: bold;
      font-size: 1.1em;
    }
    .header-section {
      background-color: #f5f5f5;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <h1>PERSONAL INCOME TAX (PIT) RETURN</h1>
  <div class="subtitle">Nigeria Revenue Service (NRS) - Form PIT-001</div>

  <div class="header-section">
    <div class="form-row">
      <span class="form-label">Taxpayer Name:</span>
      <span class="form-value">${data.taxpayerName}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Tax Identification Number (TIN):</span>
      <span class="form-value">${data.tin}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Tax Year:</span>
      <span class="form-value">${data.taxYear}</span>
    </div>
  </div>

  <div class="form-section">
    <div class="form-row">
      <span class="form-label">1. Gross Income</span>
      <span class="form-value">${formatCurrency(data.grossIncome)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">2. Less: Allowable Deductions</span>
      <span class="form-value">${formatCurrency(data.allowableDeductions)}</span>
    </div>
    <div class="form-row highlight">
      <span class="form-label">3. Taxable Income (1 - 2)</span>
      <span class="form-value">${formatCurrency(data.taxableIncome)}</span>
    </div>
    <div class="form-row highlight">
      <span class="form-label">4. Tax Liability</span>
      <span class="form-value">${formatCurrency(data.taxLiability)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">5. Less: Tax Paid</span>
      <span class="form-value">${formatCurrency(data.taxPaid)}</span>
    </div>
    <div class="form-row highlight">
      <span class="form-label">6. Tax Due (4 - 5)</span>
      <span class="form-value">${formatCurrency(data.taxDue)}</span>
    </div>
  </div>

  <div style="margin-top: 60px;">
    <p>I declare that the information provided in this return is true and correct to the best of my knowledge.</p>
    <div style="margin-top: 40px;">
      <div style="display: inline-block; width: 45%;">
        <div style="border-top: 1px solid #333; padding-top: 5px;">Signature</div>
      </div>
      <div style="display: inline-block; width: 45%; float: right;">
        <div style="border-top: 1px solid #333; padding-top: 5px;">Date</div>
      </div>
    </div>
  </div>

  <div style="margin-top: 60px; text-align: center; color: #666; font-size: 0.9em;">
    <p>Generated by KOMPLEET Platform</p>
    <p>Kompleet records. Kompleet filings. Kompleet compliance.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate CIT Form as HTML
 */
export function generateCITFormHTML(data: CITFormData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Corporate Income Tax (CIT) Return</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #1a5f3a;
      margin-bottom: 10px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .form-section {
      margin-bottom: 30px;
    }
    .form-row {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .form-label {
      font-weight: bold;
    }
    .form-value {
      text-align: right;
    }
    .highlight {
      background-color: #e8f5e9;
      font-weight: bold;
      font-size: 1.1em;
    }
    .header-section {
      background-color: #f5f5f5;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <h1>CORPORATE INCOME TAX (CIT) RETURN</h1>
  <div class="subtitle">Nigeria Revenue Service (NRS) - Form CIT-001</div>

  <div class="header-section">
    <div class="form-row">
      <span class="form-label">Company Name:</span>
      <span class="form-value">${data.companyName}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Tax Identification Number (TIN):</span>
      <span class="form-value">${data.tin}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Tax Year:</span>
      <span class="form-value">${data.taxYear}</span>
    </div>
  </div>

  <div class="form-section">
    <div class="form-row">
      <span class="form-label">1. Annual Turnover</span>
      <span class="form-value">${formatCurrency(data.turnover)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">2. Accounting Profit</span>
      <span class="form-value">${formatCurrency(data.accountingProfit)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">3. Tax Adjustments (Add-backs less Deductions)</span>
      <span class="form-value">${formatCurrency(data.taxAdjustments)}</span>
    </div>
    <div class="form-row highlight">
      <span class="form-label">4. Taxable Income (2 + 3)</span>
      <span class="form-value">${formatCurrency(data.taxableIncome)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">5. Applicable Tax Rate</span>
      <span class="form-value">${data.taxRate}%</span>
    </div>
    <div class="form-row highlight">
      <span class="form-label">6. Tax Liability (4 × 5)</span>
      <span class="form-value">${formatCurrency(data.taxLiability)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">7. Less: Tax Paid</span>
      <span class="form-value">${formatCurrency(data.taxPaid)}</span>
    </div>
    <div class="form-row highlight">
      <span class="form-label">8. Tax Due (6 - 7)</span>
      <span class="form-value">${formatCurrency(data.taxDue)}</span>
    </div>
  </div>

  <div style="margin-top: 60px;">
    <p>I declare that the information provided in this return is true and correct to the best of my knowledge.</p>
    <div style="margin-top: 40px;">
      <div style="display: inline-block; width: 30%;">
        <div style="border-top: 1px solid #333; padding-top: 5px;">Authorized Signatory</div>
      </div>
      <div style="display: inline-block; width: 30%; margin-left: 5%;">
        <div style="border-top: 1px solid #333; padding-top: 5px;">Position</div>
      </div>
      <div style="display: inline-block; width: 30%; float: right;">
        <div style="border-top: 1px solid #333; padding-top: 5px;">Date</div>
      </div>
    </div>
  </div>

  <div style="margin-top: 60px; text-align: center; color: #666; font-size: 0.9em;">
    <p>Generated by KOMPLEET Platform</p>
    <p>Kompleet records. Kompleet filings. Kompleet compliance.</p>
  </div>
</body>
</html>
  `;
}
