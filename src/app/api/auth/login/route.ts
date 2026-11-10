/**
 * Legacy login API. Web login now uses Convex Auth (`useAuthActions`)
 * which writes cookies via `/api/auth`. Kept so old clients get a clear error.
 */

import { NextResponse } from "next/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handlePOST() {
  return NextResponse.json({ ...apiErrorBody("Login moved to Convex Auth. Use the Sign in form (email + password)."),
    },
    { status: 410 },
  );
}

export const POST = withRateLimit(handlePOST, { limit: 10, window: 60_000 });
