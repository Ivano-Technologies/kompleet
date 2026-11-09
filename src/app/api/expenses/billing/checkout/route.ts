/**
 * POST /api/expenses/billing/checkout - Billing checkout stub.
 * Disabled until legal review. No real charges. Paystack/Flutterwave hooks placeholder.
 */
import { NextRequest, NextResponse } from "next/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handlePOST(request: NextRequest) {
  return NextResponse.json({ ...apiErrorBody("Billing is disabled until legal review. No real charges."),
      code: "BILLING_DISABLED",
    },
    { status: 503 }
  );
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
