/**
 * Audit Logging Middleware
 * Wraps API route handlers to auto-log successful operations to audit_logs.
 * Fire-and-forget: audit failures don't block or fail the response.
 *
 * Usage:
 * export const POST = withRateLimit(withAudit(handlePOST, {
 *   action: 'create',
 *   resourceType: 'invoices',
 * }), { limit: 60 });
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface AuditOptions {
  action: string;
  resourceType: string;
}

export function withAudit(
  handler: (request: NextRequest, context?: any) => Promise<Response>,
  options: AuditOptions,
): (request: NextRequest, context?: any) => Promise<Response> {
  return async (request: NextRequest, context?: any) => {
    const response = await handler(request, context);

    // Only log successful operations (2xx responses)
    if (response.ok) {
      try {
        const supabase = await createServerClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";

          // Fire-and-forget — don't await, don't block
          Promise.resolve(
            supabase.from("audit_logs").insert({
              user_id: user.id,
              action: options.action,
              resource_type: options.resourceType,
              ip_address: ip,
              user_agent: request.headers.get("user-agent") || "unknown",
            }),
          ).catch((err: unknown) => {
            console.error("[Audit Log Error]", err);
          });
        }
      } catch (err) {
        console.error("[Audit Log Error]", err);
      }
    }

    return response;
  };
}
