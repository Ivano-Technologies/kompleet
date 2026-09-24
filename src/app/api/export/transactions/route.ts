import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { listAllTransactionsMine } from "@/lib/convex/money-lists";
import {
  exportTransactionsCSV,
  exportTransactionsExcel,
} from "@/lib/export-service";

interface ExportBody {
  format?: string;
  tax_year?: number;
}

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = (await request.json()) as ExportBody;
    const { format, tax_year } = body;

    if (!format || (format !== "csv" && format !== "excel")) {
      return NextResponse.json(
        { error: "Invalid format. Must be csv or excel" },
        { status: 400 },
      );
    }

    const yearFilters =
      typeof tax_year === "number"
        ? {
            startDate: `${tax_year}-01-01`,
            endDate: `${tax_year}-12-31`,
          }
        : {};

    const { transactions } = await listAllTransactionsMine(convex, yearFilters);
    const preloaded = transactions.map((t) => ({
      transaction_date: t.transaction_date,
      transaction_type: t.transaction_type,
      categories: t.category ? { name: t.category.name } : null,
      description: t.description,
      amount: t.amount,
      tax_year:
        typeof tax_year === "number"
          ? tax_year
          : Number(t.transaction_date.slice(0, 4)),
    }));

    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (format === "csv") {
      buffer = await exportTransactionsCSV(undefined, tax_year, preloaded);
      filename = tax_year
        ? `transactions_${tax_year}.csv`
        : "transactions_all.csv";
      contentType = "text/csv";
    } else {
      buffer = await exportTransactionsExcel(undefined, tax_year, preloaded);
      filename = tax_year
        ? `transactions_${tax_year}.xlsx`
        : "transactions_all.xlsx";
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    await convex.mutation(api.exports.createMine, {
      exportType: "transactions",
      format,
      taxYear: typeof tax_year === "number" ? tax_year : undefined,
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
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/export/transactions:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "export", resourceType: "transactions" }),
  { limit: 20 },
);
