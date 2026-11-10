import type { ConvexHttpClient } from "convex/browser";
import { collectPagedItems, EXPORT_BATCH, EXPORT_MAX } from "./collect-pages";
import { api } from "./http";

type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  type?: "debit" | "credit";
  search?: string;
  categoryId?: string;
};

type ExpenseFilters = {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
};

export async function listAllTransactionsMine(
  convex: ConvexHttpClient,
  filters: TransactionFilters = {},
  opts: { maxItems?: number; batch?: number } = {},
) {
  const batch = opts.batch ?? EXPORT_BATCH;
  const maxItems = opts.maxItems ?? EXPORT_MAX;
  const transactions = await collectPagedItems(
    async (cursor) => {
      const page = await convex.query(api.transactions.listMine, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type,
        search: filters.search,
        categoryId: filters.categoryId,
        cursor,
        limit: batch,
      });
      return {
        items: page.transactions,
        isDone: page.isDone,
        nextCursor: page.nextCursor,
      };
    },
    maxItems,
  );
  return { transactions, total: transactions.length };
}

export async function listAllExpensesMine(
  convex: ConvexHttpClient,
  filters: ExpenseFilters = {},
  opts: { maxItems?: number; batch?: number } = {},
) {
  const batch = opts.batch ?? EXPORT_BATCH;
  const maxItems = opts.maxItems ?? EXPORT_MAX;
  const expenses = await collectPagedItems(
    async (cursor) => {
      const page = await convex.query(api.expenses.listMine, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        categoryId: filters.categoryId,
        cursor,
        limit: batch,
      });
      return {
        items: page.expenses,
        isDone: page.isDone,
        nextCursor: page.nextCursor,
      };
    },
    maxItems,
  );
  return { expenses, total: expenses.length };
}
