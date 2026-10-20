/**
 * Shared black-and-white export chrome for every Kompleet PDF and HTML export.
 * Grey Ivano V mark top right, ink text, grey table headers, Powered by Kompleet.
 */
import type { jsPDF } from "jspdf";
import {
  INVOICE_FOOTER_TEXT,
  IVANO_MARK_HEIGHT_PX,
  IVANO_MARK_POLYGONS,
  IVANO_MARK_VIEWBOX,
  hexToRgb,
  pxToMm,
} from "@/lib/invoices/invoice-branding";

export const EXPORT_INK = "#141413";
export const EXPORT_INK_RGB = [20, 20, 19] as const;
export const EXPORT_GREY = "#555555";
export const EXPORT_HEADER_GREY = "#F2F2F2";
export const EXPORT_HEADER_GREY_RGB = [242, 242, 242] as const;
export const AMOUNT_NGN_HEADER = "Amount (NGN)";
export const PREPARED_FOR_RECORDS = "Prepared with Kompleet for your records.";
export const PREPARED_WITH_KOMPLEET = "Prepared with Kompleet";

export { INVOICE_FOOTER_TEXT };

/** Draw the grey Ivano V mark, right aligned at `right`, top at `top`. Height in mm. */
export function drawIvanoMark(
  doc: jsPDF,
  right: number,
  top: number,
  height: number,
): number {
  const scale = height / IVANO_MARK_VIEWBOX.height;
  const width = IVANO_MARK_VIEWBOX.width * scale;
  const left = right - width;
  for (const polygon of IVANO_MARK_POLYGONS) {
    doc.setFillColor(...hexToRgb(polygon.fill));
    polygon.points.forEach(([x, y], index) => {
      const mx = left + x * scale;
      const my = top + y * scale;
      if (index === 0) doc.moveTo(mx, my);
      else doc.lineTo(mx, my);
    });
    doc.close();
    doc.fill();
  }
  return width;
}

export function drawExportMark(doc: jsPDF, right = 14, top = 10): number {
  return drawIvanoMark(doc, doc.internal.pageSize.getWidth() - right, top, pxToMm(IVANO_MARK_HEIGHT_PX));
}

export function addPoweredByFooter(
  doc: jsPDF,
  extraLine?: string,
): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageCount =
    typeof doc.getNumberOfPages === "function"
      ? doc.getNumberOfPages()
      : doc.internal.pages.length - 1;

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    const y = extraLine ? pageHeight - 12 : pageHeight - 10;
    doc.text(INVOICE_FOOTER_TEXT, pageWidth / 2, y, { align: "center" });
    if (extraLine) {
      doc.text(extraLine, pageWidth / 2, pageHeight - 7, { align: "center" });
    }
  }
}

export function amountHeaderStyles() {
  return {
    headStyles: {
      fillColor: [...EXPORT_HEADER_GREY_RGB] as [number, number, number],
      textColor: 0,
      fontStyle: "bold" as const,
    },
    styles: { fontSize: 10, cellPadding: 4, textColor: 20 },
    columnStyles: {
      1: { cellWidth: 50, halign: "right" as const },
    },
    didParseCell: (data: { section: string; column: { index: number }; cell: { styles: { halign?: string } } }) => {
      if (data.section === "head" && data.column.index === 1) {
        data.cell.styles.halign = "right";
      }
    },
  };
}

export function ivanoMarkSvg(heightPx = IVANO_MARK_HEIGHT_PX): string {
  const width =
    (heightPx * IVANO_MARK_VIEWBOX.width) / IVANO_MARK_VIEWBOX.height;
  const polygons = IVANO_MARK_POLYGONS.map(
    (polygon) =>
      `<polygon fill="${polygon.fill}" points="${polygon.points
        .map(([x, y]) => `${x},${y}`)
        .join(" ")}"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(2)}" height="${heightPx}" viewBox="0 0 ${IVANO_MARK_VIEWBOX.width} ${IVANO_MARK_VIEWBOX.height}" role="img" aria-label="Ivano">${polygons}</svg>`;
}

export function exportHtmlChrome(options: {
  title: string;
  body: string;
  recordsFooter?: boolean;
}): string {
  const extra = options.recordsFooter
    ? `<p>${PREPARED_FOR_RECORDS}</p>`
    : "";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${options.title}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 40px;
      color: ${EXPORT_INK};
      background: #ffffff;
    }
    .export-header {
      position: relative;
      min-height: 28px;
      margin-bottom: 8px;
    }
    .export-mark {
      position: absolute;
      top: 0;
      right: 0;
    }
    h1 {
      text-align: center;
      color: ${EXPORT_INK};
      margin: 8px 40px 10px;
      font-size: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid #dddddd;
      text-align: left;
    }
    th {
      background-color: ${EXPORT_HEADER_GREY};
      color: ${EXPORT_INK};
      font-weight: bold;
    }
    th.amount, td.amount, .amount {
      text-align: right;
    }
    .export-footer {
      margin-top: 48px;
      text-align: center;
      color: #888888;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="export-header">
    <div class="export-mark">${ivanoMarkSvg()}</div>
  </div>
  ${options.body}
  <div class="export-footer">
    <p>${INVOICE_FOOTER_TEXT}</p>
    ${extra}
  </div>
</body>
</html>`;
}
