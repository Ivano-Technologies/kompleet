/**
 * API endpoint for bank statement ingestion
 * POST /api/ingest
 *
 * Accepts:
 * - file: FormData file (PDF, Excel, CSV, ZIP)
 * - password: Optional password for encrypted files
 * - bankCode: Optional bank code for bank-specific parsing
 *
 * Returns:
 * - success: boolean
 * - transactionCount: number
 * - errors: array of parse errors
 * - message: string
 *
 * Auth is Convex. This route parses only and does not persist transactions.
 * Live persist is POST /api/transactions/upload-v2.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { rethrowIfNextControlFlow } from "@/lib/next-control-flow";
import { IngestionRequest } from "@/lib/ingestion/types";

async function handlePOST(request: NextRequest) {
  try {
    const { user } = await requireAuthedConvex(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const password = formData.get("password") as string | null;
    const bankCode = formData.get("bankCode") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      );
    }

    const maxFileSize = 100 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds 100 MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        },
        { status: 400 },
      );
    }

    const sourceFileId = crypto.randomUUID();

    const { ingestStatement } = await import(
      "@/lib/ingestion/ingestionWorker"
    );

    const ingestionRequest: IngestionRequest = {
      file,
      password: password || undefined,
      bankCode: bankCode || undefined,
    };

    const response = await ingestStatement(
      ingestionRequest,
      user.id,
      sourceFileId,
    );

    if (response.message === "PASSWORD_REQUIRED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This file is password-protected. Please provide the password.",
          requiresPassword: true,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    rethrowIfNextControlFlow(error);
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    console.error("Ingestion error:", error);

    return NextResponse.json(
      {
        success: false,
        message: `Ingestion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        errors: [
          {
            rowNumber: 0,
            errorType: "SERVER_ERROR",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context?: unknown) {
  try {
    await cookies();
    return await withRateLimit(handlePOST)(request, context);
  } catch (error) {
    rethrowIfNextControlFlow(error);
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: `Ingestion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
