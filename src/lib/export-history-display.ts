import { EXPORT_LINK_TTL_MS } from "../../convex/lib/exportExpiry";

export function formatExportExpiry(
  expiresAt: string | null | undefined,
  createdAt: string,
  nowLocale: (date: Date) => string = (date) => date.toLocaleString("en-NG"),
): string {
  const parsed = expiresAt ? new Date(expiresAt) : null;
  if (
    parsed &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() > 1970
  ) {
    return nowLocale(parsed);
  }
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "—";
  return nowLocale(new Date(created.getTime() + EXPORT_LINK_TTL_MS));
}

export function shouldShowExportEmptyState(
  loading: boolean,
  historyLength: number,
): boolean {
  return !loading && historyLength === 0;
}
