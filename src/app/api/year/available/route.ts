import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import { getAuthedConvex } from "@/lib/convex/server";
import { defaultTaxYears } from "@/lib/tax-years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function yearsPayload(years: number[]) {
  const fallback = defaultTaxYears();
  return { years: years.length > 0 ? years : fallback };
}

async function handleGET(request: NextRequest) {
  try {
    const authed = await getAuthedConvex(request);
    if (!authed) {
      // Year switcher is a convenience UI with a calendar fallback. Returning
      // 401 here made root-layout fetches look like a session failure even
      // when /dashboard is fine. Empty/unauthenticated → 200 + fallback.
      return NextResponse.json(yearsPayload([]));
    }
    const years = await authed.convex.query(api.year.listMine, {});
    return NextResponse.json(yearsPayload(Array.isArray(years) ? years : []));
  } catch (error) {
    console.error("Error in GET /api/year/available:", error);
    return NextResponse.json(yearsPayload([]));
  }
}

export const GET = handleGET;
