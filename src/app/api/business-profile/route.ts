import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { isValidEmail, trimToEmpty } from "@/lib/invoices/profiles";
import { z } from "zod";

const upsertSchema = z.object({
  legalName: z.string().max(200).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(8).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  tin: z.string().max(50).optional(),
  vatNumber: z.string().max(50).optional(),
});

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const profile = await convex.query(api.tenancy.getMyBusinessProfile, {});
    return NextResponse.json({ profile });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load business profile" },
      { status: 500 },
    );
  }
}

async function handlePATCH(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const email = trimToEmpty(parsed.data.email);
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    const profile = await convex.mutation(api.tenancy.upsertMyBusinessProfile, {
      legalName: parsed.data.legalName,
      addressLine1: parsed.data.addressLine1,
      addressLine2: parsed.data.addressLine2,
      city: parsed.data.city,
      state: parsed.data.state,
      country: parsed.data.country,
      email: parsed.data.email,
      phone: parsed.data.phone,
      tin: parsed.data.tin,
      vatNumber: parsed.data.vatNumber,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to save business profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withRateLimit(handleGET);
export const PATCH = withRateLimit(
  withAudit(handlePATCH, { action: "update", resourceType: "business_profile" }),
);
