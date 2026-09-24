import { withRateLimit } from "@/lib/with-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { exportFinancialStatementWord } from "@/lib/export-service";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const { statement_type, tax_year } = body as {
      statement_type?: string;
      tax_year?: number;
    };

    if (
      !statement_type ||
      !["balance_sheet", "pnl", "tax_summary"].includes(statement_type)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid statement_type. Must be balance_sheet, pnl, or tax_summary",
        },
        { status: 400 },
      );
    }

    if (!tax_year) {
      return NextResponse.json(
        { error: "tax_year is required for statement export" },
        { status: 400 },
      );
    }

    await convex.mutation(api.audit.append, {
      action: "export",
      resourceType: "financial_statement",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { statement_type, tax_year },
    });

    const buffer = await exportFinancialStatementWord(
      convex,
      tax_year,
      statement_type as "balance_sheet" | "pnl" | "tax_summary",
    );

    const statementNames: Record<string, string> = {
      balance_sheet: "Balance_Sheet",
      pnl: "Profit_Loss",
      tax_summary: "Tax_Summary",
    };

    const filename = `${statementNames[statement_type]}_${tax_year}.docx`;

    await convex.mutation(api.exports.createMine, {
      exportType: "financial_statement",
      format: "word",
      taxYear: tax_year,
      status: "complete",
      fileSize: buffer.length,
    });

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/export/statements:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
