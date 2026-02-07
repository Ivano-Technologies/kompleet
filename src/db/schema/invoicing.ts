import { pgTable, uuid, varchar, decimal, timestamp, jsonb, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: jsonb('address').$type<{
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  }>(),
  tin: varchar('tin', { length: 50 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  items: jsonb('items').notNull().$type<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    amount: number;
  }>>(),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull(),
  total: decimal('total', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('draft'), // 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  dueDate: timestamp('due_date').notNull(),
  paidAt: timestamp('paid_at'),
  sentAt: timestamp('sent_at'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
