"use client";

import { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { generateRef, refFromEventId, splitRef } from "@/lib/friendly-error";

/**
 * Stable support ref for an error banner. Reuses a ref already embedded in
 * `source` (e.g. from toFriendlyMessage), otherwise generates one. Logs the
 * ref with `detail` once each time `active` becomes true.
 */
export function useErrorRef(
  active: boolean,
  context: string,
  detail?: unknown,
  source?: string | null,
): string {
  const [generated] = useState(generateRef);
  const embedded = source ? splitRef(source).ref : null;
  const ref = embedded ?? generated;
  const logged = useRef(false);
  const detailRef = useRef(detail);
  detailRef.current = detail;

  useEffect(() => {
    if (active && !logged.current) {
      logged.current = true;
      console.error(`[friendly-error] ref=${ref} context=${context}`, detailRef.current);
    }
    if (!active) logged.current = false;
  }, [active, context, ref]);

  return ref;
}

/**
 * Ref for an error boundary: reports the error to Sentry once and uses the
 * Sentry event id as the ref (or a generated one), logged with the raw error.
 */
export function useBoundaryRef(error: unknown, context: string): string | null {
  const [ref, setRef] = useState<string | null>(null);
  useEffect(() => {
    let eventId: string | undefined;
    try {
      eventId = Sentry.captureException(error, { tags: { context } });
    } catch {
      // Sentry not configured.
    }
    const next = refFromEventId(eventId) ?? generateRef();
    console.error(`[friendly-error] ref=${next} context=${context}`, error);
    setRef(next);
  }, [error, context]);
  return ref;
}
