import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

export async function PATCH(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = (await request.json()) as { fullName?: string };
    const profile = await convex.mutation(api.users.updateMine, {
      fullName: body.fullName,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("profile update:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
