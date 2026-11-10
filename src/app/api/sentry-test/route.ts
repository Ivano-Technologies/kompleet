/**
 * Preview-only Sentry proof endpoint.
 * Enabled solely when VERCEL_ENV === "preview". Production, development,
 * and `next start` return 404 so this is never a public test-error surface.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { flushSentry, generateRef, refFromEventId } from "@/lib/friendly-error";
import { ensureServerSentry } from "@/lib/sentry/ensure";
import { withRateLimit } from "@/lib/with-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

async function handleGET(_request: NextRequest) {
  if (!isVercelPreview()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasDsn = await ensureServerSentry();
  const eventId = Sentry.captureException(
    new Error("kompleet sentry-test: preview proof"),
    {
      tags: {
        kompleet_sentry_test: "preview",
      },
      extra: {
        vercelEnv: process.env.VERCEL_ENV,
        hasDsn,
      },
    },
  );
  const flushed = await flushSentry(8000);
  const ref = refFromEventId(eventId) ?? generateRef();
  return NextResponse.json({
    ok: true,
    eventId,
    ref,
    flushed,
    hasDsn,
  });
}

export const GET = withRateLimit(handleGET, { limit: 5, window: 60_000 });
