#!/usr/bin/env node
/**
 * Idempotent path-B backfill: KOMPLEET Supabase → Convex.
 * READ-ONLY against Supabase. No deletes.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CONVEX_DEPLOYMENT (or a working `npx convex run`)
 *
 * Usage:
 *   node scripts/backfill-supabase-to-convex.mjs
 */
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read-only).",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function runConvex(fn, args) {
  const result = spawnSync(
    "npx",
    ["convex", "run", fn, JSON.stringify(args)],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.status !== 0) {
    throw new Error(
      `${fn} failed: ${result.stderr || result.stdout || result.status}`,
    );
  }
  return result.stdout;
}

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

const checksum = { users: 0, transactions: 0, amount: 0 };

const categories = await fetchAll("categories");
for (const row of categories) {
  runConvex("internal.categories.upsertFromBackfill", {
    externalId: String(row.id),
    name: String(row.name ?? "Unnamed"),
    categoryType: String(row.category_type ?? row.category_group ?? "expense"),
    taxTreatment: String(row.tax_treatment ?? "none"),
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    description: row.description ?? undefined,
    isSystem: Boolean(row.is_system ?? true),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  });
}

const profiles = await fetchAll("profiles");
for (const row of profiles) {
  runConvex("internal.users.upsertFromBackfill", {
    externalId: String(row.id),
    email: String(row.email ?? ""),
    fullName: row.full_name ?? undefined,
    phone: row.phone ?? undefined,
    entityType: row.entity_type === "company" ? "company" : "individual",
    tin: row.tin ?? undefined,
    companyName: row.company_name ?? undefined,
    rcNumber: row.rc_number ?? undefined,
    companyAddress: row.company_address ?? undefined,
    subscriptionTier: row.subscription_tier ?? undefined,
    subscriptionExpiresAt: row.subscription_expires_at ?? undefined,
    defaultCurrency: row.default_currency ?? "NGN",
    fiscalYearStart:
      typeof row.fiscal_year_start === "number" ? row.fiscal_year_start : 1,
    onboardingCompleted: Boolean(row.onboarding_completed),
    deletedAt: row.deleted_at ?? undefined,
    lastLoginAt: row.last_login_at ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  });
  checksum.users += 1;
}

const sessions = await fetchAll("import_sessions");
for (const row of sessions) {
  runConvex("internal.imports.upsertSessionFromBackfill", {
    externalId: String(row.id),
    userExternalId: String(row.user_id),
    fileName: String(row.file_name ?? "unknown"),
    fileSize: typeof row.file_size === "number" ? row.file_size : undefined,
    bankCode: row.bank_code ?? undefined,
    status: String(row.status ?? "completed"),
    transactionsImported: row.transactions_imported ?? 0,
    errorsCount: row.errors_count ?? 0,
    totalAmount: typeof row.total_amount === "number" ? row.total_amount : undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at ?? undefined,
  });
}

const errors = await fetchAll("import_errors");
for (const row of errors) {
  runConvex("internal.imports.upsertErrorFromBackfill", {
    externalId: String(row.id),
    sessionExternalId: String(row.session_id),
    rowNumber: row.row_number ?? undefined,
    errorType: row.error_type ?? undefined,
    errorMessage: row.error_message ?? undefined,
    rawData: row.raw_data ?? undefined,
    createdAt: row.created_at ?? undefined,
  });
}

const txns = await fetchAll("transactions");
for (const row of txns) {
  runConvex("internal.transactions.upsertFromBackfill", {
    externalId: String(row.id),
    userExternalId: String(row.user_id),
    transactionDate: String(row.transaction_date),
    description: String(row.description ?? ""),
    amount: Number(row.amount ?? 0),
    transactionType: row.transaction_type === "credit" ? "credit" : "debit",
    balance: typeof row.balance === "number" ? row.balance : undefined,
    categoryExternalId: row.category_id ? String(row.category_id) : undefined,
    confidenceScore:
      typeof row.confidence_score === "number" ? row.confidence_score : undefined,
    source: row.source ?? undefined,
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
    isReconciled: Boolean(row.is_reconciled),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  });
  checksum.transactions += 1;
  checksum.amount += Number(row.amount ?? 0);
}

const exports = await fetchAll("export_history");
for (const row of exports) {
  runConvex("internal.exports.upsertFromBackfill", {
    externalId: String(row.id),
    userExternalId: String(row.user_id),
    exportType: String(row.export_type ?? "unknown"),
    format: row.format ?? undefined,
    taxYear: typeof row.tax_year === "number" ? row.tax_year : undefined,
    status: String(row.status ?? "completed"),
    fileSize: typeof row.file_size === "number" ? row.file_size : undefined,
    expiresAt: row.expires_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at ?? undefined,
  });
}

console.log("Backfill complete (Supabase unchanged).");
console.log(
  JSON.stringify(
    {
      users: checksum.users,
      transactions: checksum.transactions,
      sumAmount: checksum.amount,
      categories: categories.length,
      importSessions: sessions.length,
      importErrors: errors.length,
      exportHistory: exports.length,
    },
    null,
    2,
  ),
);
