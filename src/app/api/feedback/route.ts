/**
 * API endpoint for categorization feedback
 * POST /api/feedback - Record user correction
 * GET /api/feedback - Get feedback statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import {
  recordFeedback,
  getFeedbackStatistics,
  getCategoryAccuracy,
} from "@/lib/ai/feedbackService";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Parse request body
    const {
      transactionId,
      originalCategory,
      correctedCategory,
      originalConfidence,
      reason,
    } = await request.json();

    if (!transactionId || !originalCategory || !correctedCategory) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // 3. Record feedback
    await recordFeedback({
      transactionId,
      userId: user.id,
      originalCategory,
      correctedCategory,
      originalConfidence: originalConfidence || 0,
      reason,
    });

    // 4. Return response
    return NextResponse.json({
      success: true,
      message: "Feedback recorded successfully",
    });
  } catch (error) {
    console.error("Feedback error:", error);

    return NextResponse.json(
      {
        success: false,
        message: `Failed to record feedback: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "statistics";

    // 3. Get statistics or accuracy
    let data;
    if (type === "accuracy") {
      data = await getCategoryAccuracy(user.id);
    } else {
      data = await getFeedbackStatistics(user.id);
    }

    // 4. Return response
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Feedback retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: `Failed to retrieve feedback: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
