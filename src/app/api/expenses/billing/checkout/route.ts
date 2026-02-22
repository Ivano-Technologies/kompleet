/**
 * POST /api/expenses/billing/checkout - Billing checkout stub.
 * Disabled until legal review. No real charges. Paystack/Flutterwave hooks placeholder.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Billing is disabled until legal review. No real charges.",
      code: "BILLING_DISABLED",
    },
    { status: 503 }
  );
}
