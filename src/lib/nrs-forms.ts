/**
 * Tax form PDF summaries (PIT, CIT, VAT)
 */

import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  AMOUNT_NGN_HEADER,
  PREPARED_FOR_RECORDS,
  addPoweredByFooter,
  amountHeaderStyles,
  drawExportMark,
} from "@/lib/export-chrome";

// Extend jsPDF type for autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface PITFormData {
  taxpayerName: string;
  tin: string;
  address: string;
  phone: string;
  email: string;
  taxYear: number;
  grossIncome: number;
  consolidatedRelief: number;
  otherReliefs: number;
  taxableIncome: number;
  taxPayable: number;
  withholdingTax: number;
  balanceDue: number;
}

export interface CITFormData {
  companyName: string;
  rcNumber: string;
  tin: string;
  address: string;
  phone: string;
  email: string;
  taxYear: number;
  turnover: number;
  costOfSales: number;
  grossProfit: number;
  operatingExpenses: number;
  profitBeforeTax: number;
  capitalAllowances: number;
  taxableProfit: number;
  taxRate: number;
  taxPayable: number;
  advancePayments: number;
  balanceDue: number;
}

export interface VATFormData {
  businessName: string;
  tin: string;
  address: string;
  phone: string;
  email: string;
  period: string;
  taxYear: number;
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
  penaltyIfAny: number;
  totalDue: number;
}

/**
 * Generate Personal Income Tax (PIT) Form
 */
export function generatePITForm(data: PITFormData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  drawExportMark(doc);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 19);
  doc.text("Personal income tax summary", pageWidth / 2, 24, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tax Year: ${data.taxYear}`, pageWidth / 2, 32, { align: "center" });

  doc.setFontSize(9);
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    14,
    45,
  );

  // Section A: Taxpayer Information
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION A: TAXPAYER INFORMATION", 14, 55);

  doc.autoTable({
    startY: 60,
    head: [],
    body: [
      ["Full Name:", data.taxpayerName],
      ["Tax Identification Number (TIN):", data.tin],
      ["Address:", data.address],
      ["Phone Number:", data.phone],
      ["Email Address:", data.email],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { cellWidth: 110 },
    },
  });

  // Section B: Income Computation
  const incomeStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION B: INCOME COMPUTATION", 14, incomeStartY);

  doc.autoTable({
    startY: incomeStartY + 5,
    head: [["Description", AMOUNT_NGN_HEADER]],
    body: [
      ["Gross Income", formatCurrency(data.grossIncome)],
      [
        "Less: Consolidated Relief Allowance",
        `(${formatCurrency(data.consolidatedRelief)})`,
      ],
      ["Less: Other Reliefs", `(${formatCurrency(data.otherReliefs)})`],
      ["Taxable Income", formatCurrency(data.taxableIncome)],
    ],
    theme: "striped",
    ...amountHeaderStyles(),
  });

  // Section C: Tax Computation
  const taxStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION C: TAX COMPUTATION", 14, taxStartY);

  doc.autoTable({
    startY: taxStartY + 5,
    head: [["Description", AMOUNT_NGN_HEADER]],
    body: [
      ["Tax Payable (Based on Tax Table)", formatCurrency(data.taxPayable)],
      [
        "Less: Withholding Tax Credits",
        `(${formatCurrency(data.withholdingTax)})`,
      ],
      ["Balance Due / (Refund)", formatCurrency(data.balanceDue)],
    ],
    theme: "striped",
    ...amountHeaderStyles(),
  });

  // Declaration
  const declStartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DECLARATION", 14, declStartY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const declaration =
    "I declare that the information provided in this return is true, correct, and complete to the best of my knowledge.";
  doc.text(declaration, 14, declStartY + 7, { maxWidth: pageWidth - 28 });

  // Signature line
  doc.line(14, declStartY + 25, 90, declStartY + 25);
  doc.text("Taxpayer Signature", 14, declStartY + 30);

  doc.line(110, declStartY + 25, 180, declStartY + 25);
  doc.text("Date", 110, declStartY + 30);

  // Footer
  addFooter(doc);

  return doc;
}

/**
 * Generate Company Income Tax (CIT) Form
 */
export function generateCITForm(data: CITFormData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  drawExportMark(doc);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 19);
  doc.text("Company income tax summary", pageWidth / 2, 24, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tax Year: ${data.taxYear}`, pageWidth / 2, 32, { align: "center" });

  doc.setFontSize(9);
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    14,
    45,
  );

  // Section A: Company Information
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION A: COMPANY INFORMATION", 14, 55);

  doc.autoTable({
    startY: 60,
    head: [],
    body: [
      ["Company Name:", data.companyName],
      ["RC Number:", data.rcNumber],
      ["Tax Identification Number (TIN):", data.tin],
      ["Registered Address:", data.address],
      ["Phone Number:", data.phone],
      ["Email Address:", data.email],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { cellWidth: 110 },
    },
  });

  // Section B: Profit & Loss Statement
  const plStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION B: PROFIT & LOSS STATEMENT", 14, plStartY);

  doc.autoTable({
    startY: plStartY + 5,
    head: [["Description", AMOUNT_NGN_HEADER]],
    body: [
      ["Turnover / Revenue", formatCurrency(data.turnover)],
      ["Less: Cost of Sales", `(${formatCurrency(data.costOfSales)})`],
      ["Gross Profit", formatCurrency(data.grossProfit)],
      [
        "Less: Operating Expenses",
        `(${formatCurrency(data.operatingExpenses)})`,
      ],
      ["Profit Before Tax", formatCurrency(data.profitBeforeTax)],
    ],
    theme: "striped",
    ...amountHeaderStyles(),
  });

  // Section C: Tax Computation
  const taxStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION C: TAX COMPUTATION", 14, taxStartY);

  doc.autoTable({
    startY: taxStartY + 5,
    head: [["Description", AMOUNT_NGN_HEADER]],
    body: [
      ["Profit Before Tax", formatCurrency(data.profitBeforeTax)],
      [
        "Less: Capital Allowances",
        `(${formatCurrency(data.capitalAllowances)})`,
      ],
      ["Taxable Profit", formatCurrency(data.taxableProfit)],
      [`Tax @ ${data.taxRate}%`, formatCurrency(data.taxPayable)],
      ["Less: Advance Payments", `(${formatCurrency(data.advancePayments)})`],
      ["Balance Due / (Refund)", formatCurrency(data.balanceDue)],
    ],
    theme: "striped",
    ...amountHeaderStyles(),
  });

  // Declaration
  const declStartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DECLARATION", 14, declStartY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const declaration =
    "I declare that this return has been examined by me and to the best of my knowledge and belief is correct and complete.";
  doc.text(declaration, 14, declStartY + 7, { maxWidth: pageWidth - 28 });

  // Signature lines
  doc.line(14, declStartY + 25, 90, declStartY + 25);
  doc.text("Director/Authorized Signatory", 14, declStartY + 30);

  doc.line(110, declStartY + 25, 180, declStartY + 25);
  doc.text("Date", 110, declStartY + 30);

  // Footer
  addFooter(doc);

  return doc;
}

