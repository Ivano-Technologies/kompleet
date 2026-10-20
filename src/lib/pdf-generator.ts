import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AMOUNT_NGN_HEADER,
  addPoweredByFooter,
  drawExportMark,
  EXPORT_HEADER_GREY_RGB,
  EXPORT_INK_RGB,
} from "@/lib/export-chrome";

export interface CalculationPDFData {
  calculatorType: string;
  date: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  ruleVersion?: string;
  sources?: string[];
  confidenceLevel?: string;
}

export function generateCalculationPDF(
  data: CalculationPDFData,
  options?: { download?: boolean },
) {
  const doc = new jsPDF();
  let yPosition = 20;

  const formatCurrency = (value: number) => {
    return `NGN ${value.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatLabel = (key: string) => {
    const special: Record<string, string> = {
      vat_amount: "VAT amount",
      vat_rate: "VAT rate",
      vat_status: "VAT status",
    };
    if (special[key]) return special[key];
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  drawExportMark(doc);
  doc.setTextColor(...EXPORT_INK_RGB);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.calculatorType, 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${data.date}`, 20, yPosition);
  yPosition += 15;

  doc.setTextColor(...EXPORT_INK_RGB);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Input Parameters", 20, yPosition);
  yPosition += 5;

  const inputRows = Object.entries(data.inputs).map(([key, value]) => [
    formatLabel(key),
    typeof value === "number" ? formatCurrency(value) : String(value),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Parameter", "Value"]],
    body: inputRows,
    theme: "grid",
    headStyles: {
      fillColor: [...EXPORT_HEADER_GREY_RGB],
      textColor: 0,
      fontStyle: "bold",
    },
    styles: { textColor: 20 },
    margin: { left: 20, right: 20 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...EXPORT_INK_RGB);
  doc.text("Calculation Results", 20, yPosition);
  yPosition += 5;

  const resultRows = Object.entries(data.results).map(([key, value]) => [
    formatLabel(key),
    typeof value === "number" ? formatCurrency(value) : String(value),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Item", AMOUNT_NGN_HEADER]],
    body: resultRows,
    theme: "grid",
    headStyles: {
      fillColor: [...EXPORT_HEADER_GREY_RGB],
      textColor: 0,
      fontStyle: "bold",
    },
    styles: { textColor: 20 },
    columnStyles: {
      1: { halign: "right" },
    },
    didParseCell: (cellData) => {
      if (cellData.section === "head" && cellData.column.index === 1) {
        cellData.cell.styles.halign = "right";
      }
    },
    margin: { left: 20, right: 20 },
  });

  addPoweredByFooter(doc);

  const calculatorSlug = data.calculatorType.toLowerCase().replace(/\s+/g, "-");
  const parsed = new Date(data.date);
  const dateSlug = Number.isNaN(parsed.getTime())
    ? "export"
    : parsed.toISOString().split("T")[0];
  const filename = `KOMPLEET-${calculatorSlug}-${dateSlug}.pdf`;

  if (options?.download !== false) {
    doc.save(filename);
  }
  return doc;
}
