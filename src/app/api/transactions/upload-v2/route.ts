import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
/**
 * Transaction Upload API v2 (Sprint 5)
 * POST /api/transactions/upload-v2
 * Enhanced with 10-bank support, duplicate detection, balance validation
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createClient } from "@/lib/supabase/server";
import {
  parseBankStatement,
  detectFileType,
  isValidBankCode,
} from "@/lib/transaction-import/bank-adapter";
import { normalizeTransactions } from "@/lib/transaction-import/normalizer";
import { validateBalances } from "@/lib/transaction-import/balance-validator";
import { findDuplicates } from "@/lib/transaction-import/duplicate-detector";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bankCode = (formData.get("bankCode") as string)?.toUpperCase();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!bankCode || !isValidBankCode(bankCode)) {
      return NextResponse.json({ error: "Invalid bank code" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 },
      );
    }

    // Detect file type
    let fileType: "csv" | "excel" | "pdf";
    try {
      fileType = detectFileType(file.name, file.type);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload CSV, Excel, or PDF files.",
        },
        { status: 400 },
      );
    }

    // Create import session
    const { data: session, error: sessionError } = await supabase
      .from("import_sessions")
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        bank_code: bankCode,
        status: "processing",
      })
      .select()
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Failed to create import session" },
        { status: 500 },
      );
    }

    try {
      // Read file content
      const buffer = Buffer.from(await file.arrayBuffer());
      const content = fileType === "csv" ? buffer.toString("utf-8") : buffer;

      // PDF files work with any bank code (LLM handles format detection)
      // For CSV/Excel, bank config is required

      // Parse bank statement
      const parseResult = await parseBankStatement(content, bankCode, fileType);

      if (parseResult.errors.length > 0) {
        // Log errors
        await supabase.from("import_errors").insert(
          parseResult.errors.map((error) => ({
            session_id: session.id,
            row_number: error.rowNumber,
            error_type: error.errorType,
            error_message: error.errorMessage,
            raw_data: error.rawData,
          })),
        );
      }

      if (parseResult.transactions.length === 0) {
        await supabase
          .from("import_sessions")
          .update({ status: "failed", errors_count: parseResult.errors.length })
          .eq("id", session.id);

        return NextResponse.json(
          {
            error: "No valid transactions found",
            errors: parseResult.errors,
          },
          { status: 400 },
        );
      }

      // Normalize transactions
      const normalizedTransactions = normalizeTransactions(
        parseResult.transactions,
        bankCode,
      );

      // Validate balances
      const balanceValidation = validateBalances(normalizedTransactions);

      if (!balanceValidation.valid) {
        console.warn("Balance validation failed:", balanceValidation.errors);
      }

      // Fetch existing transactions for duplicate detection
      const { data: existingTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id);

      // Find duplicates
      const duplicates = findDuplicates(
        existingTransactions || [],
        normalizedTransactions,
      );

      // Store duplicate candidates
      if (duplicates.length > 0) {
        await supabase.from("duplicate_candidates").insert(
          duplicates.map((dup) => ({
            session_id: session.id,
            existing_transaction_id: dup.existingTransaction.id!,
            new_transaction_data: dup.newTransaction,
            similarity_score: dup.similarityScore,
            match_factors: dup.matchFactors,
            status: "pending",
          })),
        );
      }

      // Filter out high-confidence duplicates (>95%)
      const highConfidenceDuplicates = duplicates.filter(
        (d) => d.similarityScore >= 0.95,
      );
      const transactionsToImport = normalizedTransactions.filter(
        (t) =>
          !highConfidenceDuplicates.some(
            (d) =>
              d.newTransaction.date === t.date &&
              d.newTransaction.amount === t.amount &&
              d.newTransaction.merchant === t.merchant,
          ),
      );

      // Import transactions
      const { data: importedTransactions, error: importError } = await supabase
        .from("transactions")
        .insert(
          transactionsToImport.map((t) => ({
            user_id: user.id,
            transaction_date: t.date,
            description: t.merchant,
            amount: t.amount,
            transaction_type: t.type,
            balance: t.balance,
            reference: t.reference,
            source: `${bankCode}_import`,
            metadata: t.metadata,
          })),
        )
        .select();

      if (importError) {
        throw importError;
      }

      // Update session
      await supabase
        .from("import_sessions")
        .update({
          status: "completed",
          transactions_imported: importedTransactions?.length || 0,
          total_amount: transactionsToImport.reduce(
            (sum, t) => sum + t.amount,
            0,
          ),
          errors_count: parseResult.errors.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        imported: importedTransactions?.length || 0,
        duplicates: highConfidenceDuplicates.length,
        pendingReview: duplicates.length - highConfidenceDuplicates.length,
        errors: parseResult.errors.length,
        balanceValidation: {
          valid: balanceValidation.valid,
          openingBalance: balanceValidation.openingBalance,
          closingBalance: balanceValidation.closingBalance,
          discrepancy: balanceValidation.discrepancy,
        },
      });
    } catch (error) {
      console.error("Import error:", error);

      // Update session status
      await supabase
        .from("import_sessions")
        .update({ status: "failed" })
        .eq("id", session.id);

      return NextResponse.json(
        {
          error: "Import failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// Apply rate limiting + audit logging
export const POST = withRateLimit(
  withAudit(handlePOST, { action: "import", resourceType: "transactions" }),
  { limit: 20 },
);
