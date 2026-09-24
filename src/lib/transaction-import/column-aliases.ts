/**
 * Shared column / bank-code aliases for Nigerian bank statements.
 * Real internet-banking CSVs rarely match the exact header strings in BANK_CONFIGS.
 */

export const DATE_ALIASES = [
  "date",
  "tran date",
  "trans date",
  "trans. date",
  "transaction date",
  "value date",
  "posted date",
  "posting date",
  "txn date",
  "txn. date",
];

export const MERCHANT_ALIASES = [
  "transaction details",
  "narration",
  "description",
  "details",
  "remarks",
  "particulars",
  "narrative",
  "memo",
  "merchant",
  "transaction description",
];

export const DEBIT_ALIASES = [
  "debit",
  "withdrawal",
  "withdrawals",
  "money out",
  "dr",
  "debit amount",
  "debits",
];

export const CREDIT_ALIASES = [
  "credit",
  "deposit",
  "deposits",
  "money in",
  "cr",
  "credit amount",
  "credits",
];

export const AMOUNT_ALIASES = [
  "amount",
  "transaction amount",
  "txn amount",
  "value",
];

export const BALANCE_ALIASES = [
  "balance",
  "running balance",
  "closing balance",
  "available balance",
  "book balance",
];

export const REFERENCE_ALIASES = [
  "reference",
  "ref",
  "ref no",
  "ref no.",
  "reference number",
  "reference no",
  "transaction ref",
  "txn ref",
];

/** Common UI / legacy `bankType` values → canonical BANK_CONFIGS codes. */
export const BANK_CODE_ALIASES: Record<string, string> = {
  GTBANK: "GTB",
  GT: "GTB",
  "GUARANTY TRUST": "GTB",
  ZENITH: "ZEN",
  ACCESS: "ACC",
  FIRSTBANK: "FBN",
  "FIRST BANK": "FBN",
  FIRST: "FBN",
  FBN: "FBN",
  ECOBANK: "ECO",
  STANBIC: "SBT",
  IBTC: "SBT",
  FIDELITY: "FID",
  UNION: "UNB",
  "UNION BANK": "UNB",
  MONIEPOINT: "MON",
  TEAMAPT: "MON",
  WEMA: "WEM",
  GENERIC: "GENERIC",
  AUTO: "AUTO",
};

export function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Find the first header that matches any alias (exact, then contains).
 * Short aliases (≤ 3 chars) require an exact match to avoid "cr" ⊂ "credit".
 */
export function findMatchingHeader(
  headers: string[],
  aliases: Array<string | undefined>,
): string | undefined {
  const wanted = aliases
    .filter((alias): alias is string => Boolean(alias && alias.trim()))
    .map(normalizeHeader);
  if (wanted.length === 0 || headers.length === 0) return undefined;

  const normalized = headers.map((header) => ({
    original: header,
    norm: normalizeHeader(header),
  }));

  for (const alias of wanted) {
    const exact = normalized.find((header) => header.norm === alias);
    if (exact) return exact.original;
  }

  for (const alias of wanted) {
    if (alias.length <= 3) continue;
    const partial = normalized.find(
      (header) =>
        header.norm.length > 0 &&
        (header.norm.includes(alias) || alias.includes(header.norm)),
    );
    if (partial) return partial.original;
  }

  return undefined;
}

export function rowLooksLikeHeader(cells: string[]): boolean {
  const normalized = cells.map(normalizeHeader).filter(Boolean);
  if (normalized.length < 2) return false;

  const hasDate = DATE_ALIASES.some((alias) =>
    normalized.some((cell) => cell === alias || cell.includes(alias)),
  );
  const hasMerchant = MERCHANT_ALIASES.some((alias) =>
    normalized.some((cell) => cell === alias || cell.includes(alias)),
  );
  const amountAliases = [
    ...DEBIT_ALIASES,
    ...CREDIT_ALIASES,
    ...AMOUNT_ALIASES,
  ];
  const hasAmount = amountAliases.some((alias) =>
    normalized.some(
      (cell) =>
        cell === alias || (alias.length > 3 && cell.includes(alias)),
    ),
  );

  return hasDate && (hasMerchant || hasAmount);
}

export function detectDelimiter(content: string): string {
  const firstNonEmpty =
    content.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const commas = (firstNonEmpty.match(/,/g) ?? []).length;
  const semis = (firstNonEmpty.match(/;/g) ?? []).length;
  const tabs = (firstNonEmpty.match(/\t/g) ?? []).length;
  if (semis > commas && semis >= tabs) return ";";
  if (tabs > commas && tabs >= semis) return "\t";
  return ",";
}

export function stripBom(content: string): string {
  return content.replace(/^\uFEFF/, "");
}
