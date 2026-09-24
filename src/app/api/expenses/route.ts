/**
 * GET /api/expenses - List expenses (Convex).
 * POST /api/expenses - Create expense.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

const querySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const postBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().finite().nonnegative(),
  currency: z.string().max(10).default("NGN"),
  category_id: z.string().uuid().nullable().optional(),
  vendor: z.string().max(500).nullable().optional(),
  vat_amount: z.number().finite().nonnegative().optional(),
  receipt_url: z.string().url().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const sp = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      startDate: sp.get("startDate") ?? undefined,
      endDate: sp.get("endDate") ?? undefined,
      categoryId: sp.get("categoryId") ?? undefined,
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { startDate, endDate, categoryId, page, limit } = parsed.data;

    const result = await convex.query(api.expenses.listMine, {
      startDate,
      endDate,
      categoryId,
      page,
      limit,
    });

    return NextResponse.json({
      expenses: result.expenses,
      total: result.total,
      page,
      limit,
    });
  } catch (err) {
    if (isUnauthorized(err)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const parsed = postBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = await convex.mutation(api.expenses.createMine, {
      date: parsed.data.date,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      categoryExternalId: parsed.data.category_id ?? undefined,
      vendor: parsed.data.vendor ?? undefined,
      vatAmount: parsed.data.vat_amount,
      receiptUrl: parsed.data.receipt_url ?? undefined,
      notes: parsed.data.notes ?? undefined,
    });

    return NextResponse.json(data);
  } catch (err) {
    if (isUnauthorized(err)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
