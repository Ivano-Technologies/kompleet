export type BooksLedgerRow = {
  transaction_type: string;
  amount: number;
  category_id?: string | null;
  category?: { id: string } | null;
  confidence_score?: number | null;
};

export type BooksSummaryPayload = {
  income: number;
  expenses: number;
  turnover: number;
  count: number;
  uncategorized: number;
};

export function emptyBooksSummary(): BooksSummaryPayload {
  return {
    income: 0,
    expenses: 0,
    turnover: 0,
    count: 0,
    uncategorized: 0,
  };
}

function isUncategorized(row: BooksLedgerRow): boolean {
  const hasCategory = Boolean(row.category_id || row.category);
  if (!hasCategory) return true;
  return (
    typeof row.confidence_score === "number" && row.confidence_score < 80
  );
}

/** Aggregate imported books for Tax generate-from-books chips. */
export function summarizeBooksTransactions(
  rows: BooksLedgerRow[],
): BooksSummaryPayload {
  let income = 0;
  let expenses = 0;
  let uncategorized = 0;
  for (const row of rows) {
    const amount = Number(row.amount);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    if (row.transaction_type === "credit") income += safeAmount;
    else expenses += safeAmount;
    if (isUncategorized(row)) uncategorized += 1;
  }
  return {
    income,
    expenses,
    turnover: income,
    count: rows.length,
    uncategorized,
  };
}
