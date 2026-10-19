/**
 * Display names for regulatory sources.
 *
 * Source rows keep their stored names (lookups such as populate_tax_rules.sql
 * match on them), so we only remap the text shown in the UI. The Federal
 * Inland Revenue Service is now the Nigeria Revenue Service (NRS).
 */
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  "Federal Inland Revenue Service (FIRS)": "NRS (Nigeria Revenue Service)",
  "Federal Inland Revenue Service": "NRS (Nigeria Revenue Service)",
  FIRS: "NRS (Nigeria Revenue Service)",
};

export function sourceDisplayName(name: string | null | undefined): string {
  if (!name) return "";
  return SOURCE_DISPLAY_NAMES[name.trim()] ?? name;
}
