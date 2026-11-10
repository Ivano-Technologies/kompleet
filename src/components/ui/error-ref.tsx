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
 * Render a friendly error string. A trailing "Ref: XXXXXXXX" from
 * `toFriendlyMessage` (unexpected errors only) is shown as a muted line.
 * Known/expected copy has no embedded ref and none is generated.
 */
export function ErrorText({
  text,
  refClassName,
  context = "ui",
  issueGeneratedRef = false,
}: {
  text: string | null | undefined;
  refClassName?: string;
  context?: string;
  /** When true, generate a Ref for plain text that has none. Default false. */
  issueGeneratedRef?: boolean;
}) {
  const { message, ref: embedded } = splitRef(text ?? "");
  const ref = useErrorRef(
    Boolean(text) && !embedded && issueGeneratedRef,
    context,
    message,
    text,
    message,
  );
  if (!text) return null;
  return (
    <>
      {message}
      <ErrorRef
        value={embedded ?? (issueGeneratedRef ? ref : null)}
        className={refClassName}
      />
    </>
  );
}
