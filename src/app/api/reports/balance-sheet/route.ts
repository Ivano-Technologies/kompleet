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
    const asOfDate = request.nextUrl.searchParams.get("asOfDate");

    if (!asOfDate) {
      return NextResponse.json(
        { error: "asOfDate is required" },
        { status: 400 },
      );
    }

    const transactions = await listStatementTransactions(convex);
    const statement = FinancialStatementsService.generateBalanceSheet(
      transactions,
      asOfDate,
    );

    try {
      await convex.mutation(api.reports.saveMine, {
        statementType: "balance_sheet",
        taxYear: Number(asOfDate.slice(0, 4)),
        data: {
          statement,
          period_start: asOfDate,
          period_end: asOfDate,
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
    console.error("Error in GET /api/reports/balance-sheet:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET, { limit: 20 });
