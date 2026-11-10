/**
 * Deterministic extraction for Nigerian PDF bank statements.
 *
 * UBA (PDFsharp/MigraDoc) wraps `10-Mar-2024` across lines (`10-Mar-` + `2024`)
 * and splits narrations. The line-oriented regex fallback never sees a full
 * date+amount pair, so import returns zero rows unless an LLM is available
 * and succeeds. This module repairs wraps and groups multi-line rows.
 *
 * GTB (Guaranty Trust Bank) PDFs add three extra artefacts: leading `'0` /
 * `'00` fragments on fields, page-footer blocks merged into the last
 * narration on a page, and Debit/Credit/Balance columns that pdfjs can emit
 * in the wrong order. GTB-only cleanup is gated on statement detection so
 * other banks' narrations are left intact.
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
const REFERENCE_RE = /\b\d{12,}\b/;
const GTB_REFERENCE_RE = /\b\d{12,}\b|\b[A-Z]{2,}\d{10,}\b/;
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

export interface StatementExtractOptions {
  bankName?: string;
}

const YEAR_LEAD_LINE_RE =
  /^((?:20|19)\d{2})(?:\s+((?:20|19)\d{2}))?(?:\s+(.*))?$/;

/**
 * Newer GTB head-office footer, as a single contiguous block (Plot 635,
 * Akin Adesola … optional tel / 0700-GTBANK / +234 / website / plc line).
 */
const GTB_HEAD_OFFICE_FOOTER_BLOCK_RE =
  /plot\s+\d+,?\s*akin\s+adesola\s+street,?\s*victoria\s+island,?\s*lagos(?:[\s,;:]+(?:tel:?\s*)?(?:0700[-\s]?gtbank(?:\s*\(\s*0700[-\s]?\d+\s*\))?|\+234[\s-]*1[\s-]*448[\s-]*\d{3,4}|(?:www\.)?gtbank\.com|guaranty\s+trust\s+bank\s+plc(?:\s*rc\s*\d+)?))*/gi;

/**
 * 2016–2021 GTB email footer, from "This is a computer generated" through
 * "your local branch.", plus a trailing lone page number when present.
 */
const GTB_LEGACY_FOOTER_BLOCK_RE =
  /this is a computer generated(?:\s+email)?\.?\s*please address all enquiries to\s+guaranty trust bank plc systems and control group\s+178,?\s*awolowo road,?\s*ikoyi\.?\s*p\.?\s*o\.?\s*box\s+\d+,?\s*victoria island,?\s*lagos,?\s*nigeria\.?\s*phone\s+0?1[-\s]?2694276\s*\|?\s*fax\s+0?1[-\s]?2694276(?:\s+or the customer information unit of your local branch\.?)?(?:\n\s*\d{1,3}\s*(?=\n|$))?/gi;

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
 * Remove GTB page footers only as whole contiguous blocks, never by eating
 * address or phone tokens out of a real narration.
 */
export function stripMergedPageFooter(value: string): string {
  GTB_HEAD_OFFICE_FOOTER_BLOCK_RE.lastIndex = 0;
  GTB_LEGACY_FOOTER_BLOCK_RE.lastIndex = 0;
  return value
    .replace(GTB_HEAD_OFFICE_FOOTER_BLOCK_RE, " ")
    .replace(GTB_LEGACY_FOOTER_BLOCK_RE, " ")
    .replace(/[^\S\r\n]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n");
}

function cleanParsedField(value: string, applyGtb: boolean): string {
  const stripped = applyGtb ? stripLeadingQuoteZeroFragments(value) : value;
  return stripped.replace(/\s+/g, " ").trim();
}

export function looksLikeUbaTableStatement(text: string): boolean {
  const hasTransDate = /trans(?:action)?\s*date/i.test(text);
  const hasNarration = /narration|transaction details/i.test(text);
  const hasAmountCols = /debit/i.test(text) && /credit/i.test(text);
  const hasBalance = /balance/i.test(text);
  const hasUba = /united bank.{0,20}africa|\buba\b/i.test(text);
  return (hasTransDate && hasNarration && hasAmountCols && hasBalance) || hasUba;
}

/**
 * Letterhead only: lines before the first posted (dated) row. A transfer
 * "TO GUARANTY TRUST BANK PLC/…" in another bank's narration must not
 * trigger GTB artefact cleanup.
 */
function statementLetterhead(text: string): string {
  const lines = text.split(/\r?\n/);
  const header: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      DATE_AT_START_RE.test(trimmed) &&
      !/opening\s+balance/i.test(trimmed)
    ) {
      break;
    }
    header.push(line);
    if (header.join("\n").length >= 1500) break;
  }
  return header.join("\n");
}

function headerHasGtbIssuer(header: string): boolean {
  if (/\bgtbank\b/i.test(header)) return true;
  // Letterhead "Guaranty Trust Bank", not "TO/FROM GUARANTY TRUST BANK".
  return /(?<!to\s)(?<!from\s)guaranty\s+trust\s+bank/i.test(header);
}

export function looksLikeGtbTableStatement(text: string): boolean {
  const header = statementLetterhead(text);
  if (!headerHasGtbIssuer(header)) return false;
  if (/united bank.{0,20}africa/i.test(header)) return false;
  const hasAmountCols = /debit/i.test(text) && /credit/i.test(text);
  const hasBalance = /balance/i.test(text);
  const hasDateCol = /(?:trans(?:action)?\s*)?date/i.test(text);
  return hasAmountCols && hasBalance && hasDateCol;
}

function isGtbBankHint(bankName?: string): boolean {
  if (!bankName) return false;
  const trimmed = bankName.trim();
  return /gtbank|guaranty\s+trust/i.test(trimmed) || /^gtb$/i.test(trimmed);
}

function shouldApplyGtbCleanup(
  text: string,
  bankName?: string,
): boolean {
  return looksLikeGtbTableStatement(text) || isGtbBankHint(bankName);
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

  // No opening row: two tokens in swapped order print the large balance first.
  if (last > 0 && secondLast > last * 10) {
    return { amount: last, balance: secondLast };
  }

  return { amount: secondLast, balance: last };
}

function parseRowBlock(
  lines: string[],
  applyGtb: boolean,
): StatementRow | null {
  const joined = cleanParsedField(lines.join(" "), applyGtb);
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

  const referenceRe = applyGtb ? GTB_REFERENCE_RE : REFERENCE_RE;
  const refMatch = remainder.match(referenceRe);
  const reference = refMatch?.[0]
    ? cleanParsedField(refMatch[0], applyGtb)
    : undefined;
  if (refMatch?.[0]) {
    remainder = remainder.replace(refMatch[0], " ");
  }

  const merchant = cleanParsedField(remainder, applyGtb);
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
 * GTB artefact cleanup runs only when the text (or bank hint) is GTB.
 */
export function extractStructuredStatementTransactions(
  text: string,
  options?: StatementExtractOptions,
): ParsedTransaction[] {
  const repaired = repairWrappedStatementDates(text);
  const applyGtb = shouldApplyGtbCleanup(repaired, options?.bankName);
  const prepared = applyGtb
    ? stripMergedPageFooter(stripLeadingQuoteZeroFragments(repaired))
    : repaired;
  const rows = collectRowBlocks(prepared)
    .map((block) => parseRowBlock(block, applyGtb))
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
