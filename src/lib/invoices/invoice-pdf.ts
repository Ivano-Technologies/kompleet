/**
 * IVA-185: black and white invoice PDF.
 *
 * Pure renderer (no Convex, no network) so it can be unit tested and rendered
 * locally with mock data. `generateInvoicePDF` in invoice-service.ts loads the
 * invoice and logo, then calls `renderInvoicePdf`.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { sniffImage } from "../../../convex/lib/imageMeta";
import { hasLineDiscount, lineDiscount, lineNetAmount, totalsFromLines } from "./line-amounts";
import {
  INVOICE_BW,
  INVOICE_FOOTER_TEXT,
  IVANO_MARK_HEIGHT_PX,
  IVANO_MARK_POLYGONS,
  IVANO_MARK_VIEWBOX,
  LOGO_MAX_BYTES,
  LOGO_MAX_HEIGHT_MM,
  LOGO_MAX_WIDTH_MM,
  fitLogo,
  hexToRgb,
  pxToMm,
  resolveSenderHeader,
  type InvoiceSenderParty,
} from "./invoice-branding";


export type PdfLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount?: number;
  amount: number;
};

export type PdfCustomer = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
};

export type PdfLogo = {
  data: Uint8Array;
  format: "PNG" | "JPEG";
  width: number;
  height: number;
};

export type InvoicePdfInput = {
  invoiceNumber: string;
  invoiceDate: string | null;
  dueDate: string | null;
  taxYear: number | null;
  customer: PdfCustomer;
  sender: InvoiceSenderParty;
  lineItems: PdfLineItem[];
  subtotal: number;
  vatAmount: number;
  /** Ignored: discounts show per line in the Discount column, not as a totals row. */
  discountAmount?: number;
  totalAmount: number;
  paymentTerms?: string;
  notes?: string | null;
  signatureHash?: string;
  /** Loaded logo bytes. When absent the header falls back to the business name. */
  logo?: PdfLogo | null;
};

/** CSS px to PDF pt, so the PDF follows the preview's type scale. */
const px = (value: number) => value * 0.75;

const BLACK = hexToRgb(INVOICE_BW.text);
const GREY = hexToRgb(INVOICE_BW.secondary);
const HAIRLINE = hexToRgb(INVOICE_BW.hairline);

const MARGIN = 15;

