/**
 * Offline-first sync engine: drain sync_queue when online, last-write-wins.
 * Push local changes to Path B `/api/expenses`; pull remote changes since last_synced_at.
 */

import { getDb } from "@/lib/db/init";
import { apiFetch } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/convex-auth";

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

interface ExpenseApi {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  currency: string;
  category_id: string | null;
  vendor: string | null;
  vat_amount: number | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Run sync: push queued operations to Convex via web APIs, then pull remote expenses.
 */
export async function runSync(): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] };
  const token = await getAccessToken();
  if (!token) {
    result.errors.push("Not signed in");
    return result;
  }

  const db = getDb();
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
        const response = await apiFetch("/api/expenses", token, {
          method: "POST",
          body: JSON.stringify({
            id: payload.id,
            date: payload.date,
            amount: payload.amount,
            currency: payload.currency ?? "NGN",
            category_id: payload.category_id ?? null,
            vendor: payload.vendor ?? null,
            vat_amount: payload.vat_amount ?? 0,
            receipt_url: payload.receipt_url ?? null,
            notes: payload.notes ?? null,
          }),
        });
        if (!response.ok) {
          result.errors.push(await response.text());
        } else {
          result.pushed++;
        }
      } else if (row.operation === "update" && payload) {
        const id = String(payload.id ?? row.entity_id);
        const response = await apiFetch(`/api/expenses/${id}`, token, {
          method: "PATCH",
          body: JSON.stringify({
            date: payload.date,
            amount: payload.amount,
            currency: payload.currency,
            category_id: payload.category_id ?? null,
            vendor: payload.vendor ?? null,
            vat_amount: payload.vat_amount,
            receipt_url: payload.receipt_url ?? null,
            notes: payload.notes ?? null,
          }),
        });
        if (!response.ok) {
          result.errors.push(await response.text());
        } else {
          result.pushed++;
        }
      } else if (row.operation === "delete") {
        const response = await apiFetch(`/api/expenses/${row.entity_id}`, token, {
          method: "DELETE",
        });
        if (!response.ok && response.status !== 404) {
          result.errors.push(await response.text());
        } else {
          result.pushed++;
        }
      }
      db.runSync("delete from sync_queue where id = ?", [row.id]);
    } catch (e) {
      result.errors.push(String(e));
    }
  }

  const lastSynced = getLastSyncedAt() ?? "1970-01-01T00:00:00Z";
  let page = 1;
  const limit = 100;
  let pulled = 0;
  for (;;) {
    const response = await apiFetch(
      `/api/expenses?updatedSince=${encodeURIComponent(lastSynced)}&page=${page}&limit=${limit}`,
      token,
    );
    if (!response.ok) {
      result.errors.push(await response.text());
      return result;
    }
    const body = (await response.json()) as {
      expenses?: ExpenseApi[];
      total?: number;
    };
    const remote = body.expenses ?? [];
    for (const row of remote) {
      db.runSync(
        `insert or replace into expenses (
          id, user_id, date, amount, currency, category_id, vendor, vat_amount,
          receipt_url, notes, created_at, updated_at, synced_at, sync_status, deleted
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', 0)`,
        [
          row.id,
          row.user_id,
          row.date,
          row.amount,
          row.currency ?? "NGN",
          row.category_id ?? null,
          row.vendor ?? null,
          row.vat_amount ?? 0,
          row.receipt_url ?? null,
          row.notes ?? null,
          row.created_at,
          row.updated_at,
          row.updated_at,
        ],
      );
      pulled++;
    }
    if (remote.length < limit) break;
    page += 1;
  }

  result.pulled = pulled;
  setLastSyncedAt(new Date().toISOString());
  return result;
}
