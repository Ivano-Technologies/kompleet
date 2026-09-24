// TODO(IVA-64 Phase 5): categorization_feedback is not in Convex schema. Do not invent tables.
import { NextRequest, NextResponse } from "next/server";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

export async function POST(request: NextRequest) {
  try {
    await requireAuthedConvex(request);
    const body = await request.json();
    const { transactionId, originalCategory, correctedCategory } = body as {
      transactionId?: unknown;
      originalCategory?: unknown;
      correctedCategory?: unknown;
    };
    if (!transactionId || !originalCategory || !correctedCategory) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Feedback accepted (not persisted — no Convex table yet)",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to record feedback" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthedConvex(request);
    return NextResponse.json({
      success: true,
      data: {
        totalFeedback: 0,
        overallAccuracy: 0,
        byCategory: [],
      },
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to retrieve feedback" },
      { status: 500 },
    );
  }
}
