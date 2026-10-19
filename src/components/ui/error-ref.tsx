import { splitRef } from "@/lib/friendly-error";

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
 * Render a friendly error string. A trailing "Ref: XXXXXXXX" (from
 * `toFriendlyMessage` or `apiErrorMessage`) is shown as a muted line.
 */
export function ErrorText({
  text,
  refClassName,
}: {
  text: string | null | undefined;
  refClassName?: string;
}) {
  if (!text) return null;
  const { message, ref } = splitRef(text);
  return (
    <>
      {message}
      <ErrorRef value={ref} className={refClassName} />
    </>
  );
}
