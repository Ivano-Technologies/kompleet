import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { getAuthedConvex, isUnauthorized } from "@/lib/convex/server";
import { rethrowIfNextControlFlow } from "@/lib/next-control-flow";
import {
  getDocumentStatusControllerWithConvex,
  NotFoundError,
} from "@/modules/document-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized", message: "Authentication required" },
    { status: 401 },
  );
}

async function handleGET(request: NextRequest, context?: RouteContext) {
  // Fail closed before any document/queue work. Status reads do not need Redis.
  const authed = await getAuthedConvex(request);
  if (!authed) {
    return unauthorized();
  }

  try {
    const controller = getDocumentStatusControllerWithConvex(authed.convex);
    const { id } = await (context?.params ?? Promise.resolve({ id: "" }));
    if (!id) {
      return NextResponse.json(
        { error: "Not found", message: "Document not found." },
        { status: 404 },
      );
    }
    const result = await controller.getDocumentStatus({
      userId: authed.user.id,
      documentId: id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    rethrowIfNextControlFlow(error);
    if (isUnauthorized(error)) {
      return unauthorized();
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "Not found", message: error.message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await cookies();
    return await withRateLimit(handleGET)(request, context);
  } catch (error) {
    rethrowIfNextControlFlow(error);
    if (isUnauthorized(error)) {
      return unauthorized();
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
