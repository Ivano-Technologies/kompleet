/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountDeletion from "../accountDeletion.js";
import type * as accounts from "../accounts.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as authLegacy from "../authLegacy.js";
import type * as authResend from "../authResend.js";
import type * as authStatus from "../authStatus.js";
import type * as backfill from "../backfill.js";
import type * as backfillCounts from "../backfillCounts.js";
import type * as categories from "../categories.js";
import type * as documents from "../documents.js";
import type * as e2eOtp from "../e2eOtp.js";
import type * as emailVerification from "../emailVerification.js";
import type * as expenses from "../expenses.js";
import type * as exports from "../exports.js";
import type * as files from "../files.js";
import type * as forms from "../forms.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as imports from "../imports.js";
import type * as invoices from "../invoices.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_authEmail from "../lib/authEmail.js";
import type * as lib_authResendLimit from "../lib/authResendLimit.js";
import type * as lib_createOrUpdateUser from "../lib/createOrUpdateUser.js";
import type * as lib_emailVerified from "../lib/emailVerified.js";
import type * as lib_eraseAccount from "../lib/eraseAccount.js";
import type * as lib_ids from "../lib/ids.js";
import type * as lib_imageMeta from "../lib/imageMeta.js";
import type * as lib_profiles from "../lib/profiles.js";
import type * as lib_triage from "../lib/triage.js";
import type * as lib_workerAuth from "../lib/workerAuth.js";
import type * as passwordReset from "../passwordReset.js";
import type * as reports from "../reports.js";
import type * as tax from "../tax.js";
import type * as tenancy from "../tenancy.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as year from "../year.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountDeletion: typeof accountDeletion;
  accounts: typeof accounts;
  audit: typeof audit;
  auth: typeof auth;
  authLegacy: typeof authLegacy;
  authResend: typeof authResend;
  authStatus: typeof authStatus;
  backfill: typeof backfill;
  backfillCounts: typeof backfillCounts;
  categories: typeof categories;
  documents: typeof documents;
  e2eOtp: typeof e2eOtp;
  emailVerification: typeof emailVerification;
  expenses: typeof expenses;
  exports: typeof exports;
  files: typeof files;
  forms: typeof forms;
  health: typeof health;
  http: typeof http;
  imports: typeof imports;
  invoices: typeof invoices;
  "lib/auth": typeof lib_auth;
  "lib/authEmail": typeof lib_authEmail;
  "lib/authResendLimit": typeof lib_authResendLimit;
  "lib/createOrUpdateUser": typeof lib_createOrUpdateUser;
  "lib/emailVerified": typeof lib_emailVerified;
  "lib/eraseAccount": typeof lib_eraseAccount;
  "lib/ids": typeof lib_ids;
  "lib/imageMeta": typeof lib_imageMeta;
  "lib/profiles": typeof lib_profiles;
  "lib/triage": typeof lib_triage;
  "lib/workerAuth": typeof lib_workerAuth;
  passwordReset: typeof passwordReset;
  reports: typeof reports;
  tax: typeof tax;
  tenancy: typeof tenancy;
  transactions: typeof transactions;
  users: typeof users;
  year: typeof year;
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
