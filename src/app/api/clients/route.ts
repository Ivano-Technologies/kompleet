import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { isValidEmail, trimToEmpty } from "@/lib/invoices/profiles";
import { z } from "zod";

const createClientSchema = z.object({
  legal_name: z.string().trim().min(1).max(200),
  email: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  addressLine1: z.string().max(200).optional().or(z.literal("")),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(8).optional().or(z.literal("")),
});

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const clients = await convex.query(api.tenancy.listMyClients, {});
    return NextResponse.json({ clients });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to list clients" },
      { status: 500 },
    );
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = createClientSchema.safeParse(body);
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

    const client = await convex.mutation(api.tenancy.createClient, {
      legalName: parsed.data.legal_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      addressLine1: parsed.data.addressLine1,
      addressLine2: parsed.data.addressLine2,
      city: parsed.data.city,
      state: parsed.data.state,
      country: parsed.data.country,
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to create client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withRateLimit(handleGET);
export const POST = withRateLimit(
  withAudit(handlePOST, { action: "create", resourceType: "clients" }),
  { limit: 40 },
);
