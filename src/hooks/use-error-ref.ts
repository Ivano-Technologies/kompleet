"use client";

import { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { generateRef, refFromEventId, splitRef } from "@/lib/friendly-error";

/**
 * Stable support ref for an error banner. Reuses a ref already embedded in
 * `source` (e.g. from toFriendlyMessage), otherwise generates one. A new ref
 * is issued when `key` changes (e.g. a different message). Logs the ref with
 * `detail` once per ref while `active` is true.
 */
export function useErrorRef(
  active: boolean,
  context: string,
  detail?: unknown,
  source?: string | null,
  key?: string,
): string {
  const [state, setState] = useState(() => ({ key, ref: generateRef() }));
  let generated = state.ref;
  if (state.key !== key) {
    generated = generateRef();
    setState({ key, ref: generated });
  }
  const embedded = source ? splitRef(source).ref : null;
  const ref = embedded ?? generated;
  const lastLogged = useRef<string | null>(null);
  const detailRef = useRef(detail);
  useEffect(() => {
    detailRef.current = detail;
  });

  useEffect(() => {
    if (active && lastLogged.current !== ref) {
      lastLogged.current = ref;
      console.warn(`[friendly-error] ref=${ref} context=${context}`, detailRef.current);
    }
    if (!active) lastLogged.current = null;
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
    console.warn(`[friendly-error] ref=${next} context=${context}`, error);
    setRef(next);
  }, [error, context]);
  return ref;
}
