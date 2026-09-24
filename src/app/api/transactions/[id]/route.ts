import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

async function handleGET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id } = await params;

    const transaction = await convex.query(api.transactions.getMine, {
      externalId: id,
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ transaction });
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

async function handlePUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id } = await params;
    const updates = await request.json();

    const existing = await convex.query(api.transactions.getMine, {
      externalId: id,
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    const transaction = await convex.mutation(api.transactions.updateMine, {
      externalId: id,
      description:
        typeof updates.description === "string" ? updates.description : undefined,
      amount: typeof updates.amount === "number" ? updates.amount : undefined,
      transactionType:
        updates.transaction_type === "debit" ||
        updates.transaction_type === "credit"
          ? updates.transaction_type
          : undefined,
      transactionDate:
        typeof updates.transaction_date === "string"
          ? updates.transaction_date
          : undefined,
      categoryExternalId:
        updates.category_id === null
          ? null
          : typeof updates.category_id === "string"
            ? updates.category_id
            : undefined,
      notes: typeof updates.notes === "string" ? updates.notes : undefined,
      isReconciled:
        typeof updates.is_reconciled === "boolean"
          ? updates.is_reconciled
          : undefined,
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id } = await params;

    const existing = await convex.query(api.transactions.getMine, {
      externalId: id,
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    await convex.mutation(api.transactions.removeMine, { externalIds: [id] });

    return NextResponse.json({
      success: true,
      message: "Transaction deleted",
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

export const GET = withRateLimit(handleGET);
export const PUT = withRateLimit(handlePUT);
export const DELETE = withRateLimit(handleDELETE);
