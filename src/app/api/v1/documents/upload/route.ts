import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { getAuthedConvex, isUnauthorized } from "@/lib/convex/server";
import { formatError, logger } from "@/lib/logger";
import { rethrowIfNextControlFlow } from "@/lib/next-control-flow";
import {
  DocumentPersistError,
  getDocumentControllerWithConvex,
  QueueConfigurationError,
} from "@/modules/document-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized", message: "Authentication required" },
    { status: 401 },
  );
}

function isQueueMisconfig(error: unknown): boolean {
  return (
    error instanceof QueueConfigurationError ||
    (error instanceof Error && /REDIS_URL/i.test(error.message))
  );
}

function isValidationError(error: unknown): error is Error {
  if (!(error instanceof Error) || isQueueMisconfig(error)) {
    return false;
  }
  return error.message.includes("required") || error.message.includes("must be");
}

async function handlePOST(request: NextRequest) {
  // Fail closed before queue/driver selection. Unset DOCUMENT_QUEUE_DRIVER
  // uses in-memory even if REDIS_URL is leftover. Explicit redis with a
  // dead connection falls back to memory after the Convex row is written.
  const authed = await getAuthedConvex(request);
  if (!authed) {
    return unauthorized();
  }

  try {
    const controller = getDocumentControllerWithConvex(authed.convex);
    const body = await request.json();
    const result = await controller.uploadDocument({
      userId: authed.user.id,
      body,
      request,
    });

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    rethrowIfNextControlFlow(error);
    if (isUnauthorized(error)) {
      return unauthorized();
    }
    if (isQueueMisconfig(error)) {
      logger.error("document upload queue misconfig after auth", {
        operation: "document.upload",
        error: formatError(error),
      });
      return NextResponse.json(
        {
          error: "Service unavailable",
          message:
            error instanceof Error
              ? error.message
              : "REDIS_URL is required for document queueing.",
        },
        { status: 503 },
      );
    }
    if (isValidationError(error)) {
      return NextResponse.json(
        { error: "Validation error", message: error.message },
        { status: 400 },
      );
    }
    if (error instanceof DocumentPersistError) {
      logger.error("document upload persist failed after auth", {
        operation: "document.upload",
        error: formatError(error),
      });
      return NextResponse.json(
        { error: "Document persist failed", message: error.message },
        { status: 502 },
      );
    }

    logger.error("document upload failed after authentication", {
      operation: "document.upload",
      error: formatError(error),
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Upload failed after authentication",
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
      return unauthorized();
    }
    logger.error("document upload outer handler failed", {
      operation: "document.upload",
      error: formatError(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