/**
 * Generate VAT Return Form
 */
export function generateVATForm(data: VATFormData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  drawExportMark(doc);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 19);
  doc.text("VAT return summary", pageWidth / 2, 24, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Period: ${data.period} | Tax Year: ${data.taxYear}`,
    pageWidth / 2,
    32,
    { align: "center" },
  );

  doc.setFontSize(9);
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    14,
    45,
  );

  // Section A: Business Information
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION A: BUSINESS INFORMATION", 14, 55);

  doc.autoTable({
    startY: 60,
    head: [],
    body: [
      ["Business Name:", data.businessName],
      ["Tax Identification Number (TIN):", data.tin],
      ["Business Address:", data.address],
      ["Phone Number:", data.phone],
      ["Email Address:", data.email],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { cellWidth: 110 },
    },
  });

  // Section B: VAT Computation
  const vatStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION B: VAT COMPUTATION", 14, vatStartY);

  doc.autoTable({
    startY: vatStartY + 5,
    head: [["Description", AMOUNT_NGN_HEADER]],
    body: [
      ["Output VAT (VAT on Sales)", formatCurrency(data.outputVAT)],
      [
        "Less: Input VAT (VAT on Purchases)",
        `(${formatCurrency(data.inputVAT)})`,
      ],
      ["Net VAT Payable / (Refundable)", formatCurrency(data.netVAT)],
      ["Add: Penalty (if any)", formatCurrency(data.penaltyIfAny)],
      ["Total Amount Due", formatCurrency(data.totalDue)],
    ],
    theme: "striped",
    ...amountHeaderStyles(),
  });

  // Important Note
  const noteStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("IMPORTANT NOTE:", 14, noteStartY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "VAT returns must be filed within 21 days after the end of the relevant month/quarter.",
    14,
    noteStartY + 6,
  );

  // Declaration
  const declStartY = noteStartY + 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DECLARATION", 14, declStartY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const declaration =
    "I declare that the particulars given in this return are true and correct.";
  doc.text(declaration, 14, declStartY + 7);

  // Signature lines
  doc.line(14, declStartY + 20, 90, declStartY + 20);
  doc.text("Authorized Signatory", 14, declStartY + 25);

  doc.line(110, declStartY + 20, 180, declStartY + 20);
  doc.text("Date", 110, declStartY + 25);

  // Footer
  addFooter(doc);

  return doc;
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF): void {
  addPoweredByFooter(doc, PREPARED_FOR_RECORDS);
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
