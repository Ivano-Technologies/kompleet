/**
 * GET /api/expenses - List expenses (Supabase, RLS).
 * POST /api/expenses - Create expense.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { z } from "zod";

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
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    let query = supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (categoryId) query = query.eq("category_id", categoryId);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      expenses: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = postBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        date: parsed.data.date,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        category_id: parsed.data.category_id ?? null,
        vendor: parsed.data.vendor ?? null,
        vat_amount: parsed.data.vat_amount ?? 0,
        receipt_url: parsed.data.receipt_url ?? null,
        notes: parsed.data.notes ?? null,
      })
      .select(
        "id, date, amount, currency, category_id, vendor, vat_amount, receipt_url, notes, created_at, updated_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
