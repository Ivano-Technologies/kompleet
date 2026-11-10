/**
 * Deterministic extraction for Nigerian PDF bank statements.
 *
 * UBA (PDFsharp/MigraDoc) wraps `10-Mar-2024` across lines (`10-Mar-` + `2024`)
 * and splits narrations. The line-oriented regex fallback never sees a full
 * date+amount pair, so import returns zero rows unless an LLM is available
 * and succeeds. This module repairs wraps and groups multi-line rows.
 *
 * GTB (Guaranty Trust Bank) PDFs add three extra artefacts: leading `'0` /
 * `'00` fragments on fields, page-footer address/phone lines merged into the
 * last narration on a page, and Debit/Credit/Balance columns that pdfjs can
 * emit in the wrong order. Those are stripped and reconciled here.
 */

import {
  parseAmount,
  parseDateFlexible,
  type ParsedTransaction,
} from "./csv-parser";

const DATE_TOKEN =
  "(?:\\d{1,2}-[A-Za-z]{3}-\\d{2,4}|\\d{1,2}/\\d{1,2}/\\d{2,4})";
const DATE_TOKEN_RE = new RegExp(`\\b${DATE_TOKEN}\\b`, "g");
const DATE_AT_START_RE = new RegExp(`^${DATE_TOKEN}`);
const WRAPPED_MON_DATE_RE =
  /(\d{1,2}-[A-Za-z]{3})-\s*[\r\n]+\s*((?:20|19)\d{2}|\d{2})\b/g;
const WRAPPED_MON_DATE_SPACE_RE =
  /(\d{1,2}-[A-Za-z]{3})-\s+((?:20|19)\d{2})\b/g;
const MONEY_RE = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
const PERIOD_RE = new RegExp(
  `${DATE_TOKEN}\\s+to\\s+${DATE_TOKEN}`,
  "i",
);
const REFERENCE_RE = /\b\d{12,}\b|\b[A-Z]{2,}\d{10,}\b/;
const DEBIT_HINT =
  /stamp\s*duty|sms|charge|charges|levy|commission|vat|fee|debit|withdrawal|\bdr\b/i;
const CREDIT_HINT =
  /\bcr\b|credit|from\b|salary|deposit|inflow|xfer ac|transfer in/i;

interface StatementRow {
  date: string;
  merchant: string;
  amount: number;
  balance: number;
  amounts: number[];
  reference?: string;
  isBalanceRow: boolean;
  raw: string;
}

const YEAR_LEAD_LINE_RE =
  /^((?:20|19)\d{2})(?:\s+((?:20|19)\d{2}))?(?:\s+(.*))?$/;

const GTB_FOOTER_PATTERNS: RegExp[] = [
  /plot\s+\d+,?\s*akin\s+adesola\s+street(?:,?\s*victoria\s+island)?(?:,?\s*lagos)?/gi,
  /victoria\s+island,?\s*lagos/gi,
  /p\.?\s*o\.?\s*box\s+\d+(?:,?\s*victoria\s+island)?(?:,?\s*lagos)?/gi,
  /tel(?:ephone)?\s*:/gi,
  /0700[-\s]?gtbank(?:\s*\(\s*0700[-\s]?\d+\s*\))?/gi,
  /\+234[\s-]*1[\s-]*448[\s-]*\d{3,4}/gi,
  /\b0?1[-\s]?448[-\s]?\d{4}\b/gi,
  /(?:www\.)?gtbank\.com/gi,
  /guaranty\s+trust\s+bank(?:\s+plc)?(?:\s*,?\s*r\.?c\.?\s*\d+)?/gi,
];

function incompleteMonDateRe(): RegExp {
  return /(\d{1,2}-[A-Za-z]{3})-(?!\s*(?:20|19)\d{2})/g;
}

/**
 * pdfjs Y-bucketing can put `10-Mar- 10-Mar- narration` on one line and
 * `2024 2024 rest` two lines later. Pair those orphan years back onto the
 * incomplete prefixes so structured extract still sees full dates.
 */
