import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const years = await convex.query(api.year.listMine, {});
    const currentYear = new Date().getFullYear();
    const fallback = [currentYear - 2, currentYear - 1, currentYear];
    return NextResponse.json({
      years: years.length > 0 ? years : fallback,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentYear = new Date().getFullYear();
    return NextResponse.json({
      years: [currentYear - 2, currentYear - 1, currentYear],
    });
  }
}

export const GET = handleGET;
