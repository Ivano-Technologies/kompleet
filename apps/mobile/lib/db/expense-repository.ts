/**
 * Offline-first expense data access: write local first, enqueue sync.
 */

import { getDb } from './init';

export interface ExpenseRow {
  id: string;
  local_id: string | null;
  user_id: string;
  date: string;
  amount: number;
  currency: string;
  category_id: string | null;
  vendor: string | null;
  vat_amount: number;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  sync_status: string;
  deleted: number;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

function enqueueSync(
  db: ReturnType<typeof getDb>,
  entityType: string,
  entityId: string,
  operation: 'insert' | 'update' | 'delete',
  payload: Record<string, unknown> | null
): void {
  db.runSync(
    'insert into sync_queue (entity_type, entity_id, operation, payload) values (?, ?, ?, ?)',
    [entityType, entityId, operation, payload ? JSON.stringify(payload) : null]
  );
}

export function createExpense(
  userId: string,
  input: {
    date: string;
    amount: number;
    currency?: string;
    categoryId?: string | null;
    vendor?: string | null;
    vatAmount?: number;
    receiptUrl?: string | null;
    notes?: string | null;
  }
): ExpenseRow {
  const db = getDb();
  const id = uuid();
  const ts = now();
  db.runSync(
    `insert into expenses (
      id, local_id, user_id, date, amount, currency, category_id, vendor, vat_amount,
      receipt_url, notes, created_at, updated_at, sync_status, deleted
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
    [
      id,
      id,
      userId,
      input.date,
      input.amount,
      input.currency ?? 'NGN',
      input.categoryId ?? null,
      input.vendor ?? null,
      input.vatAmount ?? 0,
      input.receiptUrl ?? null,
      input.notes ?? null,
      ts,
      ts,
    ]
  );
  enqueueSync(db, 'expense', id, 'insert', {
    id,
    user_id: userId,
    date: input.date,
    amount: input.amount,
    currency: input.currency ?? 'NGN',
    category_id: input.categoryId ?? null,
    vendor: input.vendor ?? null,
    vat_amount: input.vatAmount ?? 0,
    receipt_url: input.receiptUrl ?? null,
    notes: input.notes ?? null,
    created_at: ts,
    updated_at: ts,
  });
  return getExpenseById(id)!;
}

export function getExpenseById(id: string): ExpenseRow | null {
  const db = getDb();
  const rows = db.getAllSync<ExpenseRow>(
    'select * from expenses where id = ? and deleted = 0',
    [id]
  );
  return rows[0] ?? null;
}

export function listExpenses(userId: string, limit = 100): ExpenseRow[] {
  const db = getDb();
  return db.getAllSync<ExpenseRow>(
    'select * from expenses where user_id = ? and deleted = 0 order by date desc, created_at desc limit ?',
    [userId, limit]
  );
}

/** List expenses within date range (inclusive) for export. */
export function listExpensesInRange(
  userId: string,
  startDate: string,
  endDate: string
): ExpenseRow[] {
  const db = getDb();
  return db.getAllSync<ExpenseRow>(
    'select * from expenses where user_id = ? and deleted = 0 and date >= ? and date <= ? order by date asc',
    [userId, startDate, endDate]
  );
}

export function updateExpense(
  id: string,
  input: Partial<{
    date: string;
    amount: number;
    currency: string;
    categoryId: string | null;
    vendor: string | null;
    vatAmount: number;
    receiptUrl: string | null;
    notes: string | null;
  }>
): ExpenseRow | null {
  const db = getDb();
  const row = getExpenseById(id);
  if (!row) return null;
  const ts = now();
  db.runSync(
    `update expenses set
      date = coalesce(?, date), amount = coalesce(?, amount), currency = coalesce(?, currency),
      category_id = ?, vendor = coalesce(?, vendor), vat_amount = coalesce(?, vat_amount),
      receipt_url = coalesce(?, receipt_url), notes = coalesce(?, notes),
      updated_at = ?, sync_status = 'pending'
    where id = ?`,
    [
      input.date ?? row.date,
      input.amount ?? row.amount,
      input.currency ?? row.currency,
      input.categoryId !== undefined ? input.categoryId : row.category_id,
      input.vendor !== undefined ? input.vendor : row.vendor,
      input.vatAmount ?? row.vat_amount,
      input.receiptUrl !== undefined ? input.receiptUrl : row.receipt_url,
      input.notes !== undefined ? input.notes : row.notes,
      ts,
      id,
    ]
  );
  enqueueSync(db, 'expense', id, 'update', {
    id,
    date: input.date ?? row.date,
    amount: input.amount ?? row.amount,
    currency: input.currency ?? row.currency,
    category_id: input.categoryId !== undefined ? input.categoryId : row.category_id,
    vendor: input.vendor !== undefined ? input.vendor : row.vendor,
    vat_amount: input.vatAmount ?? row.vat_amount,
    receipt_url: input.receiptUrl !== undefined ? input.receiptUrl : row.receipt_url,
    notes: input.notes !== undefined ? input.notes : row.notes,
    updated_at: ts,
  });
  return getExpenseById(id);
}

export function deleteExpense(id: string): boolean {
  const db = getDb();
  const row = getExpenseById(id);
  if (!row) return false;
  db.runSync('update expenses set deleted = 1, sync_status = ? where id = ?', [
    'pending',
    id,
  ]);
  enqueueSync(db, 'expense', id, 'delete', null);
  return true;
}
