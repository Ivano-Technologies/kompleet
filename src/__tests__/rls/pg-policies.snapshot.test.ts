/** @vitest-environment node */

/**
 * Wave B — pg_policies snapshot (docs/PHASE_3_BRIEF.md §5).
 *
 * Fails if any policy on a client-scoped table references bare `user_id`
 * without a membership predicate (my_firm_ids, accessible_client_ids, or
 * firm_members). Catches the permissive-OR leakage mechanically.
 *
 * Client-scoped = `clients` plus every public table with a `client_id` column
 * (later waves join automatically) plus TENANCY_TABLES entries with
 * scope === "client".
 *
 * Reads KOMPLEET_RLS_DATABASE_URL only — see cross-tenant.negative.test.ts.
 */

import { describe, expect, it } from "vitest";
import pg from "pg";
import { TENANCY_TABLES } from "./tenancy-tables";

const MEMBERSHIP_RE = /my_firm_ids|accessible_client_ids|firm_members/;
const BARE_USER_ID_RE = /\buser_id\b/;

function databaseUrl(): string {
  return process.env.KOMPLEET_RLS_DATABASE_URL ?? "";
}

const configured =
  databaseUrl().startsWith("postgres") &&
  !databaseUrl().includes("test:test@") &&
  !databaseUrl().includes("placeholder");

if (process.env.KOMPLEET_RLS_REQUIRE === "1" && !configured) {
  throw new Error(
    "Wave B required (KOMPLEET_RLS_REQUIRE=1) but KOMPLEET_RLS_DATABASE_URL is missing or placeholder.",
  );
}

describe.skipIf(!configured)("pg_policies snapshot", { timeout: 30_000 }, () => {
  it("client-scoped policies require a membership predicate when they mention user_id", async () => {
    const url = databaseUrl();
    if (url.includes("supabase.co") && !url.includes("127.0.0.1")) {
      throw new Error(
        "pg_policies snapshot must run against local Supabase, not hosted.",
      );
    }

    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const listedClientTables = TENANCY_TABLES.filter(
        (spec) => spec.scope === "client",
      ).map((spec) => spec.table);

      const { rows: clientIdTables } = await client.query<{ table_name: string }>(
        `select table_name
           from information_schema.columns
          where table_schema = 'public'
            and column_name = 'client_id'`,
      );

      const scoped = new Set<string>([
        "clients",
        ...listedClientTables,
        ...clientIdTables.map((row) => row.table_name),
      ]);

      const { rows: policies } = await client.query<{
        tablename: string;
        policyname: string;
        qual: string | null;
        with_check: string | null;
      }>(
        `select tablename, policyname, qual, with_check
           from pg_policies
          where schemaname = 'public'`,
      );

      const leaks = policies.filter((policy) => {
        if (!scoped.has(policy.tablename)) return false;
        const expr = `${policy.qual ?? ""} ${policy.with_check ?? ""}`;
        if (!BARE_USER_ID_RE.test(expr)) return false;
        return !MEMBERSHIP_RE.test(expr);
      });

      expect(
        leaks,
        leaks
          .map(
            (policy) =>
              `${policy.tablename}.${policy.policyname} mentions user_id without my_firm_ids / accessible_client_ids / firm_members`,
          )
          .join("\n") || undefined,
      ).toEqual([]);
    } finally {
      await client.end();
    }
  });
});
