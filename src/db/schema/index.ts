// Export all schema tables
// Note: records.ts and invoicing customers were Drizzle-only orphans removed in Phase 2.
// Full src/db/ removal is deferred to Phase 4 (expense-sprint tests still import expenses.ts).
export * from "./users";
export * from "./filings";
export * from "./banking";
export * from "./expenses";
