import { NextRequest } from "next/server";
import { apiSuccess, apiError, requireAuth } from "@/lib/api";
import { withRateLimit } from "@/lib/with-rate-limit";
import type { FinancialRecord, PaginatedResponse } from "@/types/api";

/**
 * GET /api/v1/records
 * List records with filtering and pagination
 */
async function handleGET(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if ("userId" in authResult === false) {
    return authResult; // Return error response
  }
  const { userId } = authResult;

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as "income" | "expense" | null;
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // TODO: Replace with actual database query
    // For now, return mock data
    const mockRecords: FinancialRecord[] = [
      {
        id: "1",
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
      },
      {
        id: "2",
        userId,
        type: "expense",
        amount: 50000,
        currency: "NGN",
        date: "2026-02-03",
        category: "Office Supplies",
        description: "Stationery and equipment",
        taxCode: "VAT-002",
        vatAmount: 3750,
        createdAt: "2026-02-03T14:30:00Z",
        updatedAt: "2026-02-03T14:30:00Z",
      },
    ];

    // Apply filters
    let filteredRecords = mockRecords;
    if (type) {
      filteredRecords = filteredRecords.filter((r) => r.type === type);
    }
    if (category) {
      filteredRecords = filteredRecords.filter((r) => r.category === category);
    }
    if (startDate) {
      filteredRecords = filteredRecords.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      filteredRecords = filteredRecords.filter((r) => r.date <= endDate);
    }

    // Apply pagination
    const total = filteredRecords.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedRecords = filteredRecords.slice(start, end);

    const response: PaginatedResponse<FinancialRecord> = {
      items: paginatedRecords,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };

    return apiSuccess(response);
  } catch (error) {
    console.error("GET /api/v1/records error:", error);
    return apiError("INTERNAL_ERROR", "Failed to fetch records", 500);
  }
}

/**
 * POST /api/v1/records
 * Create a new record
 */
async function handlePOST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if ("userId" in authResult === false) {
    return authResult;
  }
  const { userId } = authResult;

  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["type", "amount", "date", "category"];
    const missing = requiredFields.filter((field) => !body[field]);
    if (missing.length > 0) {
      return apiError(
        "VALIDATION_ERROR",
        `Missing required fields: ${missing.join(", ")}`,
        400,
      );
    }

    // Validate type
    if (!["income", "expense"].includes(body.type)) {
      return apiError(
        "VALIDATION_ERROR",
        'Type must be "income" or "expense"',
        400,
      );
    }

    // TODO: Replace with actual database insert
    const newRecord: FinancialRecord = {
      id: Math.random().toString(36).substring(7),
      userId,
      type: body.type,
      amount: body.amount,
      currency: body.currency || "NGN",
      date: body.date,
      category: body.category,
      description: body.description,
      attachments: body.attachments,
      taxCode: body.taxCode,
      vatAmount: body.vatAmount,
      metadata: body.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return apiSuccess(newRecord, 201);
  } catch (error) {
    console.error("POST /api/v1/records error:", error);
    return apiError("INTERNAL_ERROR", "Failed to create record", 500);
  }
}

export const GET = withRateLimit(handleGET);
export const POST = withRateLimit(handlePOST);
