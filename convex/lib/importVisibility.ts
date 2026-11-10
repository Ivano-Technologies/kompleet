/**
 * Import rows stay off the ledger until their session is completed.
 *
 * Orphan policy: STAY HIDDEN.
 * A killed or timed-out import leaves the session in "processing" (or
 * "failed" if the route managed to mark it). Those rows keep
 * importSessionExternalId and never appear in list, dashboard, totals, or
 * export. They are not auto-deleted, so a timeout cannot wipe a retry's
 * duplicate-detection set. Missing importSessionExternalId (legacy / manual
 * rows) stays visible — additive, no backfill.
 */
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const IMPORT_ORPHAN_POLICY = "stay-hidden" as const;

export function isImportLedgerVisible(
  row: { importSessionExternalId?: string },
  completedSessionExternalIds: ReadonlySet<string>,
): boolean {
  if (!row.importSessionExternalId) return true;
  return completedSessionExternalIds.has(row.importSessionExternalId);
}

export function isImportDuplicateVisible(
  row: { sessionExternalId?: string },
  completedSessionExternalIds: ReadonlySet<string>,
): boolean {
  return isImportLedgerVisible(
    { importSessionExternalId: row.sessionExternalId },
    completedSessionExternalIds,
  );
}

export function ledgerRowsForDisplay<T extends { importSessionExternalId?: string }>(
  rows: T[],
  completedSessionExternalIds: ReadonlySet<string>,
): T[] {
  return rows.filter((row) =>
    isImportLedgerVisible(row, completedSessionExternalIds),
  );
}

export async function completedImportSessionIds(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Set<string>> {
  const sessions = await ctx.db
    .query("importSessions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const completed = new Set<string>();
  for (const session of sessions) {
    if (session.status === "completed") completed.add(session.externalId);
  }
  return completed;
}
