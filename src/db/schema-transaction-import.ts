/**
 * Database Schema for Transaction Import System
 * Sprint 5: Transaction Upload & Parsing
 */

import { pgTable, uuid, text, integer, decimal, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Import Sessions Table
 * Tracks each file upload and import session
 */
export const importSessions = pgTable('import_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => sql`auth.users(id)`),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  bankCode: text('bank_code').notNull(), // GTB, ZEN, ACC, FBN, UBA, ECO, SBT, FID, UNB, WEM
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed
  transactionsImported: integer('transactions_imported').default(0),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).default('0'),
  errorsCount: integer('errors_count').default(0),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Import Errors Table
 * Logs errors encountered during parsing
 */
export const importErrors = pgTable('import_errors', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => importSessions.id, { onDelete: 'cascade' }),
  rowNumber: integer('row_number').notNull(),
  errorType: text('error_type').notNull(), // INVALID_DATE, INVALID_AMOUNT, MISSING_FIELD, etc.
  errorMessage: text('error_message').notNull(),
  rawData: jsonb('raw_data'), // Store raw row data for debugging
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Duplicate Candidates Table
 * Stores potential duplicate transactions for user review
 */
export const duplicateCandidates = pgTable('duplicate_candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => importSessions.id, { onDelete: 'cascade' }),
  existingTransactionId: uuid('existing_transaction_id').notNull(), // references transactions table
  newTransactionData: jsonb('new_transaction_data').notNull(),
  similarityScore: decimal('similarity_score', { precision: 5, scale: 2 }).notNull(), // 0.00 to 1.00
  matchFactors: text('match_factors').array().notNull(), // ['date', 'amount', 'merchant', 'reference']
  status: text('status').notNull().default('pending'), // pending, merged, kept_both, rejected
  resolvedBy: uuid('resolved_by').references(() => sql`auth.users(id)`),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Bank Configurations Table
 * Stores bank-specific parsing configurations
 */
export const bankConfigurations = pgTable('bank_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  bankCode: text('bank_code').notNull().unique(),
  bankName: text('bank_name').notNull(),
  logoUrl: text('logo_url'),
  csvConfig: jsonb('csv_config'), // Column mappings, delimiters, etc.
  excelConfig: jsonb('excel_config'), // Sheet names, header rows, etc.
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Export types for TypeScript
export type ImportSession = typeof importSessions.$inferSelect;
export type NewImportSession = typeof importSessions.$inferInsert;
export type ImportError = typeof importErrors.$inferSelect;
export type NewImportError = typeof importErrors.$inferInsert;
export type DuplicateCandidate = typeof duplicateCandidates.$inferSelect;
export type NewDuplicateCandidate = typeof duplicateCandidates.$inferInsert;
export type BankConfiguration = typeof bankConfigurations.$inferSelect;
export type NewBankConfiguration = typeof bankConfigurations.$inferInsert;
