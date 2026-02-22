import { NextRequest } from "next/server";
import { apiSuccess, apiError, requireAuth } from "@/lib/api";
import { withRateLimit } from "@/lib/with-rate-limit";
import type { FinancialRecord } from "@/types/api";

/**
 * GET /api/v1/records/:id
 * Get a single record by ID
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if ("userId" in authResult === false) {
    return authResult;
  }
  const { userId } = authResult;
  const { id } = await params;

  try {
    // TODO: Replace with actual database query
    const mockRecord: FinancialRecord = {
      id,
      userId,
      type: "income",
      amount: 150000,
      currency: "NGN",
      date: "2026-02-01",
      category: "Sales",
      description: "Product sales - January",
      taxCode: "VAT-001",
      vatAmount: 11250,
      createdAt: "2026-02-01T10:00:00Z",
      updatedAt: "2026-02-01T10:00:00Z",
    };

    return apiSuccess(mockRecord);
  } catch (error) {
    console.error(`GET /api/v1/records/${id} error:`, error);
    return apiError("INTERNAL_ERROR", "Failed to fetch record", 500);
  }
}

/**
 * PUT /api/v1/records/:id
 * Update a record
 */
async function handlePUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if ("userId" in authResult === false) {
    return authResult;
  }
  const { userId } = authResult;
  const { id } = await params;

  try {
    const body = await request.json();

    // TODO: Replace with actual database update
    const updatedRecord: FinancialRecord = {
      id,
      userId,
      type: body.type || "income",
      amount: body.amount || 0,
      currency: body.currency || "NGN",
      date: body.date || new Date().toISOString().split("T")[0],
      category: body.category || "Uncategorized",
      description: body.description,
      attachments: body.attachments,
      taxCode: body.taxCode,
      vatAmount: body.vatAmount,
      metadata: body.metadata,
      createdAt: "2026-02-01T10:00:00Z",
      updatedAt: new Date().toISOString(),
    };

    return apiSuccess(updatedRecord);
  } catch (error) {
    console.error(`PUT /api/v1/records/${id} error:`, error);
    return apiError("INTERNAL_ERROR", "Failed to update record", 500);
  }
}

/**
 * DELETE /api/v1/records/:id
 * Delete a record
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if ("userId" in authResult === false) {
    return authResult;
  }
  const { id } = await params;

  try {
    // TODO: Replace with actual database delete
    return apiSuccess({ success: true, id });
  } catch (error) {
    console.error(`DELETE /api/v1/records/${id} error:`, error);
    return apiError("INTERNAL_ERROR", "Failed to delete record", 500);
  }
}

export const GET = withRateLimit(handleGET);
export const PUT = withRateLimit(handlePUT);
export const DELETE = withRateLimit(handleDELETE);
