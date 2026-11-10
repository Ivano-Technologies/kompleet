/**
 * Import persist batching.
 *
 * Convex mutations cap at 4,096 document reads and 8,192 array items.
 * createManyMine used to insert + get + hydrate every row in one call, so a
 * multi-year statement (~thousands of rows) died at mutationInner.
 *
 * The import route chunks writes into batches of IMPORT_WRITE_BATCH_SIZE.
 * Each mutation inserts only (no per-row get) and returns ids.
 *
 * Batch-failure rule: ROLLBACK.
 * If any createManyMine batch fails, already-written transaction ids from
 * earlier batches are deleted in the same chunk size via removeMine. The
 * import session stays "processing" until every batch succeeds, then
 * "completed"; any failure marks it "failed". Duplicate candidate rows
 * already stored for that session are left attached to the failed session
 * (they are not ledger rows). A retry is a full re-import of the file.
 * If rollback itself fails, leftover rows stay stamped with the session id
 * and remain hidden from the ledger (orphan policy: stay-hidden). Duplicate
 * detection on retry still runs via includePendingImports.
 */

export const IMPORT_WRITE_BATCH_SIZE = 400;
export const IMPORT_DUPLICATE_BATCH_SIZE = 250;
export const IMPORT_WRITE_BATCH_MAX = 500;

export const STATEMENT_TOO_LONG_MESSAGE =
  "This statement is too long. Try a shorter date range.";
