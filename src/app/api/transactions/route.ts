import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { z } from "zod";

export const runtime = "nodejs";

const getQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  type: z.enum(["debit", "credit"]).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const deleteBodySchema = z.object({
  ids: z.array(z.string().uuid("Invalid transaction ID")).min(1).max(500),
});

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await getSupabaseForRequest(request);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = getQuerySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const filters = parsed.data;

    // Build query
    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        category:categories(id, name, category_type, tax_treatment)
      `,
        { count: "exact" },
      )
      .eq("user_id", user.id);

    // Apply filters
    if (filters.startDate) {
      query = query.gte("transaction_date", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("transaction_date", filters.endDate);
    }

    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }

    if (filters.type) {
      query = query.eq("transaction_type", filters.type);
    }

    if (filters.search) {
      query = query.ilike("description", `%${filters.search}%`);
    }

    // Apply pagination
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;

    query = query
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      transactions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await getSupabaseForRequest(request);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = deleteBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { ids } = parsed.data;

    // Delete transactions (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting transactions:", error);
      return NextResponse.json(
        { error: "Failed to delete transactions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${ids.length} transaction(s)`,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const DELETE = withRateLimit(
  withAudit(handleDELETE, { action: "delete", resourceType: "transactions" }),
);
