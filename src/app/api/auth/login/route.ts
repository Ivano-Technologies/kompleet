/**
 * Legacy login API. Web login now uses Convex Auth (`useAuthActions`)
 * which writes cookies via `/api/auth`. Kept so old clients get a clear error.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Login moved to Convex Auth. Use the Sign in form (email + password).",
    },
    { status: 410 },
  );
}