/** The built in PDF fonts have no naira glyph, so the PDF writes NGN. */
function money(value: number): string {
  return `NGN ${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


function formatDate(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-NG");
}

function senderLines(sender: InvoiceSenderParty): string[] {
  const cityLine = [sender.city, sender.state, sender.country].filter(Boolean).join(", ");
  const contact = [sender.email, sender.phone].filter(Boolean).join("  ·  ");
  return [
    sender.addressLine1,
    sender.addressLine2,
    cityLine,
    contact,
    sender.tin ? `TIN ${sender.tin}` : "",
    sender.vatNumber ? `VAT ${sender.vatNumber}` : "",
  ].filter((line): line is string => Boolean(line));
}

/**
 * Draw the Ivano V mark as vector paths, right aligned at `right`, top at `top`.
 * Returns the drawn width in mm.
 */
export function drawIvanoMark(doc: jsPDF, right: number, top: number, height: number): number {
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

export function renderInvoicePdf(input: InvoicePdfInput): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const right = pageWidth - MARGIN;

  // ============================================
  // Header: white, sender on the left, Ivano V mark on the right
  // ============================================
  const header = resolveSenderHeader({
    name: input.sender.name,
    logoUrl: input.logo ? (input.sender.logoUrl ?? "embedded") : null,
    logoWidth: input.logo?.width,
    logoHeight: input.logo?.height,
  });

  const top = MARGIN;
  let leftBottom = top;
  if (header.mode === "logo" && input.logo) {
    const box = fitLogo(input.logo.width, input.logo.height, LOGO_MAX_WIDTH_MM, LOGO_MAX_HEIGHT_MM);
    doc.addImage(input.logo.data, input.logo.format, MARGIN, top, box.width, box.height);
    if (header.showName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(px(16));
      doc.setTextColor(...BLACK);
      const nameX = MARGIN + box.width + 4;
      const nameWidth = right - 60 - nameX;
      const lines = doc.splitTextToSize(header.name, Math.max(nameWidth, 30));
      doc.text(lines, nameX, top + box.height / 2, { baseline: "middle" });
    }
    leftBottom = top + box.height;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(px(18));
    if (header.mode === "name") {
      doc.setTextColor(...BLACK);
    } else {
      doc.setTextColor(...GREY);
    }
    const lines = doc.splitTextToSize(header.name, pageWidth / 2);
    doc.text(lines, MARGIN, top, { baseline: "top" });
    leftBottom = top + lines.length * 5.5;
  }

  const details = senderLines(input.sender);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  let y = leftBottom + 5;
  for (const line of details) {
    doc.text(line, MARGIN, y);
    y += 4.2;
  }
  leftBottom = y;

  // Right side: Ivano V mark, then INVOICE and the number, right aligned
  const markHeight = pxToMm(IVANO_MARK_HEIGHT_PX);
  drawIvanoMark(doc, right, top, markHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  doc.text("INVOICE", right, top + markHeight + 7, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text(input.invoiceNumber, right, top + markHeight + 12, { align: "right" });
  const rightBottom = top + markHeight + 14;

  const headerBottom = Math.max(leftBottom, rightBottom) + 2;
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, headerBottom, right, headerBottom);

  // ============================================
  // Bill to and dates
  // ============================================
  let yPos = headerBottom + 10;
  const blockTop = yPos;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("BILL TO", MARGIN, yPos);
  yPos += 6;
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text(input.customer.name || "", MARGIN, yPos);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  const customerLines = [
    ...(input.customer.address ? doc.splitTextToSize(input.customer.address, 90) : []),
    [input.customer.email, input.customer.phone].filter(Boolean).join("  ·  "),
    input.customer.tin ? `TIN ${input.customer.tin}` : "",
  ].filter(Boolean) as string[];
  for (const line of customerLines) {
    yPos += 4.5;
    doc.text(line, MARGIN, yPos);
  }

  const dates: Array<[string, string]> = [
    ["Invoice date", formatDate(input.invoiceDate)],
    ...(input.dueDate ? ([["Due date", formatDate(input.dueDate)]] as Array<[string, string]>) : []),
    ...(input.taxYear ? ([["Tax year", String(input.taxYear)]] as Array<[string, string]>) : []),
  ];
  let dateY = blockTop;
  for (const [label, value] of dates) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text(label, right - 40, dateY, { align: "right" });
    doc.setTextColor(...BLACK);
    doc.text(value, right, dateY, { align: "right" });
    dateY += 5.5;
  }
  yPos = Math.max(yPos, dateY) + 10;

  // ============================================
  // Line items: no fills, black header rule, grey hairlines
  // ============================================
  // Amount is the pre-VAT net (quantity x rate minus discount), recomputed so
  // rows always add up to the Subtotal even for older VAT inclusive data.
  // The Discount column only shows when a line has a discount.
  const showDiscount = hasLineDiscount(input.lineItems);
  const columns: Array<{
    head: string;
    align: "left" | "center" | "right";
    width: number;
    cell: (item: PdfLineItem) => string;
  }> = [
    { head: "Description", align: "left", width: showDiscount ? 62 : 88, cell: (item) => item.description },
    { head: "Qty", align: "center", width: 14, cell: (item) => String(item.quantity) },
    { head: "Unit price", align: "right", width: 32, cell: (item) => money(item.unit_price) },
    { head: "VAT", align: "center", width: 14, cell: (item) => `${item.vat_rate}%` },
    ...(showDiscount
      ? [
          {
            head: "Discount",
            align: "right" as const,
            width: 26,
            cell: (item: PdfLineItem) => (lineDiscount(item) > 0 ? money(lineDiscount(item)) : ""),
          },
        ]
      : []),
    { head: "Amount", align: "right", width: 32, cell: (item) => money(lineNetAmount(item)) },
  ];

  autoTable(doc, {
    startY: yPos,
    margin: { left: MARGIN, right: MARGIN },
    head: [columns.map((column) => column.head)],
    body: input.lineItems.map((item) => columns.map((column) => column.cell(item))),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.5,
      textColor: BLACK,
      fillColor: false,
      lineColor: HAIRLINE,
      lineWidth: { bottom: 0.2 },
    },
    headStyles: {
      fontStyle: "bold",
      textColor: BLACK,
      fillColor: false,
      lineColor: BLACK,
      lineWidth: { bottom: 0.3 },
    },
    didParseCell: (data) => {
      data.cell.styles.halign = columns[data.column.index]?.align ?? "left";
    },
    columnStyles: Object.fromEntries(
      columns.map((column, index) => [index, { cellWidth: column.width }]),
    ),
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ============================================
  // Totals: secondary rows grey, Total bold above a single black rule
  // ============================================
  const totalsX = pageWidth - 70;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const row = (label: string, value: string) => {
    doc.setTextColor(...GREY);
    doc.text(label, totalsX, yPos, { align: "right" });
    doc.setTextColor(...BLACK);
    doc.text(value, right, yPos, { align: "right" });
    yPos += 7;
  };
  // Rebuilt from the lines: Subtotal = sum of rounded line amounts, VAT on the
  // Subtotal, Total = Subtotal + VAT. Stored values only when there are no lines.
  const totals =
    input.lineItems.length > 0
      ? totalsFromLines(input.lineItems)
      : { subtotal: input.subtotal, vat_amount: input.vatAmount, total_amount: input.totalAmount };
  row("Subtotal", money(totals.subtotal));
  row("VAT", money(totals.vat_amount));

  yPos += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BLACK);
  doc.text("Total", totalsX, yPos, { align: "right" });
  doc.text(money(totals.total_amount), right, yPos, { align: "right" });
  yPos += 3;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.line(totalsX - 30, yPos, right, yPos);

  // ============================================
  // Payment terms and notes
  // ============================================
  yPos += 15;
  doc.setFontSize(10);
  if (input.paymentTerms) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text("Payment terms", MARGIN, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    const lines = doc.splitTextToSize(input.paymentTerms, pageWidth - 2 * MARGIN);
    doc.text(lines, MARGIN, yPos);
    yPos += lines.length * 5 + 5;
  }
  if (input.notes) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text("Notes", MARGIN, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    const lines = doc.splitTextToSize(input.notes, pageWidth - 2 * MARGIN);
    doc.text(lines, MARGIN, yPos);
  }

  if (input.signatureHash) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.text(`Signature ${input.signatureHash.substring(0, 16)}...`, right, pageHeight - 18, {
      align: "right",
    });
  }

  // ============================================
  // Footer: one small grey centred line
  // ============================================
  doc.setFont("helvetica", "normal");
  doc.setFontSize(px(8));
  doc.setTextColor(...GREY);
  doc.text(INVOICE_FOOTER_TEXT, pageWidth / 2, pageHeight - 10, { align: "center" });

  return doc;
}

/** Logos are only fetched from Convex file storage, never arbitrary hosts. */
export function isAllowedLogoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith(".convex.cloud") || host.endsWith(".convex.site")) return true;
    const configured = process.env.NEXT_PUBLIC_CONVEX_URL;
    return Boolean(configured && new URL(configured).hostname.toLowerCase() === host);
  } catch {
    return false;
  }
}

/**
 * Fetch a stored logo for the PDF. Only PNG or JPEG up to 1MB is embedded.
 * Any failure returns null so the header falls back to the business name.
 */
export async function loadPdfLogo(
  url: string | undefined | null,
  fetchImpl: typeof fetch = fetch,
): Promise<PdfLogo | null> {
  if (!url) return null;
  try {
    if (!isAllowedLogoUrl(url)) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetchImpl(url, { signal: controller.signal }).finally(() =>
      clearTimeout(timer),
    );
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > LOGO_MAX_BYTES) return null;
    const meta = sniffImage(bytes);
    if (!meta) return null;
    return {
      data: bytes,
      format: meta.type === "image/png" ? "PNG" : "JPEG",
      width: meta.width,
      height: meta.height,
    };
  } catch {
    return null;
  }
}
