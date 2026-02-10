import { pgTable, uuid, varchar, decimal, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(), // 'mono' | 'okra' | 'plaid'
  accountNumber: varchar('account_number', { length: 100 }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('NGN'),
  status: varchar('status', { length: 50 }).default('active'), // 'active' | 'disconnected' | 'error'
  lastSyncedAt: timestamp('last_synced_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  bankAccountId: uuid('bank_account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }).notNull(), // Provider's transaction ID
  type: varchar('type', { length: 50 }).notNull(), // 'debit' | 'credit'
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NGN'),
  description: varchar('description', { length: 500 }),
  date: timestamp('date').notNull(),
  category: varchar('category', { length: 100 }),
  categoryConfidence: decimal('category_confidence', { precision: 3, scale: 2 }),
  linkedRecordId: uuid('linked_record_id'),
  isCategorized: boolean('is_categorized').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
