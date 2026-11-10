import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { z } from "zod";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { listAllTransactionsMine } from "@/lib/convex/money-lists";
import { toFriendlyError, apiErrorBody } from "@/lib/friendly-error";

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
  search: z.string().max(200).optional(),
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
      return NextResponse.json({ ...apiErrorBody("Invalid query parameters"), details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { format, startDate, endDate, type, search } = parsed.data;
    // collectPagedItems already caps at EXPORT_MAX (50_000). A second check
    // against `total` was unreachable: total is the collected length.
    const { transactions } = await listAllTransactionsMine(convex, {
      startDate,
      endDate,
      type,
      search,
    });

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
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("Error in GET /api/transactions/export:", error);
    const { message, ref } = toFriendlyError(error);
    return NextResponse.json({ error: message, ref }, { status: 500 });
  }
}

export const GET = withRateLimit(
  withAudit(handleGET, { action: "export", resourceType: "transactions" }),
);
