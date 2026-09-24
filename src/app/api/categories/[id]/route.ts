import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

export const runtime = "nodejs";

async function handlePUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const { name, description, keywords } = body as {
      name?: string;
      description?: string;
      keywords?: string[] | string;
    };

    const category = await convex.mutation(api.categories.updateByExternalId, {
      externalId: id,
      name,
      description,
      keywords: Array.isArray(keywords)
        ? keywords
        : typeof keywords === "string"
          ? [keywords]
          : undefined,
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in PUT /api/categories/[id]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export const PUT = withRateLimit(handlePUT, { limit: 120 });
