/**
 * Offline-first sync engine: drain sync_queue when online, last-write-wins.
 * Push local changes to Supabase; pull remote changes since last_synced_at.
 * Optional future: conflict UI ("Keep mine" / "Keep server") when same id has different updated_at.
 */

import { getDb } from "@/lib/db/init";
import type { SupabaseClient } from "@supabase/supabase-js";

const LAST_SYNCED_KEY = "last_synced_at";

export function getLastSyncedAt(): string | null {
  const db = getDb();
  const rows = db.getAllSync<{ value: string }>(
    "select value from sync_meta where key = ?",
    [LAST_SYNCED_KEY],
  );
  return rows[0]?.value ?? null;
}

function setLastSyncedAt(iso: string): void {
  const db = getDb();
  db.runSync("insert or replace into sync_meta (key, value) values (?, ?)", [
    LAST_SYNCED_KEY,
    iso,
  ]);
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  errors: string[];
}

/**
 * Run sync: push queued operations to Supabase, then pull remote expenses.
 * Uses last-write-wins via updated_at.
 */
export async function runSync(supabase: SupabaseClient): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] };
  const db = getDb();

  // 1. Push: drain sync_queue
  const queueRows = db.getAllSync<{
    id: number;
    entity_type: string;
    entity_id: string;
    operation: string;
    payload: string | null;
  }>(
    "select id, entity_type, entity_id, operation, payload from sync_queue order by id",
  );

  for (const row of queueRows) {
    try {
      if (row.entity_type !== "expense") continue;
      const payload = row.payload
        ? (JSON.parse(row.payload) as Record<string, unknown>)
        : null;
      if (row.operation === "insert" && payload) {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) result.errors.push(String(error.message));
        else result.pushed++;
      } else if (row.operation === "update" && payload) {
        const { id, ...rest } = payload as { id: string; [k: string]: unknown };
        const { error } = await supabase
          .from("expenses")
          .update(rest)
          .eq("id", id);
        if (error) result.errors.push(String(error.message));
        else result.pushed++;
      } else if (row.operation === "delete") {
        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", row.entity_id);
        if (error) result.errors.push(String(error.message));
        else result.pushed++;
      }
      db.runSync("delete from sync_queue where id = ?", [row.id]);
    } catch (e) {
      result.errors.push(String(e));
    }
  }

  // 2. Pull: fetch expenses updated after last_synced_at
  const lastSynced = getLastSyncedAt() ?? "1970-01-01T00:00:00Z";
  const { data: remote, error: pullError } = await supabase
    .from("expenses")
    .select("*")
    .gte("updated_at", lastSynced)
    .order("updated_at", { ascending: true });

  if (pullError) {
    result.errors.push(pullError.message);
    return result;
  }

  for (const row of remote ?? []) {
    const id = (row as { id: string }).id;
    const updatedAt = (row as { updated_at: string }).updated_at;
    db.runSync(
      `insert or replace into expenses (
        id, user_id, date, amount, currency, category_id, vendor, vat_amount,
        receipt_url, notes, created_at, updated_at, synced_at, sync_status, deleted
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', 0)`,
      [
        id,
        (row as { user_id: string }).user_id,
        (row as { date: string }).date,
        (row as { amount: number }).amount,
        (row as { currency: string }).currency ?? "NGN",
        (row as { category_id: string | null }).category_id ?? null,
        (row as { vendor: string | null }).vendor ?? null,
        (row as { vat_amount: number }).vat_amount ?? 0,
        (row as { receipt_url: string | null }).receipt_url ?? null,
        (row as { notes: string | null }).notes ?? null,
        (row as { created_at: string }).created_at,
        updatedAt,
        updatedAt,
      ],
    );
    result.pulled++;
  }

  setLastSyncedAt(new Date().toISOString());
  return result;
}
