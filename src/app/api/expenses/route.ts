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
import { friendlyErrorBody, apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";
import { readNumberedPage } from "@/lib/convex/collect-pages";

const querySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  categoryId: z.string().max(80).optional(),
  updatedSince: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).optional(),
});

const postBodySchema = z.object({
  id: z.string().max(80).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().finite().nonnegative(),
  currency: z.string().max(10).default("NGN"),
  category_id: z.string().max(80).nullable().optional(),
  vendor: z.string().max(500).nullable().optional(),
  vat_amount: z.number().finite().nonnegative().optional(),
  receipt_url: z.string().max(2000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const sp = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      startDate: sp.get("startDate") ?? undefined,
      endDate: sp.get("endDate") ?? undefined,
      categoryId: sp.get("categoryId") ?? undefined,
      updatedSince: sp.get("updatedSince") ?? undefined,
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
      cursor: sp.get("cursor") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ ...apiErrorBody("Invalid query"), details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { startDate, endDate, categoryId, updatedSince, page, limit, cursor } =
      parsed.data;

    const result = await readNumberedPage(
      async (pageCursor) => {
        const listed = await convex.query(api.expenses.listMine, {
          startDate,
          endDate,
          categoryId,
          updatedSince,
          cursor: pageCursor,
          limit,
        });
        return {
          items: listed.expenses,
          isDone: listed.isDone,
          nextCursor: listed.nextCursor,
        };
      },
      { page, cursor },
    );

    return NextResponse.json({
      expenses: result.items,
      total: result.isDone && page === 1 && !cursor ? result.items.length : result.items.length,
      page,
      limit,
      nextCursor: result.nextCursor,
      isDone: result.isDone,
    });
  } catch (err) {
    if (isUnauthorized(err)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    return NextResponse.json(
      { ...friendlyErrorBody(err) },
      { status: 500 },
    );
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const parsed = postBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ...apiErrorBody("Invalid body"), details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = await convex.mutation(api.expenses.createMine, {
      externalId: parsed.data.id,
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
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    return NextResponse.json(
      { ...friendlyErrorBody(err) },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const POST = withRateLimit(handlePOST, { limit: 60 });
