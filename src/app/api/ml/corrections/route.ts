// TODO(IVA-64 Phase 5): categorization_feedback / ml_inference_logs are not in Convex schema.
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handlePOST(request: NextRequest) {
  try {
    await requireAuthedConvex(request);
    const body = await request.json();
    const transactionId =
      body.transaction_id || body.transaction_data?.id || body.transactionId;
    const predictedCategory =
      body.predicted_category || body.originalCategory || body.original_category;
    const correctedCategory =
      body.corrected_category || body.correctedCategory;
    if (!transactionId || !predictedCategory || !correctedCategory) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (transaction_id, predicted_category, corrected_category)",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Correction accepted (not persisted — no Convex table yet)",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to record correction" },
      { status: 500 },
    );
  }
}

async function handleGET(request: NextRequest) {
  try {
    await requireAuthedConvex(request);
    return NextResponse.json({
      totalCorrections: 0,
      correctionRate: 0,
      topMiscategorized: [],
      totalFeedback: 0,
      overallAccuracy: 0,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get correction stats" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST);
export const GET = withRateLimit(handleGET);
