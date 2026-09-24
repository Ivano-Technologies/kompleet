/**
 * Bulk Export API
 * POST /api/export/bulk - Export all data as ZIP
 */

import { NextRequest, NextResponse } from "next/server";
import { createBulkExportZIP } from "@/lib/export-service";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAuth } from "@/lib/auth/with-auth";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const { tax_year } = body as { tax_year?: number };

    await convex.mutation(api.audit.append, {
      action: "export",
      resourceType: "bulk_data",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { format: "zip", tax_year: tax_year ?? null },
    });

    const buffer = await createBulkExportZIP(convex, tax_year);
    const filename = tax_year
      ? `kompleet_data_${tax_year}.zip`
      : "kompleet_data_all.zip";

    await convex.mutation(api.exports.createMine, {
      exportType: "bulk",
      format: "zip",
      taxYear: typeof tax_year === "number" ? tax_year : undefined,
      status: "complete",
      fileSize: buffer.length,
    });

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/export/bulk:", error);
    return NextResponse.json({ error: "Bulk export failed" }, { status: 500 });
  }
}

export const POST = withRateLimit(
  withAuth(handlePOST, { requiredPermission: "export:bulk" }),
  { limit: 20 },
);
