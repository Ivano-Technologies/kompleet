/**
 * Legacy POST /api/transactions/upload
 * Live UI uses upload-v2; this route stays for older clients and now
 * persists through the same Convex-only parser + createManyMine path.
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import {
  parseBankStatement,
  detectFileType,
} from "@/lib/transaction-import/bank-adapter";
import { resolveBankCode } from "@/lib/transaction-import/bank-configs";
import { normalizeTransactions } from "@/lib/transaction-import/normalizer";
import { toFriendlyErrorAndFlush } from "@/lib/friendly-error";
import {
  ImportPersistError,
  completeImportSessionWithRetry,
  markImportSessionFailed,
  persistImportedTransactions,
} from "@/lib/transaction-import/import-persist";

export const runtime = "nodejs";
export const maxDuration = 60;

interface UploadResponse {
  success: boolean;
  message: string;
  imported: number;
  duplicates: number;
  errors: number;
  sessionStatus?: "completed" | "processing";
  needsFinalize?: boolean;
}

async function handlePOST(
  request: NextRequest,
): Promise<NextResponse<UploadResponse>> {
  try {
    const { convex } = await requireAuthedConvex(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bankCode =
      resolveBankCode(
        (formData.get("bankCode") as string | null) ??
          (formData.get("bankType") as string | null) ??
          "AUTO",
      ) ?? "AUTO";

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
          imported: 0,
          duplicates: 0,
          errors: 0,
        },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: "File too large (max 10MB)",
          imported: 0,
          duplicates: 0,
          errors: 0,
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
          success: false,
          message:
            "Invalid file type. Only CSV, Excel, and PDF files are supported",
          imported: 0,
          duplicates: 0,
          errors: 0,
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = fileType === "csv" ? buffer.toString("utf-8") : buffer;
    const parseResult = await parseBankStatement(content, bankCode, fileType);

    if (parseResult.transactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid transactions found in file",
          imported: 0,
          duplicates: 0,
          errors: parseResult.errors.length,
        },
        { status: 400 },
      );
    }

    const normalized = normalizeTransactions(
      parseResult.transactions,
      bankCode,
    );
    const session = await convex.mutation(api.imports.createSession, {
      fileName: file.name,
      fileSize: file.size,
      bankCode,
      status: "processing",
    });
    try {
      const imported = await persistImportedTransactions({
        items: normalized.map((t) => ({
          transactionDate: t.date,
          description: t.merchant,
          amount: t.amount,
          transactionType: t.type,
          balance: t.balance,
          reference: t.reference,
          source: `${bankCode}_import`,
        })),
        createMany: (items) =>
          convex.mutation(api.transactions.createManyMine, {
            items,
            importSessionExternalId: session.id,
          }),
        removeMany: (ids) =>
          convex.mutation(api.transactions.removeMine, { externalIds: ids }),
      });
      const finalized = await completeImportSessionWithRetry(() =>
        convex.mutation(api.imports.updateSession, {
          externalId: session.id,
          status: "completed",
          transactionsImported: imported.imported,
          completed: true,
        }),
      );
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${imported.imported} transactions`,
        imported: imported.imported,
        duplicates: 0,
        errors: parseResult.errors.length,
        sessionStatus: finalized.completed ? "completed" : "processing",
        needsFinalize: !finalized.completed,
      });
    } catch (persistError) {
      await markImportSessionFailed(() =>
        convex.mutation(api.imports.updateSession, {
          externalId: session.id,
          status: "failed",
        }),
      );
      throw persistError;
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          imported: 0,
          duplicates: 0,
          errors: 0,
        },
        { status: 401 },
      );
    }
    console.error("Upload error:", error);
    const persistError =
      error instanceof ImportPersistError ? error.cause : error;
    const { message } = await toFriendlyErrorAndFlush(
      persistError,
      "Import didn't complete. Please try again.",
      { context: "import:upload" },
    );
    return NextResponse.json(
      {
        success: false,
        message,
        imported: 0,
        duplicates: 0,
        errors: 0,
      },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 15 });
