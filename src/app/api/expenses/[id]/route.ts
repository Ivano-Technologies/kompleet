/**
 * GET /api/expenses/[id] - Get one expense.
 * PATCH /api/expenses/[id] - Update expense.
 * DELETE /api/expenses/[id] - Delete expense.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

const patchBodySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  amount: z.number().finite().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  category_id: z.string().uuid().nullable().optional(),
  vendor: z.string().max(500).nullable().optional(),
  vat_amount: z.number().finite().nonnegative().optional(),
  receipt_url: z.string().url().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { convex } = await requireAuthedConvex(request);

    const data = await convex.query(api.expenses.getMine, { externalId: id });
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = await convex.mutation(api.expenses.updateMine, {
      externalId: id,
      date: parsed.data.date,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      categoryExternalId: parsed.data.category_id,
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
    const message = err instanceof Error ? err.message : "Server error";
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { convex } = await requireAuthedConvex(request);
    await convex.mutation(api.expenses.removeMine, { externalId: id });
    return new NextResponse(null, { status: 204 });
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
