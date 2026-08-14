/**
 * Tables covered by the Wave B cross-tenant negative suite (PHASE_3_BRIEF §5).
 *
 * Later waves append here. The runner iterates this list for SELECT / INSERT /
 * UPDATE / DELETE; adding a table without payload helpers fails the suite
 * closed rather than silently skipping.
 */
export type TenancyScope = "firm" | "client";

export type TenancyTableSpec = {
  table: "firms" | "firm_members" | "clients";
  scope: TenancyScope;
};

export const TENANCY_TABLES: readonly TenancyTableSpec[] = [
  { table: "firms", scope: "firm" },
  { table: "firm_members", scope: "firm" },
  { table: "clients", scope: "client" },
] as const;
