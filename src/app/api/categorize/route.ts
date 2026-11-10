// TODO(IVA-64 Phase 5): categorization_predictions / user_learning_profiles are not in Convex schema.
import { NextRequest, NextResponse } from "next/server";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

/** `{ message, ref }` error body; logs the ref on the server. */
function messageBody(text: string) {
  const { error, ref } = apiErrorBody(text);
  return { message: error, ref };
}

async function handlePOST(request: NextRequest) {
  try {
    await requireAuthedConvex(request);
    const body = await request.json();
    const transactionIds = body?.transactionIds;
    if (
      !transactionIds ||
      !Array.isArray(transactionIds) ||
      transactionIds.length === 0
    ) {
      return NextResponse.json(
        { success: false, ...messageBody("transactionIds array is required") },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: false,
      message:
        "Batch categorize is not on Convex yet (no prediction / learning tables)",
      predictions: [],
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
      averageConfidence: 0,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { success: false, ...messageBody("Unauthorized") },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, ...messageBody("Categorization failed") },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20, window: 60_000 });
