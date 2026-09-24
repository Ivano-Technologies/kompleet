/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as audit from "../audit.js";
import type * as backfill from "../backfill.js";
import type * as categories from "../categories.js";
import type * as documents from "../documents.js";
import type * as expenses from "../expenses.js";
import type * as exports_ from "../exports.js";
import type * as health from "../health.js";
import type * as imports from "../imports.js";
import type * as invoices from "../invoices.js";
import type * as tax from "../tax.js";
import type * as tenancy from "../tenancy.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  audit: typeof audit;
  backfill: typeof backfill;
  categories: typeof categories;
  documents: typeof documents;
  expenses: typeof expenses;
  exports: typeof exports_;
  health: typeof health;
  imports: typeof imports;
  invoices: typeof invoices;
  tax: typeof tax;
  tenancy: typeof tenancy;
  transactions: typeof transactions;
  users: typeof users;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
export declare const components: {};
