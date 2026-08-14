/**
 * Tables covered by the Wave B+ cross-tenant negative suite (PHASE_3_BRIEF §5).
 *
 * Later waves append here. The runner iterates this list for SELECT / INSERT /
 * UPDATE / DELETE; adding a table without payload helpers fails the suite
 * closed rather than silently skipping.
 *
 * client_keys is intentionally absent: authenticated has no table GRANT.
 * Coverage is via get/upsert_client_signing_keys RPC tests.
 */
export type TenancyScope = "firm" | "client";

export type TenancyTableName =
  | "firms"
  | "firm_members"
  | "clients"
  | "invoices"
  | "invoice_sequences"
  | "invoice_archives"
  | "invoice_audit_logs";

export type TenancyTableSpec = {
  table: TenancyTableName;
  scope: TenancyScope;
};

export const TENANCY_TABLES: readonly TenancyTableSpec[] = [
  { table: "firms", scope: "firm" },
  { table: "firm_members", scope: "firm" },
  { table: "clients", scope: "client" },
  { table: "invoices", scope: "client" },
  { table: "invoice_sequences", scope: "client" },
  { table: "invoice_archives", scope: "client" },
  { table: "invoice_audit_logs", scope: "client" },
] as const;
