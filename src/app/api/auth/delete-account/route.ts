/**
 * Delete Account API
 * POST /api/auth/delete-account
 *
 * Erases or anonymises the caller's personal data. Issued invoices are kept
 * as tax records with buyer and seller fields replaced.
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { z } from "zod";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { DELETE_ACCOUNT_PHRASE } from "@/lib/account-deletion";

const deleteAccountSchema = z.object({
  confirmText: z.literal(DELETE_ACCOUNT_PHRASE, {
    error: "Type delete my account to confirm.",
  }),
});

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const parsed = deleteAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ...apiErrorBody("Type delete my account to confirm."),
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    await convex.mutation(api.accountDeletion.eraseMine, {});

    return NextResponse.json({
      success: true,
      message: "Your account has been deleted.",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("[Delete Account Error]", error);
    return NextResponse.json({ ...apiErrorBody("Internal server error") },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 3, window: 3600000 });
