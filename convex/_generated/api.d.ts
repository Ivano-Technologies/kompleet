/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as backfill from "../backfill.js";
import type * as backfillCounts from "../backfillCounts.js";
import type * as categories from "../categories.js";
import type * as documents from "../documents.js";
import type * as expenses from "../expenses.js";
import type * as exports from "../exports.js";
import type * as files from "../files.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as imports from "../imports.js";
import type * as invoices from "../invoices.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_ids from "../lib/ids.js";
import type * as passwordReset from "../passwordReset.js";
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
  accounts: typeof accounts;
  audit: typeof audit;
  auth: typeof auth;
  backfill: typeof backfill;
  backfillCounts: typeof backfillCounts;
  categories: typeof categories;
  documents: typeof documents;
  expenses: typeof expenses;
  exports: typeof exports;
  files: typeof files;
  health: typeof health;
  http: typeof http;
  imports: typeof imports;
  invoices: typeof invoices;
  "lib/auth": typeof lib_auth;
  "lib/ids": typeof lib_ids;
  passwordReset: typeof passwordReset;
  tax: typeof tax;
  tenancy: typeof tenancy;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
