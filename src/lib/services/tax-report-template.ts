/**
 * Professional Tax Report Template Service
 * Generates KOMPLEET-branded tax reports with navy blue and jade green styling
 * Optimized for both color and black & white printing
 *
 * Color Scheme:
 * - Background: White (#FFFFFF)
 * - Primary Accent: Jade Green (#2D8659)
 * - Secondary Accent: Navy Blue (#001F3F)
 * - Text: Charcoal (#2C3E50)
 */

import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type for autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Color constants
const COLORS = {
  white: "#FFFFFF",
  jadeGreen: "#2D8659",
  navyBlue: "#001F3F",
  charcoal: "#2C3E50",
  lightGray: "#F8F9FA",
  borderGray: "#E9ECEF",
};

export interface TaxReportData {
  reportType: "PIT" | "CIT" | "VAT";
  taxpayerName: string;
  tin: string;
  taxYear: number;
  generatedDate: Date;
  sections: ReportSection[];
  disclaimer?: string;
}

export interface ReportSection {
  title: string;
  rows: Array<{
    label: string;
    value: string | number;
    isBold?: boolean;
    isTotal?: boolean;
  }>;
}

/**
 * Create professional tax report header with inverted logo
 */
function addReportHeader(
  doc: jsPDF,
  reportType: string,
  taxpayerName: string,
  taxYear: number,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 10;

  // White background (default)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 35, "F");

  // Logo placeholder (navy blue text on white)
  doc.setTextColor(0, 31, 63); // Navy blue
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("KOMPLEET", 15, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Nigerian Tax Platform", 15, 25);

  // Report title (right side)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`${reportType} Report`, pageWidth - 15, 18, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Tax Year: ${taxYear}`, pageWidth - 15, 25, { align: "right" });

  // Subtle jade green line under header
  doc.setDrawColor(45, 134, 89); // Jade green
  doc.setLineWidth(0.5);
  doc.line(0, 35, pageWidth, 35);

  // Reset text color to charcoal
  doc.setTextColor(44, 62, 80);

  return yPosition + 40;
}

/**
 * Add taxpayer information section
 */
function addTaxpayerInfo(
  doc: jsPDF,
  yPosition: number,
  taxpayerName: string,
  tin: string,
  generatedDate: Date,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title with subtle navy blue underline
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 31, 63); // Navy blue
  doc.text("TAXPAYER INFORMATION", 15, yPosition);

  // Subtle navy blue line under title
  doc.setDrawColor(0, 31, 63);
  doc.setLineWidth(0.3);
  doc.line(15, yPosition + 2, pageWidth - 15, yPosition + 2);

  yPosition += 10;

  // Info table
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(44, 62, 80); // Charcoal

  const infoData = [
    ["Taxpayer Name:", taxpayerName],
    ["TIN:", tin],
    [
      "Report Generated:",
      generatedDate.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ],
  ];

  infoData.forEach((row, index) => {
    // Subtle line separator between rows
    if (index > 0) {
      doc.setDrawColor(233, 236, 239); // Very light gray
      doc.setLineWidth(0.2);
      doc.line(15, yPosition - 2, pageWidth - 15, yPosition - 2);
    }

    doc.setFont("helvetica", "bold");
    doc.text(row[0], 15, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(String(row[1]), 60, yPosition);
    yPosition += 7;
  });

  return yPosition + 5;
}

/**
 * Add calculation section with professional table styling
 */
function addCalculationSection(
  doc: jsPDF,
  yPosition: number,
  sections: ReportSection[],
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  sections.forEach((section) => {
    // Section title with subtle jade green underline
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 134, 89); // Jade green
    doc.text(section.title, 15, yPosition);

    // Subtle jade green line under title
    doc.setDrawColor(45, 134, 89);
    doc.setLineWidth(0.3);
    doc.line(15, yPosition + 2, pageWidth - 15, yPosition + 2);

    yPosition += 8;

    // Table rows with subtle lines
    doc.setTextColor(44, 62, 80); // Charcoal
    let rowIndex = 0;

    section.rows.forEach((row) => {
      // Subtle row separator line (very light)
      doc.setDrawColor(233, 236, 239); // Very light gray
      doc.setLineWidth(0.2);
      doc.line(15, yPosition - 2, pageWidth - 15, yPosition - 2);

      // Label
      doc.setFont(
        row.isBold ? "helvetica" : "helvetica",
        row.isBold ? "bold" : "normal",
      );
      doc.setFontSize(row.isTotal ? 11 : 10);
      doc.text(row.label, 20, yPosition);

      // Value (right-aligned)
      const valueText =
        typeof row.value === "number"
          ? `₦${row.value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : String(row.value);

      doc.text(valueText, pageWidth - 20, yPosition, { align: "right" });

      // Bottom border for total rows (navy blue)
      if (row.isTotal) {
        doc.setDrawColor(0, 31, 63);
        doc.setLineWidth(0.5);
        doc.line(15, yPosition + 3, pageWidth - 15, yPosition + 3);
      }

      yPosition += 7;
      rowIndex++;
    });

    yPosition += 3;
  });

  return yPosition;
}

/**
 * Add footer with compliance information
 */
function addReportFooter(doc: jsPDF, disclaimer?: string): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  // White background (no fill needed, default is white)
  // Subtle navy blue line above footer
  doc.setDrawColor(0, 31, 63);
  doc.setLineWidth(0.3);
  doc.line(0, pageHeight - 35, pageWidth, pageHeight - 35);

  // Disclaimer text
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(44, 62, 80);

  const disclaimerText =
    disclaimer ||
    "This report is generated for informational purposes only and should not be considered as professional tax advice. " +
      "Tax laws and regulations are subject to change. Please consult with a qualified tax professional for specific guidance.";

  const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - 30);
  doc.text(disclaimerLines, 15, pageHeight - 30);

  // Copyright
  doc.setFontSize(7);
  doc.setTextColor(149, 165, 166); // Light gray
  doc.text(
    "© 2026 KOMPLEET - Nigerian Tax Platform",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" },
  );
}

/**
 * Generate professional tax report PDF
 */
export function generateProfessionalTaxReport(data: TaxReportData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let yPosition = 0;

  // Add header with logo
  yPosition = addReportHeader(
    doc,
    data.reportType,
    data.taxpayerName,
    data.taxYear,
  );

  // Add taxpayer information
  yPosition = addTaxpayerInfo(
    doc,
    yPosition,
    data.taxpayerName,
    data.tin,
    data.generatedDate,
  );

  // Add calculation sections
  addCalculationSection(doc, yPosition, data.sections);

  // Add footer
  addReportFooter(doc, data.disclaimer);

  return doc;
}

/**
 * Export report as PDF buffer
 */
export function exportReportAsPDF(doc: jsPDF): Buffer {
  const pdfData = doc.output("arraybuffer");
  return Buffer.from(pdfData);
}

/**
 * Save report to file
 */
export function saveReportToFile(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
