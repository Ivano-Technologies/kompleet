import { createServerClient as createClient } from "@/lib/supabase/server";

export interface MigrationOptions {
  sourceYear: number;
  targetYear: number;
  includeTransactions: boolean;
  includeCategories: boolean;
  includeForms: boolean;
  dryRun: boolean;
}

export interface MigrationResult {
  success: boolean;
  transactionsCopied: number;
  categoriesCopied: number;
  formsCopied: number;
  errors: string[];
  dryRun: boolean;
}

export async function migrateYearData(
  userId: string,
  options: MigrationOptions,
): Promise<MigrationResult> {
  const supabase = await createClient();
  const result: MigrationResult = {
    success: true,
    transactionsCopied: 0,
    categoriesCopied: 0,
    formsCopied: 0,
    errors: [],
    dryRun: options.dryRun,
  };

  try {
    // Log migration start
    const migrationLogId = await logMigrationStart(userId, options);

    // Migrate transactions
    if (options.includeTransactions) {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("tax_year", options.sourceYear);

      if (error) {
        result.errors.push(`Failed to fetch transactions: ${error.message}`);
        result.success = false;
      } else if (transactions && transactions.length > 0) {
        if (!options.dryRun) {
          const newTransactions = transactions.map((t) => ({
            ...t,
            id: undefined, // Let DB generate new ID
            tax_year: options.targetYear,
            created_at: undefined,
            updated_at: undefined,
          }));

          const { error: insertError } = await supabase
            .from("transactions")
            .insert(newTransactions);

          if (insertError) {
            result.errors.push(
              `Failed to insert transactions: ${insertError.message}`,
            );
            result.success = false;
          } else {
            result.transactionsCopied = transactions.length;
          }
        } else {
          result.transactionsCopied = transactions.length;
        }
      }
    }

    // Migrate categories
    if (options.includeCategories) {
      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .eq("tax_year", options.sourceYear);

      if (error) {
        result.errors.push(`Failed to fetch categories: ${error.message}`);
        result.success = false;
      } else if (categories && categories.length > 0) {
        if (!options.dryRun) {
          const newCategories = categories.map((c) => ({
            ...c,
            id: undefined,
            tax_year: options.targetYear,
            created_at: undefined,
            updated_at: undefined,
          }));

          const { error: insertError } = await supabase
            .from("categories")
            .insert(newCategories);

          if (insertError) {
            result.errors.push(
              `Failed to insert categories: ${insertError.message}`,
            );
            result.success = false;
          } else {
            result.categoriesCopied = categories.length;
          }
        } else {
          result.categoriesCopied = categories.length;
        }
      }
    }

    // Migrate forms
    if (options.includeForms) {
      const { data: forms, error } = await supabase
        .from("nrs_forms")
        .select("*")
        .eq("user_id", userId)
        .eq("tax_year", options.sourceYear);

      if (error) {
        result.errors.push(`Failed to fetch forms: ${error.message}`);
        result.success = false;
      } else if (forms && forms.length > 0) {
        if (!options.dryRun) {
          const newForms = forms.map((f) => ({
            ...f,
            id: undefined,
            tax_year: options.targetYear,
            status: "draft", // Reset status for new year
            created_at: undefined,
            updated_at: undefined,
            filed_at: null,
          }));

          const { error: insertError } = await supabase
            .from("nrs_forms")
            .insert(newForms);

          if (insertError) {
            result.errors.push(
              `Failed to insert forms: ${insertError.message}`,
            );
            result.success = false;
          } else {
            result.formsCopied = forms.length;
          }
        } else {
          result.formsCopied = forms.length;
        }
      }
    }

    // Log migration completion
    await logMigrationComplete(migrationLogId, result);

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return result;
  }
}

async function logMigrationStart(
  userId: string,
  options: MigrationOptions,
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("data_migration_logs")
    .insert({
      user_id: userId,
      source_year: options.sourceYear,
      target_year: options.targetYear,
      migration_type: "year_copy",
      status: "in_progress",
      dry_run: options.dryRun,
      options: {
        includeTransactions: options.includeTransactions,
        includeCategories: options.includeCategories,
        includeForms: options.includeForms,
      },
    })
    .select("id")
    .single();

  return data?.id || "";
}

async function logMigrationComplete(
  migrationLogId: string,
  result: MigrationResult,
) {
  const supabase = await createClient();

  await supabase
    .from("data_migration_logs")
    .update({
      status: result.success ? "completed" : "failed",
      records_migrated:
        result.transactionsCopied +
        result.categoriesCopied +
        result.formsCopied,
      error_message: result.errors.length > 0 ? result.errors.join("; ") : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", migrationLogId);
}

export async function rollbackMigration(
  userId: string,
  targetYear: number,
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Delete all data for target year (rollback)
    await supabase
      .from("transactions")
      .delete()
      .eq("user_id", userId)
      .eq("tax_year", targetYear);
    await supabase
      .from("categories")
      .delete()
      .eq("user_id", userId)
      .eq("tax_year", targetYear);
    await supabase
      .from("nrs_forms")
      .delete()
      .eq("user_id", userId)
      .eq("tax_year", targetYear);

    return true;
  } catch (error) {
    console.error("Rollback failed:", error);
    return false;
  }
}
