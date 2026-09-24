"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * One-time path-B backfill from KOMPLEET Supabase (read-only).
 * Run: `npx convex run backfill/fromSupabase` after setting
 * NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY on the Convex deployment
 * (or use scripts/backfill-supabase-to-convex.mjs which calls these internals).
 * Never deletes Supabase rows.
 */
export const fromSupabase = internalAction({
  args: {
    supabaseUrl: v.optional(v.string()),
    serviceRoleKey: v.optional(v.string()),
  },
  returns: v.object({
    categories: v.number(),
    users: v.number(),
    transactions: v.number(),
    importSessions: v.number(),
    importErrors: v.number(),
    exportHistory: v.number(),
    expenseCategories: v.number(),
    sources: v.number(),
    ruleVersions: v.number(),
    taxRules: v.number(),
    documents: v.number(),
  }),
  handler: async (ctx, args) => {
    const url =
      args.supabaseUrl ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL;
    const key =
      args.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backfill",
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const counts = {
      categories: 0,
      users: 0,
      transactions: 0,
      importSessions: 0,
      importErrors: 0,
      exportHistory: 0,
      expenseCategories: 0,
      sources: 0,
      ruleVersions: 0,
      taxRules: 0,
      documents: 0,
    };

    const { data: categories, error: catErr } = await supabase
      .from("categories")
      .select("*");
    if (catErr) throw new Error(`categories: ${catErr.message}`);
    for (const row of categories ?? []) {
      await ctx.runMutation(internal.categories.upsertFromBackfill, {
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
      counts.categories += 1;
    }

    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("*");
    if (profErr) throw new Error(`profiles: ${profErr.message}`);
    for (const row of profiles ?? []) {
      const entity =
        row.entity_type === "company" ? "company" : "individual";
      await ctx.runMutation(internal.users.upsertFromBackfill, {
        externalId: String(row.id),
        email: String(row.email ?? ""),
        fullName: row.full_name ?? undefined,
        phone: row.phone ?? undefined,
        entityType: entity,
        tin: row.tin ?? undefined,
        companyName: row.company_name ?? undefined,
        rcNumber: row.rc_number ?? undefined,
        companyAddress: row.company_address ?? undefined,
        subscriptionTier: row.subscription_tier ?? undefined,
        subscriptionExpiresAt: row.subscription_expires_at ?? undefined,
        defaultCurrency: row.default_currency ?? "NGN",
        fiscalYearStart:
          typeof row.fiscal_year_start === "number"
            ? row.fiscal_year_start
            : 1,
        onboardingCompleted: Boolean(row.onboarding_completed),
        deletedAt: row.deleted_at ?? undefined,
        lastLoginAt: row.last_login_at ?? undefined,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
      });
      counts.users += 1;
    }

    const { data: sessions, error: sessErr } = await supabase
      .from("import_sessions")
      .select("*");
    if (sessErr) throw new Error(`import_sessions: ${sessErr.message}`);
    for (const row of sessions ?? []) {
      await ctx.runMutation(internal.imports.upsertSessionFromBackfill, {
        externalId: String(row.id),
        userExternalId: String(row.user_id),
        fileName: String(row.file_name ?? "unknown"),
        fileSize: typeof row.file_size === "number" ? row.file_size : undefined,
        bankCode: row.bank_code ?? undefined,
        status: String(row.status ?? "completed"),
        transactionsImported: row.transactions_imported ?? 0,
        errorsCount: row.errors_count ?? 0,
        totalAmount:
          typeof row.total_amount === "number" ? row.total_amount : undefined,
        completedAt: row.completed_at ?? undefined,
        createdAt: row.created_at ?? undefined,
      });
      counts.importSessions += 1;
    }

    const { data: errors, error: errErr } = await supabase
      .from("import_errors")
      .select("*");
    if (errErr) throw new Error(`import_errors: ${errErr.message}`);
    for (const row of errors ?? []) {
      await ctx.runMutation(internal.imports.upsertErrorFromBackfill, {
        externalId: String(row.id),
        sessionExternalId: String(row.session_id),
        rowNumber: row.row_number ?? undefined,
        errorType: row.error_type ?? undefined,
        errorMessage: row.error_message ?? undefined,
        rawData: row.raw_data ?? undefined,
        createdAt: row.created_at ?? undefined,
      });
      counts.importErrors += 1;
    }

    const { data: txns, error: txnErr } = await supabase
      .from("transactions")
      .select("*");
    if (txnErr) throw new Error(`transactions: ${txnErr.message}`);
    for (const row of txns ?? []) {
      const type = row.transaction_type === "credit" ? "credit" : "debit";
      await ctx.runMutation(internal.transactions.upsertFromBackfill, {
        externalId: String(row.id),
        userExternalId: String(row.user_id),
        transactionDate: String(row.transaction_date),
        description: String(row.description ?? ""),
        amount: Number(row.amount ?? 0),
        transactionType: type,
        balance: typeof row.balance === "number" ? row.balance : undefined,
        categoryExternalId: row.category_id ? String(row.category_id) : undefined,
        confidenceScore:
          typeof row.confidence_score === "number"
            ? row.confidence_score
            : undefined,
        source: row.source ?? undefined,
        reference: row.reference ?? undefined,
        notes: row.notes ?? undefined,
        isReconciled: Boolean(row.is_reconciled),
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
      });
      counts.transactions += 1;
    }

    const { data: exports, error: expErr } = await supabase
      .from("export_history")
      .select("*");
    if (expErr) throw new Error(`export_history: ${expErr.message}`);
    for (const row of exports ?? []) {
      await ctx.runMutation(internal.exports.upsertFromBackfill, {
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
      counts.exportHistory += 1;
    }

    const { data: expenseCats, error: expCatErr } = await supabase
      .from("expense_categories")
      .select("*");
    if (expCatErr) throw new Error(`expense_categories: ${expCatErr.message}`);
    for (const row of expenseCats ?? []) {
      await ctx.runMutation(internal.expenses.upsertExpenseCategoryFromBackfill, {
        externalId: String(row.id),
        userExternalId: row.user_id ? String(row.user_id) : undefined,
        name: String(row.name ?? "Unnamed"),
        isCustom: Boolean(row.is_custom),
        createdAt: row.created_at ?? undefined,
      });
      counts.expenseCategories += 1;
    }

    const { data: sources, error: srcErr } = await supabase
      .from("sources")
      .select("*");
    if (srcErr) throw new Error(`sources: ${srcErr.message}`);
    for (const row of sources ?? []) {
      await ctx.runMutation(internal.tax.upsertSourceFromBackfill, {
        externalId: String(row.id),
        name: String(row.name ?? "Unnamed"),
        url: row.url ?? undefined,
        createdAt: row.created_at ?? undefined,
      });
      counts.sources += 1;
    }

    const { data: versions, error: verErr } = await supabase
      .from("rule_versions")
      .select("*");
    if (verErr) throw new Error(`rule_versions: ${verErr.message}`);
    for (const row of versions ?? []) {
      await ctx.runMutation(internal.tax.upsertRuleVersionFromBackfill, {
        externalId: String(row.id),
        version: row.version_number ?? row.version ?? undefined,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at ?? undefined,
      });
      counts.ruleVersions += 1;
    }

    const { data: taxRules, error: taxErr } = await supabase
      .from("tax_rules")
      .select("*");
    if (taxErr) throw new Error(`tax_rules: ${taxErr.message}`);
    for (const row of taxRules ?? []) {
      await ctx.runMutation(internal.tax.upsertTaxRuleFromBackfill, {
        externalId: String(row.id),
        ruleVersionExternalId: String(row.rule_version_id),
        sourceExternalId: row.source_id ? String(row.source_id) : undefined,
        ruleType: String(row.rule_type ?? "unknown"),
        ruleKey: String(row.rule_key ?? "unknown"),
        ruleValue: row.rule_value ?? {},
        confidenceLevel: String(row.confidence_level ?? "unverified"),
        notes: row.notes ?? undefined,
      });
      counts.taxRules += 1;
    }

    const { data: documents, error: docErr } = await supabase
      .from("documents")
      .select("*");
    if (docErr) {
      console.warn("documents backfill skipped:", docErr.message);
    } else {
      for (const row of documents ?? []) {
        await ctx.runMutation(internal.documents.upsertFromBackfill, {
          externalId: String(row.id),
          userExternalId: String(row.user_id),
          status: row.status ?? undefined,
          idempotencyKey: row.idempotency_key ?? undefined,
          fileName: row.file_name ?? undefined,
          contentType: row.content_type ?? undefined,
          documentType: row.document_type ?? undefined,
          fileUrl: row.file_url ?? undefined,
          confidenceScore:
            typeof row.confidence_score === "number"
              ? row.confidence_score
              : undefined,
          structuredData: row.structured_data ?? undefined,
          errorMessage: row.error_message ?? undefined,
          processingStartedAt: row.processing_started_at ?? undefined,
          processingAttemptCount:
            typeof row.processing_attempt_count === "number"
              ? row.processing_attempt_count
              : undefined,
          createdAt: row.created_at ?? undefined,
          updatedAt: row.updated_at ?? undefined,
        });
        counts.documents += 1;
      }
    }

    return counts;
  },
});

const snapshotRow = v.any();

const backfillCounts = v.object({
  categories: v.number(),
  users: v.number(),
  transactions: v.number(),
  importSessions: v.number(),
  importErrors: v.number(),
  exportHistory: v.number(),
  expenseCategories: v.number(),
  sources: v.number(),
  ruleVersions: v.number(),
  taxRules: v.number(),
  documents: v.number(),
});

/**
 * Same upserts as fromSupabase, but rows are supplied by the caller
 * (read-only SQL / MCP). Used when this VM has no service-role key.
 */
export const fromSnapshot = internalAction({
  args: {
    categories: v.optional(v.array(snapshotRow)),
    profiles: v.optional(v.array(snapshotRow)),
    importSessions: v.optional(v.array(snapshotRow)),
    importErrors: v.optional(v.array(snapshotRow)),
    transactions: v.optional(v.array(snapshotRow)),
    exportHistory: v.optional(v.array(snapshotRow)),
    expenseCategories: v.optional(v.array(snapshotRow)),
    sources: v.optional(v.array(snapshotRow)),
    ruleVersions: v.optional(v.array(snapshotRow)),
    taxRules: v.optional(v.array(snapshotRow)),
    documents: v.optional(v.array(snapshotRow)),
  },
  returns: backfillCounts,
  handler: async (ctx, args) => {
    const counts = {
      categories: 0,
      users: 0,
      transactions: 0,
      importSessions: 0,
      importErrors: 0,
      exportHistory: 0,
      expenseCategories: 0,
      sources: 0,
      ruleVersions: 0,
      taxRules: 0,
      documents: 0,
    };

    for (const row of args.categories ?? []) {
      await ctx.runMutation(internal.categories.upsertFromBackfill, {
        externalId: String(row.id),
        name: String(row.name ?? "Unnamed"),
        categoryType: String(row.category_type ?? "expense"),
        taxTreatment: String(row.tax_treatment ?? "none"),
        keywords: Array.isArray(row.keywords) ? row.keywords : [],
        description: row.description ?? undefined,
        isSystem: Boolean(row.is_system ?? true),
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
      });
      counts.categories += 1;
    }

    for (const row of args.profiles ?? []) {
      await ctx.runMutation(internal.users.upsertFromBackfill, {
        externalId: String(row.id),
        email: String(row.email ?? ""),
        fullName: row.full_name ?? undefined,
        phone: row.phone ?? undefined,
        entityType: row.entity_type === "company" ? "company" : "individual",
        tin: row.tin ?? undefined,
        companyName: row.company_name ?? undefined,
        rcNumber: row.rc_number ?? undefined,
        companyAddress: row.company_address ?? undefined,
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
      counts.users += 1;
    }

    for (const row of args.importSessions ?? []) {
      await ctx.runMutation(internal.imports.upsertSessionFromBackfill, {
        externalId: String(row.id),
        userExternalId: String(row.user_id),
        fileName: String(row.file_name ?? "unknown"),
        fileSize: typeof row.file_size === "number" ? row.file_size : undefined,
        bankCode: row.bank_code ?? undefined,
        status: String(row.status ?? "completed"),
        transactionsImported: row.transactions_imported ?? 0,
        errorsCount: row.errors_count ?? 0,
        totalAmount:
          typeof row.total_amount === "number"
            ? row.total_amount
            : Number(row.total_amount ?? 0) || undefined,
        completedAt: row.completed_at ?? undefined,
        createdAt: row.created_at ?? undefined,
      });
      counts.importSessions += 1;
    }

    for (const row of args.importErrors ?? []) {
      await ctx.runMutation(internal.imports.upsertErrorFromBackfill, {
        externalId: String(row.id),
        sessionExternalId: String(row.session_id),
        rowNumber: row.row_number ?? undefined,
        errorType: row.error_type ?? undefined,
        errorMessage: row.error_message ?? undefined,
        rawData: row.raw_data ?? undefined,
        createdAt: row.created_at ?? undefined,
      });
      counts.importErrors += 1;
    }

    for (const row of args.transactions ?? []) {
      await ctx.runMutation(internal.transactions.upsertFromBackfill, {
        externalId: String(row.id),
        userExternalId: String(row.user_id),
        transactionDate: String(row.transaction_date),
        description: String(row.description ?? ""),
        amount: Number(row.amount ?? 0),
        transactionType: row.transaction_type === "credit" ? "credit" : "debit",
        balance:
          typeof row.balance === "number"
            ? row.balance
            : row.balance == null || row.balance === ""
              ? undefined
              : Number(row.balance),
        categoryExternalId: row.category_id ? String(row.category_id) : undefined,
        confidenceScore:
          typeof row.confidence_score === "number"
            ? row.confidence_score
            : undefined,
        source: row.source ?? undefined,
        reference: row.reference ?? undefined,
        notes: row.notes ?? undefined,
        isReconciled: Boolean(row.is_reconciled),
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
      });
      counts.transactions += 1;
    }

    for (const row of args.exportHistory ?? []) {
      await ctx.runMutation(internal.exports.upsertFromBackfill, {
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
      counts.exportHistory += 1;
    }

    for (const row of args.expenseCategories ?? []) {
      await ctx.runMutation(internal.expenses.upsertExpenseCategoryFromBackfill, {
        externalId: String(row.id),
        userExternalId: row.user_id ? String(row.user_id) : undefined,
        name: String(row.name ?? "Unnamed"),
        isCustom: Boolean(row.is_custom),
        createdAt: row.created_at ?? undefined,
      });
      counts.expenseCategories += 1;
    }

    for (const row of args.sources ?? []) {
      await ctx.runMutation(internal.tax.upsertSourceFromBackfill, {
        externalId: String(row.id),
        name: String(row.name ?? "Unnamed"),
        url: row.url ?? undefined,
        createdAt: row.created_at ?? undefined,
      });
      counts.sources += 1;
    }

    for (const row of args.ruleVersions ?? []) {
      await ctx.runMutation(internal.tax.upsertRuleVersionFromBackfill, {
        externalId: String(row.id),
        version: row.version_number ?? row.version ?? undefined,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at ?? undefined,
      });
      counts.ruleVersions += 1;
    }

    for (const row of args.taxRules ?? []) {
      await ctx.runMutation(internal.tax.upsertTaxRuleFromBackfill, {
        externalId: String(row.id),
        ruleVersionExternalId: String(row.rule_version_id),
        sourceExternalId: row.source_id ? String(row.source_id) : undefined,
        ruleType: String(row.rule_type ?? "unknown"),
        ruleKey: String(row.rule_key ?? "unknown"),
        ruleValue: row.rule_value ?? {},
        confidenceLevel: String(row.confidence_level ?? "unverified"),
        notes: row.notes ?? undefined,
      });
      counts.taxRules += 1;
    }

    for (const row of args.documents ?? []) {
      await ctx.runMutation(internal.documents.upsertFromBackfill, {
        externalId: String(row.id),
        userExternalId: String(row.user_id),
        status: row.status ?? undefined,
        idempotencyKey: row.idempotency_key ?? undefined,
        fileName: row.file_name ?? undefined,
        contentType: row.content_type ?? undefined,
        documentType: row.document_type ?? undefined,
        fileUrl: row.file_url ?? undefined,
        confidenceScore:
          typeof row.confidence_score === "number"
            ? row.confidence_score
            : undefined,
        structuredData: row.structured_data ?? undefined,
        errorMessage: row.error_message ?? undefined,
        processingStartedAt: row.processing_started_at ?? undefined,
        processingAttemptCount:
          typeof row.processing_attempt_count === "number"
            ? row.processing_attempt_count
            : undefined,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
      });
      counts.documents += 1;
    }

    return counts;
  },
});
