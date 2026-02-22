import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const filings = pgTable("filings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // 'VAT' | 'CIT' | 'WHT' | 'PAYE'
  status: varchar("status", { length: 50 }).default("draft"), // 'draft' | 'submitted' | 'approved' | 'rejected'
  period: jsonb("period").notNull().$type<{
    year: number;
    month?: number;
    quarter?: number;
  }>(),
  recordIds: uuid("record_ids").array(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).notNull(),
  nrsReference: varchar("nrs_reference", { length: 100 }),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
