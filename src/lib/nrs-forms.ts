/**
 * NRS Form Generation Service
 * Sprint 7: Phase 2 Enhancement
 * Generates NRS-compliant PDF forms for PIT, CIT, and VAT
 */

import jsPDF from "jspdf";
import "jspdf-autotable";

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

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NIGERIAN REVENUE SERVICE", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(14);
  doc.text("PERSONAL INCOME TAX RETURN", pageWidth / 2, 28, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tax Year: ${data.taxYear}`, pageWidth / 2, 35, { align: "center" });

  // Form number and date
  doc.setFontSize(9);
  doc.text("Form: PIT-01", 14, 45);
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-NG")}`,
    pageWidth - 50,
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
    head: [["Description", "Amount (₦)"]],
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
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: "right" },
    },
  });

  // Section C: Tax Computation
  const taxStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION C: TAX COMPUTATION", 14, taxStartY);

  doc.autoTable({
    startY: taxStartY + 5,
    head: [["Description", "Amount (₦)"]],
    body: [
      ["Tax Payable (Based on Tax Table)", formatCurrency(data.taxPayable)],
      [
        "Less: Withholding Tax Credits",
        `(${formatCurrency(data.withholdingTax)})`,
      ],
      ["Balance Due / (Refund)", formatCurrency(data.balanceDue)],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: "right", fontStyle: "bold" },
    },
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

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NIGERIAN REVENUE SERVICE", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(14);
  doc.text("COMPANY INCOME TAX RETURN", pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tax Year: ${data.taxYear}`, pageWidth / 2, 35, { align: "center" });

  // Form number and date
  doc.setFontSize(9);
  doc.text("Form: CIT-01", 14, 45);
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-NG")}`,
    pageWidth - 50,
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
    head: [["Description", "Amount (₦)"]],
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
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: "right" },
    },
  });

  // Section C: Tax Computation
  const taxStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION C: TAX COMPUTATION", 14, taxStartY);

  doc.autoTable({
    startY: taxStartY + 5,
    head: [["Description", "Amount (₦)"]],
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
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: "right", fontStyle: "bold" },
    },
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

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NIGERIAN REVENUE SERVICE", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(14);
  doc.text("VALUE ADDED TAX (VAT) RETURN", pageWidth / 2, 28, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Period: ${data.period} | Tax Year: ${data.taxYear}`,
    pageWidth / 2,
    35,
    { align: "center" },
  );

  // Form number and date
  doc.setFontSize(9);
  doc.text("Form: VAT-01", 14, 45);
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-NG")}`,
    pageWidth - 50,
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
    head: [["Description", "Amount (₦)"]],
    body: [
      ["Output VAT (VAT on Sales @ 7.5%)", formatCurrency(data.outputVAT)],
      [
        "Less: Input VAT (VAT on Purchases @ 7.5%)",
        `(${formatCurrency(data.inputVAT)})`,
      ],
      ["Net VAT Payable / (Refundable)", formatCurrency(data.netVAT)],
      ["Add: Penalty (if any)", formatCurrency(data.penaltyIfAny)],
      ["Total Amount Due", formatCurrency(data.totalDue)],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: "right", fontStyle: "bold" },
    },
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
  doc.text(
    "Late filing attracts penalties as prescribed by the Nigeria Tax Act 2025.",
    14,
    noteStartY + 11,
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);

  doc.text("Generated by KOMPLEET Platform", pageWidth / 2, pageHeight - 15, {
    align: "center",
  });
  doc.text(
    "For official use only. Submit to Nigerian Revenue Service.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  );
  doc.text(
    `Generated on: ${new Date().toLocaleString("en-NG")}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" },
  );
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
