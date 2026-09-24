import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { z } from "zod";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { listAllTransactionsMine } from "@/lib/convex/money-lists";

export const runtime = "nodejs";

const exportQuerySchema = z.object({
  format: z.enum(["csv", "json"]).default("csv"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  type: z.enum(["debit", "credit"]).optional(),
});

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const searchParams = request.nextUrl.searchParams;
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = exportQuerySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { format, startDate, endDate, type } = parsed.data;
    const { transactions, total } = await listAllTransactionsMine(convex, {
      startDate,
      endDate,
      type,
    });

    const MAX_EXPORT = 50000;
    if (total > MAX_EXPORT) {
      return NextResponse.json(
        {
          error: `Export limited to ${MAX_EXPORT.toLocaleString()} transactions. Please use date filters to narrow your results.`,
        },
        { status: 400 },
      );
    }

    if (format === "json") {
      return NextResponse.json({ transactions });
    }

    const headers = [
      "Date",
      "Description",
      "Type",
      "Amount",
      "Balance",
      "Category",
      "Category Type",
      "Tax Treatment",
      "Reference",
      "Notes",
      "Reconciled",
    ];

    const rows = transactions.map((t) => [
      t.transaction_date,
      csvEscape(t.description),
      t.transaction_type,
      String(t.amount),
      t.balance === null ? "" : String(t.balance),
      t.category?.name || "Uncategorized",
      t.category?.category_type || "",
      t.category?.tax_treatment || "",
      t.reference || "",
      t.notes ? csvEscape(t.notes) : "",
      t.is_reconciled ? "Yes" : "No",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="transactions_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in GET /api/transactions/export:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withRateLimit(
  withAudit(handleGET, { action: "export", resourceType: "transactions" }),
);
