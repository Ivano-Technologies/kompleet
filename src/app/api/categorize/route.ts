// TODO(IVA-64 Phase 5): categorization_predictions / user_learning_profiles are not in Convex schema.
import { NextRequest, NextResponse } from "next/server";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

export async function POST(request: NextRequest) {
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
        { success: false, message: "transactionIds array is required" },
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
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Categorization failed" },
      { status: 500 },
    );
  }
}
