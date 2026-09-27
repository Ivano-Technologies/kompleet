/**
 * Deterministic extraction for Nigerian PDF bank statements.
 *
 * UBA (PDFsharp/MigraDoc) wraps `10-Mar-2024` across lines (`10-Mar-` + `2024`)
 * and splits narrations. The line-oriented regex fallback never sees a full
 * date+amount pair, so import returns zero rows unless an LLM is available
 * and succeeds. This module repairs wraps and groups multi-line rows.
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
  /(\d{1,2}-[A-Za-z]{3})-\s*[\r\n]+\s*(\d{2,4})/g;
const MONEY_RE = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
const PERIOD_RE = new RegExp(
  `${DATE_TOKEN}\\s+to\\s+${DATE_TOKEN}`,
  "i",
);
const REFERENCE_RE = /\b\d{12,}\b/;
const DEBIT_HINT =
  /stamp\s*duty|sms|charge|charges|levy|commission|vat|fee|debit|withdrawal|\bdr\b/i;
const CREDIT_HINT =
  /\bcr\b|credit|from\b|salary|deposit|inflow|xfer ac|transfer in/i;

interface StatementRow {
  date: string;
  merchant: string;
  amount: number;
  balance: number;
  reference?: string;
  isBalanceRow: boolean;
  raw: string;
}

export function repairWrappedStatementDates(text: string): string {
  let repaired = text.replace(WRAPPED_MON_DATE_RE, "$1-$2");
  // Second pass for remaining wraps after the first join shifted newlines.
  repaired = repaired.replace(WRAPPED_MON_DATE_RE, "$1-$2");
  return repaired;
}

export function looksLikeUbaTableStatement(text: string): boolean {
  const hasTransDate = /trans(?:action)?\s*date/i.test(text);
  const hasNarration = /narration|transaction details/i.test(text);
  const hasAmountCols = /debit/i.test(text) && /credit/i.test(text);
  const hasBalance = /balance/i.test(text);
  const hasUba = /united bank.{0,20}africa|\buba\b/i.test(text);
  return (hasTransDate && hasNarration && hasAmountCols && hasBalance) || hasUba;
}

function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^--\s*\d+\s+of\s+\d+\s*--/i.test(trimmed)) return true;
  if (/^bank statement$/i.test(trimmed)) return true;
  if (/trans\s*date/i.test(trimmed) && /narration|value\s*date/i.test(trimmed)) {
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
  return /^(opening|closing)\s+balance$/i.test(merchant.trim());
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

function parseRowBlock(lines: string[]): StatementRow | null {
  const joined = lines.join(" ").replace(/\s+/g, " ").trim();
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
  const reference = refMatch?.[0];
  if (reference) {
    remainder = remainder.replace(reference, " ");
  }

  const merchant = remainder.replace(/\s+/g, " ").trim();
  if (!merchant) return null;

  const balance = amounts[amounts.length - 1] ?? 0;
  const amount =
    amounts.length >= 2 ? (amounts[amounts.length - 2] ?? balance) : balance;

  return {
    date,
    merchant,
    amount: Math.abs(amount),
    balance,
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
): "debit" | "credit" {
  if (previousBalance === undefined) {
    return inferTypeFromNarration(row.merchant);
  }

  const delta = round2(row.balance - previousBalance);
  if (Math.abs(delta - row.amount) < 0.015) return "credit";
  if (Math.abs(delta + row.amount) < 0.015) return "debit";
  if (delta > 0) return "credit";
  if (delta < 0) return "debit";
  return inferTypeFromNarration(row.merchant);
}

/**
 * Extract transactions from repaired statement text (UBA-style tables).
 * Skips opening/closing balance rows; uses running balance for DR/CR.
 */
export function extractStructuredStatementTransactions(
  text: string,
): ParsedTransaction[] {
  const repaired = repairWrappedStatementDates(text);
  const rows = collectRowBlocks(repaired)
    .map((block) => parseRowBlock(block))
    .filter((row): row is StatementRow => row !== null);

  const transactions: ParsedTransaction[] = [];
  let previousBalance: number | undefined;

  for (const row of rows) {
    if (row.isBalanceRow) {
      previousBalance = row.balance;
      continue;
    }

    const type = classifyType(row, previousBalance);
    previousBalance = row.balance;

    transactions.push({
      date: row.date,
      merchant: row.merchant,
      amount: row.amount,
      type,
      balance: row.balance,
      reference: row.reference,
      rawData: {
        source: "statement_text",
        original: row.raw,
      },
    });
  }

  return transactions;
}
