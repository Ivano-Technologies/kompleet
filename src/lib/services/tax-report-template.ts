/**
 * Tax report PDF. Black and white house style: ink text, grey headers,
 * Ivano V mark, Powered by Kompleet.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AMOUNT_NGN_HEADER,
  PREPARED_WITH_KOMPLEET,
  addPoweredByFooter,
  drawExportMark,
  EXPORT_HEADER_GREY_RGB,
  EXPORT_INK_RGB,
} from "@/lib/export-chrome";

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

function addReportHeader(
  doc: jsPDF,
  reportType: string,
  taxYear: number,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  drawExportMark(doc);

  doc.setTextColor(...EXPORT_INK_RGB);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${reportType} report`, 15, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(PREPARED_WITH_KOMPLEET, 15, 25);

  doc.setFontSize(9);
  doc.text(`Tax Year: ${taxYear}`, pageWidth - 15, 25, { align: "right" });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(0, 32, pageWidth, 32);

  return 42;
}

function addTaxpayerInfo(
  doc: jsPDF,
  yPosition: number,
  taxpayerName: string,
  tin: string,
  generatedDate: Date,
): number {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...EXPORT_INK_RGB);
  doc.text("TAXPAYER INFORMATION", 15, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const infoData = [
    ["Taxpayer Name:", taxpayerName],
    ["TIN:", tin],
    [
      "Report Generated:",
      generatedDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    ],
  ];

  infoData.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.text(row[0], 15, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(String(row[1]), 60, yPosition);
    yPosition += 7;
  });

  return yPosition + 5;
}

function addCalculationSection(
  doc: jsPDF,
  yPosition: number,
  sections: ReportSection[],
): number {
  sections.forEach((section) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...EXPORT_INK_RGB);
    doc.text(section.title, 15, yPosition);
    yPosition += 6;

    const body = section.rows.map((row) => {
      const valueText =
        typeof row.value === "number"
          ? `NGN ${row.value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : String(row.value);
      return [row.label, valueText];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [["Description", AMOUNT_NGN_HEADER]],
      body,
      theme: "plain",
      headStyles: {
        fillColor: [...EXPORT_HEADER_GREY_RGB],
        textColor: 0,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, textColor: 20, cellPadding: 3 },
      columnStyles: {
        1: { halign: "right" },
      },
      didParseCell: (data: {
        section: string;
        column: { index: number };
        cell: { styles: { halign?: string; fontStyle?: string } };
        row: { index: number };
      }) => {
        if (data.column.index === 1) {
          data.cell.styles.halign = "right";
        }
        const row = section.rows[data.row.index];
        if (data.section === "body" && row?.isBold) {
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 15, right: 15 },
    });

    yPosition =
      ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? yPosition + 24) + 10;
  });

  return yPosition;
}

export function generateProfessionalTaxReport(data: TaxReportData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let yPosition = addReportHeader(doc, data.reportType, data.taxYear);

  yPosition = addTaxpayerInfo(
    doc,
    yPosition,
    data.taxpayerName,
    data.tin,
    data.generatedDate,
  );

  addCalculationSection(doc, yPosition, data.sections);
  addPoweredByFooter(doc);

  return doc;
}

export function exportReportAsPDF(doc: jsPDF): Buffer {
  const pdfData = doc.output("arraybuffer");
  return Buffer.from(pdfData);
}

export function saveReportToFile(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
