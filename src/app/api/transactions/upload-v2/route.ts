import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
/**
 * Transaction Upload API v2 (Sprint 5)
 * POST /api/transactions/upload-v2
 * Enhanced with 10-bank support, duplicate detection, balance validation
 * Path B: import sessions + transactions persist in Convex.
 */

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
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
    const { convex } = await requireAuthedConvex(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bankCode = (formData.get("bankCode") as string)?.toUpperCase();
    const password = (formData.get("password") as string)?.trim() || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!bankCode || !isValidBankCode(bankCode)) {
      return NextResponse.json({ error: "Invalid bank code" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 },
      );
    }

    let fileType: "csv" | "excel" | "pdf";
    try {
      fileType = detectFileType(file.name, file.type);
    } catch {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload CSV, Excel, or PDF files.",
        },
        { status: 400 },
      );
    }

    const session = await convex.mutation(api.imports.createSession, {
      fileName: file.name,
      fileSize: file.size,
      bankCode,
      status: "processing",
    });

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const content = fileType === "csv" ? buffer.toString("utf-8") : buffer;

      let parseResult: Awaited<ReturnType<typeof parseBankStatement>>;
      try {
        parseResult = await parseBankStatement(
          content,
          bankCode,
          fileType,
          password,
        );
      } catch (parseError) {
        const errMsg =
          parseError instanceof Error ? parseError.message : String(parseError);
        if (errMsg === "PASSWORD_REQUIRED") {
          await convex.mutation(api.imports.updateSession, {
            externalId: session.id,
            status: "failed",
          });
          return NextResponse.json(
            {
              error:
                "This file is password-protected. Please provide the password.",
              requiresPassword: true,
            },
            { status: 400 },
          );
        }
        throw parseError;
      }

      if (parseResult.errors.length > 0) {
        await convex.mutation(api.imports.addErrors, {
          sessionExternalId: session.id,
          errors: parseResult.errors.map((error) => ({
            rowNumber: error.rowNumber,
            errorType: error.errorType,
            errorMessage: error.errorMessage,
            rawData: error.rawData,
          })),
        });
      }

      if (parseResult.transactions.length === 0) {
        await convex.mutation(api.imports.updateSession, {
          externalId: session.id,
          status: "failed",
          errorsCount: parseResult.errors.length,
        });

        return NextResponse.json(
          {
            error: "No valid transactions found",
            errors: parseResult.errors,
          },
          { status: 400 },
        );
      }

      const normalizedTransactions = normalizeTransactions(
        parseResult.transactions,
        bankCode,
      );

      const balanceValidation = validateBalances(normalizedTransactions);

      if (!balanceValidation.valid) {
        console.warn("Balance validation failed:", balanceValidation.errors);
      }

      const existingPage = await convex.query(api.transactions.listMine, {
        page: 1,
        limit: 500,
      });
      const existingTransactions = existingPage.transactions.map((t) => ({
        id: t.id,
        date: t.transaction_date,
        merchant: t.description,
        amount: t.amount,
        type: t.transaction_type as "debit" | "credit",
        balance: t.balance ?? 0,
        reference: t.reference ?? undefined,
        metadata: {},
      }));

      const duplicates = findDuplicates(
        existingTransactions,
        normalizedTransactions,
      );

      if (duplicates.length > 0) {
        await convex.mutation(api.imports.addDuplicates, {
          sessionExternalId: session.id,
          candidates: duplicates.map((dup) => ({
            existing_transaction_id: dup.existingTransaction.id,
            new_transaction_data: dup.newTransaction,
            similarity_score: dup.similarityScore,
            match_factors: dup.matchFactors,
            status: "pending",
          })),
        });
      }

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

      const importedTransactions = await convex.mutation(
        api.transactions.createManyMine,
        {
          items: transactionsToImport.map((t) => ({
            transactionDate: t.date,
            description: t.merchant,
            amount: t.amount,
            transactionType: t.type,
            balance: t.balance,
            reference: t.reference,
            source: `${bankCode}_import`,
          })),
        },
      );

      await convex.mutation(api.imports.updateSession, {
        externalId: session.id,
        status: "completed",
        transactionsImported: importedTransactions.length,
        totalAmount: transactionsToImport.reduce((sum, t) => sum + t.amount, 0),
        errorsCount: parseResult.errors.length,
        completed: true,
      });

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        imported: importedTransactions.length,
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
      await convex.mutation(api.imports.updateSession, {
        externalId: session.id,
        status: "failed",
      });
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        {
          error: errMsg,
          message: errMsg,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        {
          error: "Please sign in to upload bank statements",
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message, message }, { status: 500 });
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "import", resourceType: "transactions" }),
  { limit: 20 },
);
