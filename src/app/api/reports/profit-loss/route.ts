import { NextRequest, NextResponse } from "next/server";
import { FinancialStatementsService } from "@/lib/services/financial-statements-service";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { listStatementTransactions } from "@/lib/convex/statement-txns";

export const runtime = "nodejs";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 },
      );
    }

    const transactions = await listStatementTransactions(convex);
    const statement = FinancialStatementsService.generateProfitLoss(
      transactions,
      startDate,
      endDate,
    );

    try {
      await convex.mutation(api.reports.saveMine, {
        statementType: "profit_loss",
        taxYear: Number(startDate.slice(0, 4)),
        data: {
          statement,
          period_start: startDate,
          period_end: endDate,
          generated_at: new Date().toISOString(),
          transaction_count: transactions.length,
        },
      });
    } catch (saveError) {
      console.error("Error saving statement:", saveError);
    }

    return NextResponse.json({ statement });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in GET /api/reports/profit-loss:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET, { limit: 20 });
