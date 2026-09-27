export const LOW_CONFIDENCE_THRESHOLD = 80;

export const TRIAGE_REASONS = [
  "uncategorised",
  "low_confidence",
  "duplicate_suspect",
] as const;

export type TriageReason = (typeof TRIAGE_REASONS)[number];

export type TriageKind = "transaction" | "duplicate";

export type TriageCategory = {
  id: string;
  name: string;
};

export type TriageRow = {
  id: string;
  kind: TriageKind;
  merchant: string;
  amount: number;
  transactionType: "debit" | "credit";
  date: string;
  bankMeta: string | null;
  reason: TriageReason;
  suggestedCategory: TriageCategory | null;
  category: TriageCategory | null;
  confidenceScore: number | null;
};

export type TriageCounts = {
  needsCheck: number;
  uncategorised: number;
  lowConfidence: number;
  duplicateSuspect: number;
};

export type TriageSnapshot = {
  kind: TriageKind;
  id: string;
  categoryId: string | null;
  confidenceScore: number | null;
  triageIgnored: boolean;
  duplicateStatus: string | null;
  createdTransactionId: string | null;
};

export type CategoryHint = {
  id: string;
  name: string;
  keywords?: string[];
};

const KEYWORD_HINTS: Record<string, string[]> = {
  "Sales Revenue": ["payment from", "invoice", "sales", "revenue"],
  "Service Income": ["consulting", "service", "professional"],
  "Salaries & Wages": ["salary", "wages", "payroll", "staff"],
  "Rent Expense": ["rent", "lease"],
  Utilities: ["electricity", "water", "internet", "phone"],
  "Office Supplies": ["supplies", "stationery", "office"],
  "Marketing & Advertising": ["marketing", "advertising", "promotion"],
  "Professional Fees": ["accountant", "lawyer", "consultant", "professional"],
  "Travel & Transport": ["fuel", "transport", "travel", "taxi"],
  "Bank Charges": ["bank charges", "bank fee", "transfer charges"],
  Insurance: ["insurance", "premium"],
  "Equipment Purchase": ["equipment", "laptop", "computer", "machinery"],
};

export function emptyTriageCounts(): TriageCounts {
  return {
    needsCheck: 0,
    uncategorised: 0,
    lowConfidence: 0,
    duplicateSuspect: 0,
  };
}

export function transactionTriageReason(row: {
  categoryId?: string | null;
  category?: { id: string } | null;
  confidenceScore?: number | null;
  confidence_score?: number | null;
  triageIgnoredAt?: number | null;
  triage_ignored?: boolean;
}): Exclude<TriageReason, "duplicate_suspect"> | null {
  if (row.triageIgnoredAt || row.triage_ignored) return null;
  const hasCategory = Boolean(row.categoryId || row.category);
  if (!hasCategory) return "uncategorised";
  const score = row.confidenceScore ?? row.confidence_score;
  if (typeof score === "number" && score < LOW_CONFIDENCE_THRESHOLD) {
    return "low_confidence";
  }
  return null;
}

export function titleCaseMerchant(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  return trimmed
    .toLowerCase()
    .split(/(\s+|·)/)
    .map((part) => {
      if (part === "·" || /^\s+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export function formatTriageAmount(
  amount: number,
  transactionType: "debit" | "credit",
): string {
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
  return transactionType === "credit" ? `+${formatted}` : `−${formatted}`;
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatTriageDate(dateStr: string): string {
  const value = dateStr.includes("T") ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(value.getTime())) return dateStr;
  const month = SHORT_MONTHS[value.getMonth()];
  if (!month) return dateStr;
  return `${value.getDate()} ${month} ${value.getFullYear()}`;
}

export function suggestCategory(
  description: string,
  categories: CategoryHint[],
  transactionType?: "debit" | "credit",
): TriageCategory | null {
  const desc = description.toLowerCase();
  let best: { category: CategoryHint; score: number } | null = null;

  for (const category of categories) {
    let score = 0;
    if (desc.includes(category.name.toLowerCase())) score += 40;
    const extra = KEYWORD_HINTS[category.name] ?? [];
    const keywords = [...(category.keywords ?? []), ...extra];
    for (const keyword of keywords) {
      const needle = keyword.trim().toLowerCase();
      if (needle && desc.includes(needle)) score += 30;
    }
    if (transactionType === "credit" && /income|revenue|sales/i.test(category.name)) {
      score += 10;
    }
    if (transactionType === "debit" && /expense|cost|fee/i.test(category.name)) {
      score += 10;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { category, score };
    }
  }

  if (!best) return null;
  return { id: best.category.id, name: best.category.name };
}

export function sumTriageCounts(counts: Omit<TriageCounts, "needsCheck">): TriageCounts {
  return {
    ...counts,
    needsCheck:
      counts.uncategorised + counts.lowConfidence + counts.duplicateSuspect,
  };
}
