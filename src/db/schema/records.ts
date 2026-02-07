import { pgTable, uuid, varchar, decimal, date, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const records = pgTable('records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'income' | 'expense'
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NGN'),
  date: date('date').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
  attachments: text('attachments').array(),
  taxCode: varchar('tax_code', { length: 50 }),
  vatAmount: decimal('vat_amount', { precision: 15, scale: 2 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
