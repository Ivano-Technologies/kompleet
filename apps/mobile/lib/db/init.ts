import * as SQLite from "expo-sqlite";
import { ALL_SCHEMAS } from "./schema";

const DB_NAME = "kompleet_expenses.db";

const NIGERIAN_CATEGORIES: [string, string][] = [
  ["cat-transport", "Transport (Okada/Fuel)"],
  ["cat-airtime", "Airtime/Data"],
  ["cat-market", "Market/Inventory"],
  ["cat-vat", "VAT (7.5%)"],
  ["cat-utilities", "Utilities"],
  ["cat-logistics", "Logistics"],
  ["cat-office", "Office Supplies"],
  ["cat-mileage", "Mileage"],
];

function seedExpenseCategoriesIfEmpty(database: SQLite.SQLiteDatabase): void {
  const rows = database.getAllSync<{ id: string }>(
    "select id from expense_categories limit 1",
  );
  if (rows.length > 0) return;
  for (const [id, name] of NIGERIAN_CATEGORIES) {
    database.runSync(
      "insert into expense_categories (id, user_id, name, is_custom) values (?, null, ?, 0)",
      [id, name],
    );
  }
}

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
}

export function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const database = getDb();
      for (const sql of ALL_SCHEMAS) {
        database.execSync(sql);
      }
      seedExpenseCategoriesIfEmpty(database);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}
