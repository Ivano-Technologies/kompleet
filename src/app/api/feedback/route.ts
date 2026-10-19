// TODO(IVA-64 Phase 5): categorization_feedback is not in Convex schema. Do not invent tables.
import { NextRequest, NextResponse } from "next/server";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";

/** `{ message, ref }` error body; logs the ref on the server. */
function messageBody(text: string) {
  const { error, ref } = apiErrorBody(text);
  return { message: error, ref };
}

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
        { success: false, ...messageBody("Missing required fields") },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Thanks, we got your feedback.",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { success: false, ...messageBody("Unauthorized") },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, ...messageBody("Failed to record feedback") },
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
        { success: false, ...messageBody("Unauthorized") },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, ...messageBody("Failed to retrieve feedback") },
      { status: 500 },
    );
  }
}
