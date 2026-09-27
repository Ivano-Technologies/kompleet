import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import {
  suggestCategory,
  type TriageRow,
} from "@/lib/transactions/triage";
import {
  isMissingConvexFunction,
  listTriageFallback,
} from "@/lib/transactions/triage-fallback";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.enum(["categorise", "confirm", "ignore"]),
    kind: z.enum(["transaction", "duplicate"]),
    id: z.string().min(1),
    categoryId: z.string().min(1).optional(),
  }),
  z.object({
    op: z.literal("undo"),
    snapshot: z.object({
      kind: z.enum(["transaction", "duplicate"]),
      id: z.string().min(1),
      categoryId: z.string().nullable(),
      confidenceScore: z.number().nullable(),
      triageIgnored: z.boolean(),
      duplicateStatus: z.string().nullable(),
      createdTransactionId: z.string().nullable(),
    }),
  }),
  z.object({
    op: z.literal("ignore_low"),
  }),
]);

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { convex } = await requireAuthedConvex(request);
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 100;
    const safeLimit = Number.isFinite(limit) ? limit : 100;
    try {
      const [triage, categories] = await Promise.all([
        convex.query(api.transactions.listTriageMine, {
          limit: safeLimit,
        }),
        convex.query(api.categories.list, {}),
      ]);

      const items: TriageRow[] = triage.items.map((row) => ({
        id: row.id,
        kind: row.kind,
        merchant: row.merchant,
        amount: row.amount,
        transactionType: row.transaction_type,
        date: row.date,
        bankMeta: row.bank_meta,
        reason: row.reason,
        category: row.category,
        confidenceScore: row.confidence_score,
        suggestedCategory:
          row.reason === "duplicate_suspect"
            ? null
            : suggestCategory(
                row.merchant,
                categories,
                row.transaction_type,
              ) ?? row.category,
      }));

      return NextResponse.json({
        items,
        counts: triage.counts,
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
        })),
      });
    } catch (error) {
      if (!isMissingConvexFunction(error)) throw error;
      const fallback = await listTriageFallback(convex, safeLimit);
      return NextResponse.json(fallback);
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Triage list error:", error);
    return NextResponse.json(
      { error: "Failed to load triage" },
      { status: 500 },
    );
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { convex } = await requireAuthedConvex(request);
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const body = parsed.data;
    if (body.op === "undo") {
      await convex.mutation(api.transactions.undoTriageMine, {
        snapshot: body.snapshot,
      });
      return NextResponse.json({ success: true });
    }

    if (body.op === "ignore_low") {
      const result = await convex.mutation(
        api.transactions.ignoreLowConfidenceMine,
        {},
      );
      return NextResponse.json({
        success: true,
        count: result.count,
        snapshots: result.snapshots,
      });
    }

    const result = await convex.mutation(api.transactions.applyTriageMine, {
      kind: body.kind,
      id: body.id,
      action: body.op,
      categoryExternalId: body.categoryId,
    });
    return NextResponse.json({
      success: true,
      snapshot: result.snapshot,
      createdTransactionId: result.createdTransactionId,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to apply triage";
    console.error("Triage action error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withRateLimit(handleGET);
export const POST = withRateLimit(handlePOST);
