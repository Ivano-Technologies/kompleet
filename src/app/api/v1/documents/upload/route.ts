import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { rethrowIfNextControlFlow } from "@/lib/next-control-flow";
import { getDocumentControllerWithConvex } from "@/modules/document-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePOST(request: NextRequest) {
  try {
    const { user, convex } = await requireAuthedConvex(request);
    const controller = getDocumentControllerWithConvex(convex);
    const body = await request.json();
    const result = await controller.uploadDocument({
      userId: user.id,
      body,
      request,
    });

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    rethrowIfNextControlFlow(error);
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    if (
      error instanceof Error &&
      (error.message.includes("required") || error.message.includes("must be"))
    ) {
      return NextResponse.json(
        { error: "Validation error", message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
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
