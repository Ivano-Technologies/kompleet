"use client";

import { splitRef } from "@/lib/friendly-error";
import { useErrorRef } from "@/hooks/use-error-ref";

/** Small muted "Ref: XXXXXXXX" line shown under every friendly error. */
export function ErrorRef({
  value,
  className = "",
}: {
  value: string | null | undefined;
  className?: string;
}) {
  if (!value) return null;
  return (
    <span
      data-testid="error-ref"
      className={`mt-1 block font-mono text-[11px] font-normal tracking-wide text-gray-500 dark:text-gray-400 ${className}`}
    >
      Ref: {value}
    </span>
  );
}

/**
 * Render a friendly error string with its muted ref line. A trailing
 * "Ref: XXXXXXXX" (from `toFriendlyMessage` or `apiErrorMessage`) is reused;
 * otherwise (e.g. an input error we set ourselves) a ref is issued and
 * logged with the message, so every error a user sees has a ref.
 */
export function ErrorText({
  text,
  refClassName,
  context = "ui",
}: {
  text: string | null | undefined;
  refClassName?: string;
  context?: string;
}) {
  const { message, ref: embedded } = splitRef(text ?? "");
  const ref = useErrorRef(Boolean(text) && !embedded, context, message, text, message);
  if (!text) return null;
  return (
    <>
      {message}
      <ErrorRef value={embedded ?? ref} className={refClassName} />
    </>
  );
}
