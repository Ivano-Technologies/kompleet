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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.log(
    "backfill-storage: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — skip.",
  );
  process.exit(0);
}

const base = supabaseUrl.replace(/\/$/, "");
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
};

const bucketRes = await fetch(`${base}/storage/v1/bucket`, { headers });
if (!bucketRes.ok) {
  console.error("backfill-storage: listBuckets failed", await bucketRes.text());
  process.exit(1);
}
const buckets = (await bucketRes.json()) ?? [];

let objectCount = 0;
for (const bucket of buckets) {
  const listRes = await fetch(`${base}/storage/v1/object/list/${bucket.name}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 1000 }),
  });
  if (!listRes.ok) {
    console.warn(
      `backfill-storage: list ${bucket.name} failed`,
      await listRes.text(),
    );
    continue;
  }
  const objects = (await listRes.json()) ?? [];
  const files = objects.filter((item) => item.id);
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
