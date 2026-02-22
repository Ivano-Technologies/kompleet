import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

/**
 * Create a standardized API success response
 */
export function apiSuccess<T>(
  data: T,
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}

/**
 * Create a standardized API error response
 */
export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[],
): { valid: true } | { valid: false; missing: string[] } {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] };
  }
  return { valid: true };
}

/**
 * Get user ID from Supabase Auth session
 */
export async function getUserId(request: Request): Promise<string | null> {
  try {
    const { createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error("Failed to get user ID:", error);
    return null;
  }
}

/**
 * Require authentication for API route
 */
export async function requireAuth(
  request: Request,
): Promise<{ userId: string } | NextResponse<ApiResponse<never>>> {
  const userId = await getUserId(request);
  if (!userId) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  return { userId };
}
