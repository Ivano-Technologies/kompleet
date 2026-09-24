import type { ConvexHttpClient } from "convex/browser";
import { listAllTransactionsMine } from "./money-lists";

export type StatementTransaction = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "debit" | "credit";
  category_id?: string;
  category?: {
    id: string;
    name: string;
    category_type: string;
    tax_treatment: string;
    type: "income" | "expense" | "asset" | "liability";
  };
};

function asCategoryType(
  value: string,
): "income" | "expense" | "asset" | "liability" {
  if (
    value === "income" ||
    value === "expense" ||
    value === "asset" ||
    value === "liability"
  ) {
    return value;
  }
  return "expense";
}

export async function listStatementTransactions(
  convex: ConvexHttpClient,
  filters: { startDate?: string; endDate?: string } = {},
): Promise<StatementTransaction[]> {
  const { transactions } = await listAllTransactionsMine(convex, filters);
  return transactions.map((t) => ({
    id: t.id,
    transaction_date: t.transaction_date,
    description: t.description,
    amount: t.amount,
    transaction_type: t.transaction_type === "credit" ? "credit" : "debit",
    category_id: t.category_id ?? undefined,
    category: t.category
      ? {
          id: t.category.id,
          name: t.category.name,
          category_type: t.category.category_type,
          tax_treatment: t.category.tax_treatment,
          type: asCategoryType(t.category.category_type),
        }
      : undefined,
  }));
}
