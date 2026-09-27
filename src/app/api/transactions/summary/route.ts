import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { listAllTransactionsMine } from "@/lib/convex/money-lists";
import {
  emptyBooksSummary,
  summarizeBooksTransactions,
} from "@/lib/transactions/summarize-books";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  startDate: vDate(),
  endDate: vDate(),
});

function vDate() {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
}

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = querySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Staging Convex lags git (`summaryForPeriod` is not deployed). Use
    // listMine — already live — and aggregate here so Tax generate-from-books
    // gets 200 + zeros when the period is empty, never a 500.
    const { transactions } = await listAllTransactionsMine(convex, {
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    });

    return NextResponse.json(summarizeBooksTransactions(transactions ?? []));
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Books summary error:", error);
    // Authenticated soak must still get a usable payload — empty books, not 500.
    return NextResponse.json(emptyBooksSummary());
  }
}

export const GET = withRateLimit(handleGET);
