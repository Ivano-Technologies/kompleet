import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id: formId } = await params;
    const body = await request.json();
    const { confirmationNumber, filedDate, notes } = body as {
      confirmationNumber?: string;
      filedDate?: string;
      notes?: string;
    };

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 },
      );
    }
    if (!confirmationNumber || confirmationNumber.trim() === "") {
      return NextResponse.json(
        { error: "Confirmation number is required" },
        { status: 400 },
      );
    }

    try {
      const filingStatus = await convex.mutation(api.forms.markFiled, {
        externalId: formId,
        confirmationNumber: confirmationNumber.trim(),
        filedAt: filedDate,
        notes,
      });
      return NextResponse.json({
        success: true,
        message: "Form marked as filed successfully",
        filingStatus,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("already marked")) {
        return NextResponse.json(
          { error: "Form is already marked as filed" },
          { status: 400 },
        );
      }
      if (message.includes("not found")) {
        return NextResponse.json(
          { error: "Form not found or access denied" },
          { status: 404 },
        );
      }
      throw err;
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Mark filed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id: formId } = await params;
    const filingStatus = await convex.query(api.forms.listFilingStatuses, {
      externalId: formId,
    });
    return NextResponse.json({
      success: true,
      filingStatus,
      count: filingStatus.length,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get filing status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST);
export const GET = withRateLimit(handleGET);
