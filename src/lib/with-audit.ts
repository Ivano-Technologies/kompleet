/**
 * Audit Logging Middleware
 * Wraps API route handlers to auto-log successful operations to Convex auditLogs.
 * Fire-and-forget: audit failures don't block or fail the response.
 *
 * Usage:
 * export const POST = withRateLimit(withAudit(handlePOST, {
 *   action: 'create',
 *   resourceType: 'invoices',
 * }), { limit: 60 });
 */

import { NextRequest } from "next/server";
import { api } from "@/lib/convex/http";
import { getAuthedConvex } from "@/lib/convex/server";

interface AuditOptions {
  action: string;
  resourceType: string;
}

export function withAudit<Args extends unknown[]>(
  handler: (request: NextRequest, ...args: Args) => Promise<Response>,
  options: AuditOptions,
): (request: NextRequest, ...args: Args) => Promise<Response> {
  return async (request: NextRequest, ...args: Args) => {
    const response = await handler(request, ...args);

    if (response.ok) {
      Promise.resolve(
        (async () => {
          const authed = await getAuthedConvex(request);
          if (!authed) return;
          const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";
          await authed.convex.mutation(api.audit.append, {
            action: options.action,
            resourceType: options.resourceType,
            ipAddress: ip,
            userAgent: request.headers.get("user-agent") || "unknown",
          });
        })(),
      ).catch((err: unknown) => {
        console.error("[Audit Log Error]", err);
      });
    }

    return response;
  };
}
