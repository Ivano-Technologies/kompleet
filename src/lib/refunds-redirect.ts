import { NextRequest, NextResponse } from "next/server";
import { COMPANY_LEGAL } from "@/lib/legal";

/**
 * 308 /refunds and /refunds/ to the company policy in one hop.
 * Must run in proxy/middleware: next.config redirects lose to the default
 * trailing-slash strip, which would 308 /refunds/ → /refunds first.
 */
export function redirectCompanyRefunds(
  request: NextRequest,
): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname !== "/refunds" && pathname !== "/refunds/") return null;
  return NextResponse.redirect(COMPANY_LEGAL.refunds, 308);
}
