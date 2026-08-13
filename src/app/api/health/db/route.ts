/**
 * Database keep-alive health check.
 *
 * GET /api/health — static, does not touch Postgres. Pinging it will not
 * prevent free-tier pause. This route runs one cheap real read so scheduled
 * traffic keeps the project awake.
 *
 * Protects with `x-keepalive-token` vs `KEEPALIVE_TOKEN`. The repo is public
 * and the URL is discoverable; fail closed if the env token is unset.
 * Uses the anon/RLS client, never service role.
 *
 * `tax_rules` SELECT is authenticated-only, so anon may see 0 rows. A 0-row
 * round-trip is still a successful query. Connection/PostgREST errors are not.
 */

import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tokenMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const timestamp = new Date().toISOString();
  const expected = process.env.KEEPALIVE_TOKEN;

  if (!expected) {
    return NextResponse.json(
      { status: "misconfigured", timestamp },
      { status: 503 },
    );
  }

  if (!tokenMatches(request.headers.get("x-keepalive-token"), expected)) {
    return NextResponse.json(
      { status: "unauthorized", timestamp },
      { status: 401 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ status: "error", timestamp }, { status: 503 });
  }

  const started = performance.now();
  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase
      .from("tax_rules")
      .select("id", { count: "exact", head: true });
    const dbLatencyMs = Math.round(performance.now() - started);

    if (error) {
      return NextResponse.json(
        { status: "error", dbLatencyMs, timestamp },
        { status: 503 },
      );
    }

    return NextResponse.json({ status: "ok", dbLatencyMs, timestamp });
  } catch {
    const dbLatencyMs = Math.round(performance.now() - started);
    return NextResponse.json(
      { status: "error", dbLatencyMs, timestamp },
      { status: 503 },
    );
  }
}
