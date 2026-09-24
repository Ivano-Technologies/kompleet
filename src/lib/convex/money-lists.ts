import type { ConvexHttpClient } from "convex/browser";
import { api } from "./http";

const EXPORT_PAGE_SIZE = 50000;

export async function listAllTransactionsMine(
  convex: ConvexHttpClient,
  filters: {
    startDate?: string;
    endDate?: string;
    type?: "debit" | "credit";
    search?: string;
  } = {},
) {
  return convex.query(api.transactions.listMine, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    type: filters.type,
    search: filters.search,
    page: 1,
    limit: EXPORT_PAGE_SIZE,
  });
}

export async function listAllExpensesMine(
  convex: ConvexHttpClient,
  filters: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
  } = {},
) {
  return convex.query(api.expenses.listMine, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    categoryId: filters.categoryId,
    page: 1,
    limit: EXPORT_PAGE_SIZE,
  });
}
