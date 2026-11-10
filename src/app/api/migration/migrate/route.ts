// TODO(IVA-64 Phase 5): data_migration_logs is not in Convex schema. Do not invent tables.
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

export const POST = withRateLimit(
  withAuth(async () => {
    return NextResponse.json({ ...apiErrorBody("Year-to-year migration is not on Convex yet. Do not invent data_migration_logs."),
      },
      { status: 501 },
    );
  }, { requiredPermission: "admin:access" }),
  { limit: 5 },
);
