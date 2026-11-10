"use client";

import { isExpectedUiErrorMessage, splitRef } from "@/lib/friendly-error";
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
 * Plain expected copy (validation, 401/403/404, known auth) stays Ref-free.
 * Unexpected UI-set copy without an embedded Ref still gets one, unless
 * `issueGeneratedRef` is false (auth banners already embed Refs when needed).
 */
export function ErrorText({
  text,
  refClassName,
  context = "ui",
  issueGeneratedRef,
}: {
  text: string | null | undefined;
  refClassName?: string;
  context?: string;
  /**
   * true: always mint a Ref for plain text.
   * false: never mint (auth banners; unexpected copy already embeds a Ref).
   * omitted: mint only for unexpected UI-set errors.
   */
  issueGeneratedRef?: boolean;
}) {
  const { message, ref: embedded } = splitRef(text ?? "");
  const shouldIssue =
    Boolean(text) &&
    !embedded &&
    (issueGeneratedRef === true ||
      (issueGeneratedRef !== false && !isExpectedUiErrorMessage(message)));
  const ref = useErrorRef(
    shouldIssue,
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
        value={embedded ?? (shouldIssue ? ref : null)}
        className={refClassName}
      />
    </>
  );
}
