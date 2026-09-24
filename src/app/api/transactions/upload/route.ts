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

export const runtime = "nodejs";
export const maxDuration = 60;

interface UploadResponse {
  success: boolean;
  message: string;
  imported: number;
  duplicates: number;
  errors: number;
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
    const importedTransactions = await convex.mutation(
      api.transactions.createManyMine,
      {
        items: normalized.map((t) => ({
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

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedTransactions.length} transactions`,
      imported: importedTransactions.length,
      duplicates: 0,
      errors: parseResult.errors.length,
    });
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
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
        imported: 0,
        duplicates: 0,
        errors: 0,
      },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 15 });
