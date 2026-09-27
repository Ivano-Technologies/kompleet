export interface ImportSessionLike {
  status: string;
  transactions_imported: number;
  file_name?: string | null;
}

export interface HasRealBooksInput {
  sessions: readonly ImportSessionLike[];
  transactionCount: number;
  demoMode?: boolean;
}

const SEED_NAME_HINTS = ["seed", "fixture", "demo-data", "demo_data"] as const;

/**
 * IVA-86 Design contract:
 * hasRealBooks =
 *   at least one successful statement import completed
 *   AND imported transaction count ≥ 1
 *   AND data is not seed/fixture/demo
 *
 * Demo mode is never treated as real books (www/prod default OFF).
 */
export function isSeedOrFixtureSession(
  fileName: string | null | undefined,
): boolean {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return SEED_NAME_HINTS.some((hint) => lower.includes(hint));
}

export function isSuccessfulImportSession(session: ImportSessionLike): boolean {
  if (session.transactions_imported < 1) return false;
  if (isSeedOrFixtureSession(session.file_name)) return false;
  const status = session.status.toLowerCase();
  return status === "completed" || status === "success";
}

export function computeHasRealBooks(input: HasRealBooksInput): boolean {
  if (input.demoMode) return false;
  if (input.transactionCount < 1) return false;
  return input.sessions.some(isSuccessfulImportSession);
}

/**
 * Demo books are never first-run default. Requires an explicit env allow
 * plus a query flag — both must be on.
 */
export function isDemoBooksEnabled(input: {
  searchParam?: string | null;
  envFlag?: string | null;
}): boolean {
  return input.envFlag === "1" && input.searchParam === "1";
}
