// TODO(IVA-64 Phase 5): recurring_patterns is not in Convex schema. Detect in-memory from Convex transactions.
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { listAllTransactionsMine } from "@/lib/convex/money-lists";
import { detectRecurringPatternsFromTransactions } from "@/lib/services/recurring-detection";

async function detectFromConvex(request: NextRequest) {
  const { convex } = await requireAuthedConvex(request);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const startDate = twelveMonthsAgo.toISOString().slice(0, 10);
  const { transactions } = await listAllTransactionsMine(convex, { startDate });
  return detectRecurringPatternsFromTransactions(
    transactions.map((t) => ({
      merchant: t.description,
      amount: t.amount,
      date: t.transaction_date,
    })),
  );
}

async function handlePOST(request: NextRequest) {
  try {
    const patterns = await detectFromConvex(request);
    return NextResponse.json({
      success: true,
      patterns_detected: patterns.length,
      patterns,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Recurring Detection API Error]", error);
    return NextResponse.json(
      { error: "Failed to detect recurring patterns" },
      { status: 500 },
    );
  }
}

async function handleGET(request: NextRequest) {
  try {
    const patterns = await detectFromConvex(request);
    return NextResponse.json({
      patterns,
      count: patterns.length,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Get Recurring Patterns API Error]", error);
    return NextResponse.json(
      { error: "Failed to get recurring patterns" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST);
export const GET = withRateLimit(handleGET);
