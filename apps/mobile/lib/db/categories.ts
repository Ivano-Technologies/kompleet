/**
 * Expense categories: Nigerian defaults + custom (cached in SQLite).
 */
import { getDb } from "./init";

export interface CategoryRow {
  id: string;
  user_id: string | null;
  name: string;
  is_custom: number;
  created_at: string | null;
}

const NIGERIAN_DEFAULTS: { id: string; name: string }[] = [
  { id: "cat-transport", name: "Transport (Okada/Fuel)" },
  { id: "cat-airtime", name: "Airtime/Data" },
  { id: "cat-market", name: "Market/Inventory" },
  { id: "cat-vat", name: "VAT (7.5%)" },
  { id: "cat-utilities", name: "Utilities" },
  { id: "cat-logistics", name: "Logistics" },
  { id: "cat-office", name: "Office Supplies" },
];

function seedDefaultsIfNeeded(): void {
  const db = getDb();
  const rows = db.getAllSync<{ id: string }>(
    "select id from expense_categories limit 1",
  );
  if (rows.length > 0) return;
  for (const c of NIGERIAN_DEFAULTS) {
    db.runSync(
      "insert into expense_categories (id, user_id, name, is_custom) values (?, null, ?, 0)",
      [c.id, c.name],
    );
  }
}

export function listCategories(): CategoryRow[] {
  seedDefaultsIfNeeded();
  const db = getDb();
  return db.getAllSync<CategoryRow>(
    "select id, user_id, name, is_custom, created_at from expense_categories order by is_custom, name",
  );
}

export function getCategoryNameById(id: string | null): string {
  if (!id) return "";
  const db = getDb();
  const rows = db.getAllSync<{ name: string }>(
    "select name from expense_categories where id = ?",
    [id],
  );
  return rows[0]?.name ?? "";
}
