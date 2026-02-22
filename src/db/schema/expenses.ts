/**
 * Expense tracking schema (Supabase).
 * Source of truth: supabase/migrations/20260221000000_expense_tracking.sql
 * This file provides Drizzle types and optional server-side query use.
 */
import {
  pgTable,
  uuid,
  date,
  numeric,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const expenseCategories = pgTable('expense_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'), // null = system category
  name: text('name').notNull(),
  isCustom: boolean('is_custom').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  date: date('date').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('NGN'),
  categoryId: uuid('category_id'),
  vendor: text('vendor'),
  vatAmount: numeric('vat_amount', { precision: 15, scale: 2 }).default('0'),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
});

export const expenseReports = pgTable('expense_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  format: text('format', { enum: ['pdf', 'csv', 'excel'] }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ndprConsents = pgTable('ndpr_consents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  consentScan: boolean('consent_scan').default(false),
  consentCloudSync: boolean('consent_cloud_sync').default(false),
  consentTimestamp: timestamp('consent_timestamp').defaultNow(),
});
