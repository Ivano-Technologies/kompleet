#!/usr/bin/env node
/**
 * Copy objects from Supabase Storage into Convex file storage.
 *
 * Path B README recorded the KOMPLEET buckets as empty. This script lists
 * buckets; if there are no objects it exits 0 and writes a status line.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   NEXT_PUBLIC_CONVEX_URL=https://shiny-cricket-316.convex.cloud \
 *   node scripts/backfill-supabase-storage-to-convex.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.log(
    "backfill-storage: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — skip.",
  );
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
if (bucketError) {
  console.error("backfill-storage: listBuckets failed", bucketError.message);
  process.exit(1);
}

let objectCount = 0;
for (const bucket of buckets ?? []) {
  const { data: objects, error } = await supabase.storage
    .from(bucket.name)
    .list("", { limit: 1000 });
  if (error) {
    console.warn(`backfill-storage: list ${bucket.name} failed`, error.message);
    continue;
  }
  const files = (objects ?? []).filter((item) => item.id);
  objectCount += files.length;
  console.log(
    `backfill-storage: bucket ${bucket.name} objects=${files.length}`,
  );
}

if (objectCount === 0) {
  console.log(
    "backfill-storage: no objects in Supabase Storage — nothing to copy. Skip.",
  );
  process.exit(0);
}

console.log(
  `backfill-storage: found ${objectCount} object(s). Download each file and POST to Convex generateUploadUrl, then patch documents/importSessions/expenses.receiptStorageId. Not auto-run because buckets were expected empty; re-run after confirming paths.`,
);
process.exit(2);
