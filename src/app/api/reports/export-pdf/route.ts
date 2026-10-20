import { withRateLimit } from "@/lib/with-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { FinancialStatementsService } from "@/lib/services/financial-statements-service";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { listStatementTransactions } from "@/lib/convex/statement-txns";
import { friendlyErrorBody, apiErrorBody } from "@/lib/friendly-error";
import {
  generateBalanceSheetHTML,
  generateProfitLossHTML,
} from "@/lib/financial-statements/statement-html";

export const runtime = "nodejs";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const { statementType, startDate, endDate, asOfDate } = body;

    if (!statementType) {
      return NextResponse.json({ ...apiErrorBody("statementType is required") },
        { status: 400 },
      );
    }

    const transactions = await listStatementTransactions(convex);

    let statement: ReturnType<
      typeof FinancialStatementsService.generateProfitLoss
    > | ReturnType<typeof FinancialStatementsService.generateBalanceSheet>;
    let htmlContent: string;

    if (statementType === "profit_loss") {
      if (!startDate || !endDate) {
        return NextResponse.json({ ...apiErrorBody("startDate and endDate are required for P&L") },
          { status: 400 },
        );
      }
      statement = FinancialStatementsService.generateProfitLoss(
        transactions,
        startDate,
        endDate,
      );
      htmlContent = generateProfitLossHTML(statement);
    } else if (statementType === "balance_sheet") {
      if (!asOfDate) {
        return NextResponse.json({ ...apiErrorBody("asOfDate is required for Balance Sheet") },
          { status: 400 },
        );
      }
      statement = FinancialStatementsService.generateBalanceSheet(
        transactions,
        asOfDate,
      );
      htmlContent = generateBalanceSheetHTML(statement);
    } else {
      return NextResponse.json({ ...apiErrorBody("Invalid statementType") },
        { status: 400 },
      );
    }

    // Return HTML for client-side PDF generation
    return NextResponse.json({ html: htmlContent });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("Error in POST /api/reports/export-pdf:", error);
    return NextResponse.json(
      {
        ...friendlyErrorBody(error),
      },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
