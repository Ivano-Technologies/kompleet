import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { isValidEmail, trimToEmpty } from "@/lib/invoices/profiles";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateClientSchema = z.object({
  legal_name: z.string().trim().min(1).max(200).optional(),
  email: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  addressLine1: z.string().max(200).optional().or(z.literal("")),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(8).optional().or(z.literal("")),
});

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = updateClientSchema.safeParse(body);
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
    const client = await convex.mutation(api.tenancy.updateClient, {
      externalId: id,
      legalName: parsed.data.legal_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      addressLine1: parsed.data.addressLine1,
      addressLine2: parsed.data.addressLine2,
      city: parsed.data.city,
      state: parsed.data.state,
      country: parsed.data.country,
    });
    return NextResponse.json({ client });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to update client";
    const status = message === "Used on invoices" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

async function handleDELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex } = await requireAuthedConvex(request);
    try {
      await convex.mutation(api.tenancy.deleteClient, { externalId: id });
      return NextResponse.json({ hidden: true, used_on_issued: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "Used on invoices") {
        const result = await convex.mutation(api.tenancy.archiveClient, {
          externalId: id,
        });
        return NextResponse.json(result);
      }
      throw error;
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to hide client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PATCH = withRateLimit(
  withAudit(handlePATCH, { action: "update", resourceType: "clients" }),
);
export const DELETE = withRateLimit(
  withAudit(handleDELETE, { action: "delete", resourceType: "clients" }),
);