function repairInterleavedWrappedYears(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];

  for (const line of lines) {
    const yearLead = line.trim().match(YEAR_LEAD_LINE_RE);
    if (yearLead) {
      const years = [yearLead[1], yearLead[2]].filter(
        (token): token is string => Boolean(token),
      );
      let attached = false;
      const searchFrom = Math.max(0, out.length - 4);
      for (let i = out.length - 1; i >= searchFrom; i--) {
        const prev = out[i] ?? "";
        const incompletes = prev.match(incompleteMonDateRe());
        if (!incompletes || incompletes.length === 0) continue;
        if (incompletes.length > years.length) continue;
        let yearIndex = 0;
        out[i] = prev.replace(incompleteMonDateRe(), (prefix) => {
          const year = years[yearIndex];
          yearIndex += 1;
          return year ? `${prefix}${year}` : prefix;
        });
        const rest = (yearLead[3] ?? "").trim();
        if (rest) out.push(rest);
        attached = true;
        break;
      }
      if (attached) continue;
    }
    out.push(line);
  }

  return out.join("\n");
}

export function repairWrappedStatementDates(text: string): string {
  let repaired = text.replace(WRAPPED_MON_DATE_RE, "$1-$2");
  // Second pass for remaining wraps after the first join shifted newlines.
  repaired = repaired.replace(WRAPPED_MON_DATE_RE, "$1-$2");
  // Stream/pdfjs extractors often keep a space instead of a newline.
  repaired = repaired.replace(WRAPPED_MON_DATE_SPACE_RE, "$1-$2");
  repaired = repairInterleavedWrappedYears(repaired);
  return repaired;
}

/**
 * GTB PDF cells often emit a leading Excel-style `'0` / `'00` fragment
 * that is not part of the date, narration or reference.
 */
