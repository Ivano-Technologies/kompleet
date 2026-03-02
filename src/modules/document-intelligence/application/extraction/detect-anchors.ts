export interface DetectedAnchors {
  invoiceNumber?: string;
  vendorName?: string;
  issueDate?: string;
  currency?: string;
  subtotal?: number;
  vatAmount?: number;
  totalAmount?: number;
  matchedAnchors: string[];
}

const CURRENCY_CODES = ["NGN", "USD", "EUR", "GBP"] as const;

export function detectAnchors(normalizedText: string): DetectedAnchors {
  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const detected: DetectedAnchors = {
    matchedAnchors: [],
  };

  const invoiceNumber = findByPattern(
    lines,
    /\b(?:invoice(?:\s*(?:no|number|#))?|inv(?:\s*(?:no|number|#))?)\b[:\s-]*([A-Z0-9-]+)/i,
  );
  if (invoiceNumber) {
    detected.invoiceNumber = invoiceNumber.toUpperCase();
    detected.matchedAnchors.push("invoice_number");
  }

  const issueDate = findByPattern(
    lines,
    /\b(?:date|issued|issue\s*date)\b[:\s-]*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/i,
  );
  if (issueDate) {
    detected.issueDate = issueDate;
    detected.matchedAnchors.push("issue_date");
  }

  const currency = findCurrency(lines);
  if (currency) {
    detected.currency = currency;
    detected.matchedAnchors.push("currency");
  }

  const subtotal = findAmount(lines, /\bsubtotal\b/i);
  if (subtotal !== undefined) {
    detected.subtotal = subtotal;
    detected.matchedAnchors.push("subtotal");
  }

  const vatAmount = findAmount(lines, /\b(?:vat|tax)\b/i);
  if (vatAmount !== undefined) {
    detected.vatAmount = vatAmount;
    detected.matchedAnchors.push("vat_amount");
  }

  const totalAmount = findAmount(lines, /\b(?:grand\s+total|total(?:\s+due)?)\b/i);
  if (totalAmount !== undefined) {
    detected.totalAmount = totalAmount;
    detected.matchedAnchors.push("total_amount");
  }

  const vendorLine = lines.find((line) => /\b(?:vendor|supplier|seller|from)\b/i.test(line));
  if (vendorLine) {
    const cleaned = vendorLine
      .replace(/\b(?:vendor|supplier|seller|from)\b[:\s-]*/gi, "")
      .trim();
    if (cleaned.length > 0) {
      detected.vendorName = cleaned;
      detected.matchedAnchors.push("vendor_name");
    }
  } else if (lines[0]) {
    detected.vendorName = lines[0];
    detected.matchedAnchors.push("vendor_name_fallback");
  }

  return detected;
}

function findByPattern(lines: string[], pattern: RegExp): string | undefined {
  for (const line of lines) {
    const match = line.match(pattern);
    const value = match?.[1]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

function findCurrency(lines: string[]): string | undefined {
  for (const line of lines) {
    const upper = line.toUpperCase();
    for (const code of CURRENCY_CODES) {
      if (upper.includes(code)) {
        return code;
      }
    }
    if (upper.includes("₦")) {
      return "NGN";
    }
  }
  return undefined;
}

function findAmount(lines: string[], labelPattern: RegExp): number | undefined {
  for (const line of lines) {
    if (!labelPattern.test(line)) {
      continue;
    }
    const amount = extractAmount(line);
    if (amount !== undefined) {
      return amount;
    }
  }
  return undefined;
}

function extractAmount(line: string): number | undefined {
  const match = line.match(/(-?\d[\d,]*(?:\.\d{1,2})?)/);
  if (!match?.[1]) {
    return undefined;
  }
  const parsed = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}
