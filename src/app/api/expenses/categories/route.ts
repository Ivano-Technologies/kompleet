/**
 * GET /api/expenses/categories - List expense categories (system + user's custom).
 */
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { friendlyErrorBody, apiErrorBody } from "@/lib/friendly-error";

export async function GET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const categories = await convex.query(api.expenses.listCategories, {});
    return NextResponse.json({ categories });
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
