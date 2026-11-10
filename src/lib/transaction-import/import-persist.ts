/**
 * Chunked Convex writes for bank-statement import.
 *
 * Batch-failure rule: ROLLBACK.
 * The import session stays "processing" until every batch succeeds. If any
 * createManyMine or addDuplicates batch fails, already-written transaction
 * rows from earlier batches are deleted (same chunk size) and the caller
 * marks the session "failed". Duplicate candidate rows already stored for
 * that session stay attached to the failed session — they are not ledger
 * rows. Retry is a full re-import of the file. If rollback itself fails,
 * leftover rows may remain; duplicate detection on retry still runs.
 *
 * After every write succeeds, the caller retries
 * `updateSession({ status: "completed", completed: true })`. If that stamp
 * still fails, the session stays "processing" (not "failed") so a later
 * completed update on the same session id can unhide the rows.
 */
import {
  IMPORT_DUPLICATE_BATCH_SIZE,
  IMPORT_WRITE_BATCH_SIZE,
} from "../../../convex/lib/importWrite";

export {
  IMPORT_DUPLICATE_BATCH_SIZE,
  IMPORT_WRITE_BATCH_MAX,
  IMPORT_WRITE_BATCH_SIZE,
  STATEMENT_TOO_LONG_MESSAGE,
} from "../../../convex/lib/importWrite";

export type ImportPersistItem = {
  description: string;
  amount: number;
  transactionType: "debit" | "credit";
  transactionDate: string;
  balance?: number;
  source?: string;
  reference?: string;
};

export type CreateManyResult = { ids: string[]; count: number };

export class ImportPersistError extends Error {
  readonly cause: unknown;
  readonly writtenIds: string[];
  readonly rolledBack: boolean;
  readonly leftoverIds: string[];

  constructor(
    cause: unknown,
    opts: { writtenIds: string[]; rolledBack: boolean; leftoverIds: string[] },
  ) {
    const inner = cause instanceof Error ? cause.message : "Import persist failed";
    super(inner);
    this.name = "ImportPersistError";
    this.cause = cause;
    this.writtenIds = opts.writtenIds;
    this.rolledBack = opts.rolledBack;
    this.leftoverIds = opts.leftoverIds;
  }
}

export function chunkRows<T>(
  rows: readonly T[],
  size: number = IMPORT_WRITE_BATCH_SIZE,
): T[][] {
  if (size < 1) {
    throw new Error("chunk size must be at least 1");
  }
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    out.push(rows.slice(i, i + size));
  }
  return out;
}

export async function rollbackWrittenIds(
  ids: readonly string[],
  removeMany: (ids: string[]) => Promise<number>,
  batchSize: number = IMPORT_WRITE_BATCH_SIZE,
): Promise<string[]> {
  const leftover: string[] = [];
  for (const chunk of chunkRows([...ids], batchSize)) {
    try {
      await removeMany(chunk);
    } catch (rollbackError) {
      console.error("Import rollback failed for a written batch", rollbackError);
      leftover.push(...chunk);
    }
  }
  return leftover;
}

export async function persistImportedTransactions(args: {
  items: ImportPersistItem[];
  duplicates?: unknown[];
  createMany: (items: ImportPersistItem[]) => Promise<CreateManyResult>;
  addDuplicates?: (candidates: unknown[]) => Promise<number>;
  removeMany: (ids: string[]) => Promise<number>;
}): Promise<{ imported: number; ids: string[] }> {
  const ids: string[] = [];
  try {
    if (args.duplicates && args.duplicates.length > 0) {
      if (!args.addDuplicates) {
        throw new Error("addDuplicates is required when duplicates are present");
      }
      for (const chunk of chunkRows(
        args.duplicates,
        IMPORT_DUPLICATE_BATCH_SIZE,
      )) {
        await args.addDuplicates(chunk);
      }
    }

    for (const chunk of chunkRows(args.items, IMPORT_WRITE_BATCH_SIZE)) {
      const result = await args.createMany(chunk);
      ids.push(...result.ids);
    }
  } catch (error) {
    const leftoverIds = await rollbackWrittenIds(ids, args.removeMany);
    throw new ImportPersistError(error, {
      writtenIds: ids,
      rolledBack: leftoverIds.length === 0,
      leftoverIds,
    });
  }

  return { imported: ids.length, ids };
}

export async function markImportSessionFailed(
  updateSession: (status: "failed") => Promise<unknown>,
): Promise<void> {
  try {
    await updateSession("failed");
  } catch (error) {
    console.error("Failed to mark import session as failed", error);
  }
}

export const IMPORT_SESSION_COMPLETE_ATTEMPTS = 3;

/**
 * Stamp the session completed after every write has already succeeded.
 * Retries a transient `updateSession({ completed: true })`. If it still
 * fails, leave the session in "processing" so a later call to
 * `imports.updateSession({ status: "completed", completed: true })` on the
 * same session id can unhide the rows. Never mark failed from this path —
 * the writes already landed.
 */
export async function completeImportSessionWithRetry(
  complete: () => Promise<unknown>,
  attempts: number = IMPORT_SESSION_COMPLETE_ATTEMPTS,
): Promise<{ completed: boolean; error?: unknown }> {
  let lastError: unknown;
  const tries = Math.max(1, attempts);
  for (let i = 0; i < tries; i++) {
    try {
      await complete();
      return { completed: true };
    } catch (error) {
      lastError = error;
    }
  }
  console.error("Failed to mark import session completed", lastError);
  return { completed: false, error: lastError };
}
