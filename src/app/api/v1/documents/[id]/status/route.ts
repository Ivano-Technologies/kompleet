import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { rethrowIfNextControlFlow } from "@/lib/next-control-flow";
import {
  getDocumentControllerWithConvex,
  NotFoundError,
} from "@/modules/document-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

async function handleGET(request: NextRequest, context?: RouteContext) {
  try {
    const { user, convex } = await requireAuthedConvex(request);
    const controller = getDocumentControllerWithConvex(convex);
    const { id } = await (context?.params ?? Promise.resolve({ id: "" }));
    if (!id) {
      return NextResponse.json(
        { error: "Not found", message: "Document not found." },
        { status: 404 },
      );
    }
    const result = await controller.getDocumentStatus({
      userId: user.id,
      documentId: id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    rethrowIfNextControlFlow(error);
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
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
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
