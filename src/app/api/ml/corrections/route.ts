import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createClient } from "@/lib/supabase/server";
import {
  recordCorrection,
  getCorrectionStats,
} from "@/lib/ml/continuous-learning";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handlePOST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (
      !body.transaction_data ||
      !body.predicted_category ||
      !body.corrected_category
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Record correction
    await recordCorrection({
      userId: user.id,
      inferenceId: body.inference_id,
      transactionData: body.transaction_data,
      predictedCategory: body.predicted_category,
      correctedCategory: body.corrected_category,
      confidence: body.confidence || 0,
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
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get correction stats
    const stats = await getCorrectionStats(user.id);

    return NextResponse.json(stats);
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
