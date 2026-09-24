import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
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

const createBodySchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  amount: z.number().positive("Amount must be positive"),
  transaction_type: z.enum(["debit", "credit"]).optional(),
  type: z.enum(["income", "expense"]).optional(),
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  category_id: z.string().uuid().nullable().optional(),
  category: z.string().optional(),
}).refine(
  (data) =>
    data.transaction_type !== undefined || data.type !== undefined,
  { message: "Provide transaction_type or type" },
).refine(
  (data) =>
    data.transaction_date !== undefined || data.date !== undefined,
  { message: "Provide transaction_date or date" },
);

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { convex } = await requireAuthedConvex(request);

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
    const result = await convex.query(api.transactions.listMine, {
      startDate: filters.startDate,
      endDate: filters.endDate,
      categoryId: filters.categoryId,
      type: filters.type,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
    });

    return NextResponse.json({
      transactions: result.transactions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const parsed = deleteBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const removed = await convex.mutation(api.transactions.removeMine, {
      externalIds: parsed.data.ids,
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${removed} transaction(s)`,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const parsed = createBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const p = parsed.data;
    const transactionType =
      p.transaction_type ??
      (p.type === "income" ? "credit" : "debit");
    const transactionDate = p.transaction_date ?? p.date ?? "";

    let categoryId = p.category_id ?? undefined;
    if (!categoryId && p.category) {
      const categories = await convex.query(api.categories.list, {});
      const match = categories.find(
        (c) =>
          c.name.toLowerCase() === p.category!.toLowerCase() ||
          c.name.toLowerCase().includes(p.category!.toLowerCase()),
      );
      categoryId = match?.id;
    }

    const transaction = await convex.mutation(api.transactions.createMine, {
      description: p.description,
      amount: p.amount,
      transactionType,
      transactionDate,
      categoryExternalId: categoryId,
      confidenceScore: categoryId ? 100 : undefined,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const POST = withRateLimit(handlePOST, { limit: 60 });
export const DELETE = withRateLimit(
  withAudit(handleDELETE, { action: "delete", resourceType: "transactions" }),
);
