import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import {
  recordFeedback,
  getFeedbackStatistics,
} from "@/lib/ai/feedbackService";
import { withRateLimit } from "@/lib/with-rate-limit";

/**
 * Correction feedback — survives on the AI stack (feedbackService), not the
 * deleted ML continuous-learning / ml_corrections path.
 * See docs/MISSING_TABLES_RECOVERY_PLAN.md §2c.
 */

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const transactionId =
      body.transaction_id || body.transaction_data?.id || body.transactionId;
    const predictedCategory =
      body.predicted_category || body.originalCategory || body.original_category;
    const correctedCategory =
      body.corrected_category || body.correctedCategory;
    const confidence =
      typeof body.confidence === "number"
        ? body.confidence
        : typeof body.original_confidence === "number"
          ? body.original_confidence
          : 0;

    if (!transactionId || !predictedCategory || !correctedCategory) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (transaction_id, predicted_category, corrected_category)",
        },
        { status: 400 },
      );
    }

    await recordFeedback({
      transactionId: String(transactionId),
      userId: user.id,
      originalCategory: String(predictedCategory),
      correctedCategory: String(correctedCategory),
      originalConfidence: confidence,
      reason: body.reason,
    });

    return NextResponse.json({
      success: true,
      message: "Correction recorded successfully",
    });
  } catch (error) {
    console.error("[Record Correction API Error]", error);
    return NextResponse.json(
      { error: "Failed to record correction" },
      { status: 500 },
    );
  }
}

async function handleGET(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getFeedbackStatistics(user.id);

    // Shape expected by ml-settings UI (totalCorrections / correctionRate / topMiscategorized)
    return NextResponse.json({
      totalCorrections: stats.totalFeedback,
      correctionRate: stats.overallAccuracy,
      topMiscategorized: [],
      ...stats,
    });
  } catch (error) {
    console.error("[Get Correction Stats API Error]", error);
    return NextResponse.json(
      { error: "Failed to get correction stats" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST);
export const GET = withRateLimit(handleGET);
