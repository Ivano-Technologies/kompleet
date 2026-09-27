export type BooksSummary = {
  income: number;
  expenses: number;
  turnover: number;
  count: number;
  uncategorized: number;
};

export async function fetchBooksSummary(
  startDate: string,
  endDate: string,
): Promise<BooksSummary> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`/api/transactions/summary?${params}`, {
    credentials: "include",
  });
  const body = (await response.json()) as BooksSummary & { error?: string };
  if (!response.ok) {
    throw new Error(body.error || "Failed to load books summary");
  }
  return {
    income: body.income ?? 0,
    expenses: body.expenses ?? 0,
    turnover: body.turnover ?? body.income ?? 0,
    count: body.count ?? 0,
    uncategorized: body.uncategorized ?? 0,
  };
}

export function formatNaira(value: number): string {
  return `₦${Math.round(value).toLocaleString("en-NG")}`;
}