export function stripLeadingQuoteZeroFragments(value: string): string {
  return value
    .replace(/(^|[^\S\r\n])'0{1,2}(?:[^\S\r\n]+|(?=$))/gm, "$1")
    .replace(/(^|[^\S\r\n])'0{1,2}(?=[A-Za-z])/gm, "$1")
    .replace(/[^\S\r\n]{2,}/g, " ");
}

/**
 * GTB page footers (head-office address and contact numbers) sit on the
 * same Y-band as the last row, so pdfjs concatenates them into narration.
 */
export function stripMergedPageFooter(value: string): string {
  let cleaned = value;
  for (const pattern of GTB_FOOTER_PATTERNS) {
    pattern.lastIndex = 0;
    cleaned = cleaned.replace(pattern, " ");
  }
  return cleaned.replace(/[^\S\r\n]{2,}/g, " ").replace(/[ \t]+\n/g, "\n");
}

function cleanParsedField(value: string): string {
  return stripMergedPageFooter(stripLeadingQuoteZeroFragments(value))
    .replace(/\s+/g, " ")
    .trim();
}

export function looksLikeUbaTableStatement(text: string): boolean {
  const hasTransDate = /trans(?:action)?\s*date/i.test(text);
  const hasNarration = /narration|transaction details/i.test(text);
  const hasAmountCols = /debit/i.test(text) && /credit/i.test(text);
  const hasBalance = /balance/i.test(text);
  const hasUba = /united bank.{0,20}africa|\buba\b/i.test(text);
  return (hasTransDate && hasNarration && hasAmountCols && hasBalance) || hasUba;
}

export function looksLikeGtbTableStatement(text: string): boolean {
  const hasGtb = /guaranty\s+trust|\bgtbank\b|\bgtb\b/i.test(text);
  const hasAmountCols = /debit/i.test(text) && /credit/i.test(text);
  const hasBalance = /balance/i.test(text);
  const hasDateCol = /(?:trans(?:action)?\s*)?date/i.test(text);
  return hasGtb && hasAmountCols && hasBalance && hasDateCol;
}

function isGtbFooterLine(trimmed: string): boolean {
  if (/akin\s+adesola/i.test(trimmed)) return true;
  if (/victoria\s+island/i.test(trimmed) && /lagos/i.test(trimmed)) return true;
  if (/0700[-\s]?gtbank/i.test(trimmed)) return true;
  if (/^(?:www\.)?gtbank\.com$/i.test(trimmed)) return true;
  if (/^guaranty\s+trust\s+bank/i.test(trimmed)) return true;
  if (/^tel(?:ephone)?\s*:/i.test(trimmed)) return true;
  if (/^\+234[\s-]*1[\s-]*448/i.test(trimmed)) return true;
  return false;
}

function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^--\s*\d+\s+of\s+\d+\s*--/i.test(trimmed)) return true;
  if (/^page\s+\d+\s+of\s+\d+/i.test(trimmed)) return true;
  if (/^bank statement$/i.test(trimmed)) return true;
  if (/^account statement$/i.test(trimmed)) return true;
  if (/trans\s*date/i.test(trimmed) && /narration|value\s*date|remarks/i.test(trimmed)) {
    return true;
  }
  if (/^no\s+debit/i.test(trimmed)) return true;
  if (
    /download app|head office|privacy policy|africa'?s global bank/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (
    /hello |here is your account|account (number|type)|opening balance:|closing balance:|total debit:|total credit:|currency:/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (PERIOD_RE.test(trimmed)) return true;
  if (/^[a-z]{3}\s+\d{1,2},\s+\d{4}\s+to\s+/i.test(trimmed)) return true;
  if (isGtbFooterLine(trimmed)) return true;
  return false;
}

function isTxnStart(line: string): boolean {
  const trimmed = line.trim();
  if (!DATE_AT_START_RE.test(trimmed)) return false;
  if (PERIOD_RE.test(trimmed)) return false;
  return true;
}

function blockHasAmount(lines: string[]): boolean {
  const money = /\d{1,3}(?:,\d{3})*\.\d{2}/;
  return lines.some((line) => money.test(line));
}

function isBalanceRow(merchant: string): boolean {
  return /^(opening|closing)\s+balance\b|brought\s+forward|balance\s+b\/f/i.test(
    merchant.trim(),
  );
}

function inferTypeFromNarration(merchant: string): "debit" | "credit" {
  if (CREDIT_HINT.test(merchant) && !DEBIT_HINT.test(merchant)) {
    return "credit";
  }
  if (DEBIT_HINT.test(merchant)) {
    return "debit";
  }
  return "debit";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseMoneyTokens(text: string): number[] {
  const matches = text.match(MONEY_RE) ?? [];
  return matches.map((token) => parseAmount(token));
}

function amountMatchesDelta(candidate: number, delta: number): boolean {
  return Math.abs(candidate - Math.abs(delta)) < 0.015;
}

/**
 * GTB prints Debit, Credit and Balance. pdfjs sometimes emits those in the
 * wrong order, so the running-balance delta is the source of truth when it
 * matches one of the printed amounts.
 */
function resolveAmountAndBalance(
  amounts: number[],
  previousBalance: number | undefined,
): { amount: number; balance: number } {
  if (amounts.length === 0) {
    return { amount: 0, balance: previousBalance ?? 0 };
  }

  if (amounts.length === 1) {
    const only = amounts[0] ?? 0;
    return { amount: only, balance: only };
  }

  const last = amounts[amounts.length - 1] ?? 0;
  const secondLast = amounts[amounts.length - 2] ?? last;
  const leading = amounts.slice(0, -1);

  if (previousBalance !== undefined) {
    const deltaIfLastIsBalance = round2(last - previousBalance);
    const deltaIfSecondIsBalance = round2(secondLast - previousBalance);
    const lastMatchesToken = leading.some((value) =>
      amountMatchesDelta(value, deltaIfLastIsBalance),
    );
    const swappedMatchesToken = amountMatchesDelta(
      last,
      deltaIfSecondIsBalance,
    );

    if (lastMatchesToken && swappedMatchesToken) {
      const lastCloser =
        Math.abs(last - previousBalance) <=
        Math.abs(secondLast - previousBalance);
      if (lastCloser) {
        const amount =
          leading.find(
            (value) =>
              value > 0.005 &&
              amountMatchesDelta(value, deltaIfLastIsBalance),
          ) ?? Math.abs(deltaIfLastIsBalance);
        return { amount, balance: last };
      }
      return { amount: last, balance: secondLast };
    }

    if (swappedMatchesToken && !lastMatchesToken) {
      return { amount: last, balance: secondLast };
    }

    if (lastMatchesToken) {
      const amount =
        leading.find(
          (value) =>
            value > 0.005 && amountMatchesDelta(value, deltaIfLastIsBalance),
        ) ?? Math.abs(deltaIfLastIsBalance);
      return { amount, balance: last };
    }

    const lastCloserToPrevious =
      Math.abs(last - previousBalance) <=
      Math.abs(secondLast - previousBalance);
    if (lastCloserToPrevious) {
      const nonzero = leading.filter((value) => value > 0.005);
      const amount =
        nonzero.length === 1
          ? (nonzero[0] ?? Math.abs(deltaIfLastIsBalance))
          : Math.abs(deltaIfLastIsBalance);
      return {
        amount: amount > 0.005 ? amount : Math.abs(deltaIfLastIsBalance),
        balance: last,
      };
    }

    const swapAmount = Math.abs(deltaIfSecondIsBalance);
    return {
      amount: swapAmount > 0.005 ? swapAmount : last,
      balance: secondLast,
    };
  }

  if (amounts.length >= 3) {
    const debit = amounts[amounts.length - 3] ?? 0;
    const credit = amounts[amounts.length - 2] ?? 0;
    if (debit > 0.005 && credit <= 0.005) {
      return { amount: debit, balance: last };
    }
    if (credit > 0.005 && debit <= 0.005) {
      return { amount: credit, balance: last };
    }
    return { amount: Math.max(debit, credit), balance: last };
  }

  return { amount: secondLast, balance: last };
}

function parseRowBlock(lines: string[]): StatementRow | null {
  const joined = cleanParsedField(lines.join(" "));
  if (!joined) return null;

  const dateTokens = joined.match(DATE_TOKEN_RE) ?? [];
  const amounts = parseMoneyTokens(joined);
  if (dateTokens.length === 0 || amounts.length === 0) return null;

  const date = parseDateFlexible(dateTokens[0] ?? "", "DD-MMM-YYYY");
  if (!date) return null;

  let remainder = joined;
  for (const token of dateTokens) {
    remainder = remainder.replace(token, " ");
  }
  remainder = remainder.replace(MONEY_RE, " ");

  const refMatch = remainder.match(REFERENCE_RE);
  const reference = refMatch?.[0]
    ? cleanParsedField(refMatch[0])
    : undefined;
  if (refMatch?.[0]) {
    remainder = remainder.replace(refMatch[0], " ");
  }

  const merchant = cleanParsedField(remainder);
  if (!merchant) return null;

  const provisional = resolveAmountAndBalance(amounts, undefined);

  return {
    date,
    merchant,
    amount: Math.abs(provisional.amount),
    balance: provisional.balance,
    amounts,
    reference,
    isBalanceRow: isBalanceRow(merchant),
    raw: joined,
  };
}

function collectRowBlocks(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const blocks: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) {
      blocks.push(current);
      current = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (isNoiseLine(line)) continue;

    if (isTxnStart(line) && (current.length === 0 || blockHasAmount(current))) {
      flush();
      current = [line];
      continue;
    }

    if (current.length > 0) {
      current.push(line);
    }
  }

  flush();
  return blocks;
}

function classifyType(
  row: StatementRow,
  previousBalance: number | undefined,
  amount: number,
  balance: number,
): "debit" | "credit" {
  if (previousBalance === undefined) {
    return inferTypeFromNarration(row.merchant);
  }

  const delta = round2(balance - previousBalance);
  if (Math.abs(delta - amount) < 0.015) return "credit";
  if (Math.abs(delta + amount) < 0.015) return "debit";
  if (delta > 0) return "credit";
  if (delta < 0) return "debit";
  return inferTypeFromNarration(row.merchant);
}

/**
 * Extract transactions from repaired statement text (UBA/GTB-style tables).
 * Skips opening/closing balance rows; uses running balance for DR/CR.
 */
export function extractStructuredStatementTransactions(
  text: string,
): ParsedTransaction[] {
  const repaired = stripMergedPageFooter(
    stripLeadingQuoteZeroFragments(repairWrappedStatementDates(text)),
  );
  const rows = collectRowBlocks(repaired)
    .map((block) => parseRowBlock(block))
    .filter((row): row is StatementRow => row !== null);

  const transactions: ParsedTransaction[] = [];
  let previousBalance: number | undefined;

  for (const row of rows) {
    const resolved = resolveAmountAndBalance(row.amounts, previousBalance);
    const amount = Math.abs(resolved.amount);
    const balance = resolved.balance;

    if (row.isBalanceRow) {
      previousBalance = balance;
      continue;
    }

    const type = classifyType(row, previousBalance, amount, balance);
    previousBalance = balance;

    transactions.push({
      date: row.date,
      merchant: row.merchant,
      amount,
      type,
      balance,
      reference: row.reference,
      rawData: {
        source: "statement_text",
        original: row.raw,
      },
    });
  }

  return transactions;
}
