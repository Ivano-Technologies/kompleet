/** @vitest-environment node */

/**
 * Wave B — cross-tenant negative suite (docs/PHASE_3_BRIEF.md §5).
 *
 * Real JWTs against local Supabase Auth. Table-driven from TENANCY_TABLES so
 * later waves gain coverage by appending to that list (and adding payload
 * helpers below). Does not run in the default `pnpm test` job: src/test/setup.ts
 * clobbers NEXT_PUBLIC_* to placeholders on purpose so unit tests cannot hit
 * hosted. This file reads KOMPLEET_RLS_* only.
 *
 * Local: `pnpm supabase start`, then export KOMPLEET_RLS_* from
 * `pnpm supabase status -o env` (API_URL, ANON_KEY, SERVICE_ROLE_KEY, DB_URL)
 * and run `pnpm test:rls`. Hosted supabase.co is refused — do not seed prod.
 */

import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TENANCY_TABLES, type TenancyTableSpec } from "./tenancy-tables";

type SeedCtx = {
  runId: string;
  firmA: string;
  firmB: string;
  ownerA: string;
  ownerB: string;
  staffA: string;
  staffB: string;
  clientsA: string[];
  clientsB: string[];
  archivedA: string;
  invoiceA: string;
  invoiceB: string;
  sequenceA: string;
  sequenceB: string;
  archiveA: string;
  archiveB: string;
  auditA: string;
  auditB: string;
};

type Member = {
  role: "owner" | "staff";
  userId: string;
  accessToken: string;
  refreshToken: string;
};

type CreatedUser = {
  id: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
};

function rlsEnv() {
  const url = process.env.KOMPLEET_RLS_URL ?? "";
  const anonKey = process.env.KOMPLEET_RLS_ANON_KEY ?? "";
  const serviceKey = process.env.KOMPLEET_RLS_SERVICE_ROLE_KEY ?? "";
  const databaseUrl = process.env.KOMPLEET_RLS_DATABASE_URL ?? "";
  const configured =
    url.startsWith("http") &&
    anonKey.length > 20 &&
    !anonKey.includes("placeholder") &&
    serviceKey.length > 20 &&
    !serviceKey.includes("placeholder") &&
    databaseUrl.startsWith("postgres");
  return { url, anonKey, serviceKey, databaseUrl, configured };
}

const env = rlsEnv();

if (process.env.KOMPLEET_RLS_REQUIRE === "1" && !env.configured) {
  throw new Error(
    "Wave B required (KOMPLEET_RLS_REQUIRE=1) but KOMPLEET_RLS_* is missing or placeholder.",
  );
}

async function readyUser(
  accessToken: string,
  refreshToken: string,
): Promise<SupabaseClient> {
  const client = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw new Error(`setSession failed: ${error.message}`);
  return client;
}

function expectWriteDenied(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  const empty =
    result.data == null ||
    (Array.isArray(result.data) && result.data.length === 0);
  expect(
    result.error != null || empty,
    `expected RLS to deny the write; error=${result.error?.message ?? "none"} data=${JSON.stringify(result.data)}`,
  ).toBe(true);
}

async function insertIntoForeign(
  client: SupabaseClient,
  spec: TenancyTableSpec,
  ctx: SeedCtx,
  actorId: string,
) {
  switch (spec.table) {
    case "firms":
      return client
        .from("firms")
        .insert({
          name: `cross-tenant-insert ${ctx.runId}`,
          owner_user_id: ctx.ownerB,
        })
        .select();
    case "firm_members":
      return client
        .from("firm_members")
        .insert({
          firm_id: ctx.firmB,
          user_id: actorId,
          role: "staff",
        })
        .select();
    case "clients":
      return client
        .from("clients")
        .insert({
          firm_id: ctx.firmB,
          legal_name: `cross-tenant-client ${ctx.runId}`,
        })
        .select();
    case "invoices":
      return client
        .from("invoices")
        .insert({
          client_id: ctx.clientsB[0],
          user_id: actorId,
          invoice_number: `INV-HIJACK-${ctx.runId}`,
          invoice_date: "2026-01-01",
          tax_year: 2026,
          customer_info: {},
          line_items: [],
          subtotal: 0,
          vat_amount: 0,
          total_amount: 0,
        })
        .select();
    case "invoice_sequences":
      return client
        .from("invoice_sequences")
        .insert({
          client_id: ctx.clientsB[0],
          tax_year: 2099,
          last_sequence: 1,
        })
        .select();
    case "invoice_archives":
      return client
        .from("invoice_archives")
        .insert({
          invoice_id: ctx.invoiceB,
          client_id: ctx.clientsB[0],
          archived_by: actorId,
          retention_expiry: "2033-01-01T00:00:00Z",
          original_data: {},
          checksum: "hijack",
        })
        .select();
    case "invoice_audit_logs":
      return client
        .from("invoice_audit_logs")
        .insert({
          invoice_id: ctx.invoiceB,
          client_id: ctx.clientsB[0],
          user_id: actorId,
          action: "hijack",
        })
        .select();
    default: {
      const exhaustive: never = spec.table;
      throw new Error(`add insertIntoForeign for ${String(exhaustive)}`);
    }
  }
}

function foreignMatch(spec: TenancyTableSpec, ctx: SeedCtx): Record<string, string> {
  switch (spec.table) {
    case "firms":
      return { id: ctx.firmB };
    case "firm_members":
      return { firm_id: ctx.firmB, user_id: ctx.ownerB };
    case "clients":
      return { id: ctx.clientsB[0]! };
    case "invoices":
      return { id: ctx.invoiceB };
    case "invoice_sequences":
      return { id: ctx.sequenceB };
    case "invoice_archives":
      return { id: ctx.archiveB };
    case "invoice_audit_logs":
      return { id: ctx.auditB };
    default: {
      const exhaustive: never = spec.table;
      throw new Error(`add foreignMatch for ${String(exhaustive)}`);
    }
  }
}

function foreignPatch(
  spec: TenancyTableSpec,
): Record<string, string | number> {
  switch (spec.table) {
    case "firms":
      return { name: "hijacked-by-a" };
    case "firm_members":
      return { role: "staff" };
    case "clients":
      return { legal_name: "hijacked-by-a" };
    case "invoices":
      return { notes: "hijacked-by-a" };
    case "invoice_sequences":
      return { last_sequence: 9999 };
    case "invoice_archives":
      return { reason: "hijacked-by-a" };
    case "invoice_audit_logs":
      return { action: "hijacked-by-a" };
    default: {
      const exhaustive: never = spec.table;
      throw new Error(`add foreignPatch for ${String(exhaustive)}`);
    }
  }
}

function visibleIds(
  spec: TenancyTableSpec,
  ctx: SeedCtx,
  side: "a" | "b",
): Set<string> {
  switch (spec.table) {
    case "firms":
      return new Set([side === "a" ? ctx.firmA : ctx.firmB]);
    case "firm_members":
      return side === "a"
        ? new Set([`${ctx.firmA}:${ctx.ownerA}`, `${ctx.firmA}:${ctx.staffA}`])
        : new Set([`${ctx.firmB}:${ctx.ownerB}`, `${ctx.firmB}:${ctx.staffB}`]);
    case "clients":
      return new Set(side === "a" ? ctx.clientsA : ctx.clientsB);
    case "invoices":
      return new Set([side === "a" ? ctx.invoiceA : ctx.invoiceB]);
    case "invoice_sequences":
      return new Set([side === "a" ? ctx.sequenceA : ctx.sequenceB]);
    case "invoice_archives":
      return new Set([side === "a" ? ctx.archiveA : ctx.archiveB]);
    case "invoice_audit_logs":
      return new Set([side === "a" ? ctx.auditA : ctx.auditB]);
    default: {
      const exhaustive: never = spec.table;
      throw new Error(`add visibleIds for ${String(exhaustive)}`);
    }
  }
}

function rowKey(
  spec: TenancyTableSpec,
  row: Record<string, unknown>,
): string {
  switch (spec.table) {
    case "firms":
    case "clients":
    case "invoices":
    case "invoice_sequences":
    case "invoice_archives":
    case "invoice_audit_logs":
      return String(row.id);
    case "firm_members":
      return `${row.firm_id}:${row.user_id}`;
    default: {
      const exhaustive: never = spec.table;
      throw new Error(`add rowKey for ${String(exhaustive)}`);
    }
  }
}

describe.skipIf(!env.configured)(
  "cross-tenant negative suite",
  { timeout: 60_000 },
  () => {
    const runId = `${Date.now()}-${randomBytes(4).toString("hex")}`;
    const createdUserIds: string[] = [];
    let service: SupabaseClient;
    let ctx: SeedCtx;
    let membersA: Member[];

    beforeAll(async () => {
      if (env.url.includes("supabase.co")) {
        throw new Error(
          "Wave B must run against local Supabase, not hosted. Refusing to seed production.",
        );
      }

      service = createClient(env.url, env.serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const password = `WvB!${randomBytes(12).toString("base64url")}`;

      async function createMember(
        role: "ownerA" | "staffA" | "ownerB" | "staffB",
      ): Promise<CreatedUser> {
        const email = `waveb.${runId}.${role}@example.com`;
        const { data: created, error: createError } =
          await service.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });
        if (createError || !created.user) {
          throw new Error(
            `createUser ${role} failed: ${createError?.message ?? "no user"}`,
          );
        }
        createdUserIds.push(created.user.id);

        const anon = createClient(env.url, env.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: session, error: signError } =
          await anon.auth.signInWithPassword({ email, password });
        if (signError || !session.session) {
          throw new Error(
            `signIn ${role} failed: ${signError?.message ?? "no session"}`,
          );
        }
        return {
          id: created.user.id,
          email,
          password,
          accessToken: session.session.access_token,
          refreshToken: session.session.refresh_token,
        };
      }

      const [ownerA, staffA, ownerB, staffB] = await Promise.all([
        createMember("ownerA"),
        createMember("staffA"),
        createMember("ownerB"),
        createMember("staffB"),
      ]);

      const { data: firmARow, error: firmAError } = await service
        .from("firms")
        .insert({ name: `Wave B Firm A ${runId}`, owner_user_id: ownerA.id })
        .select("id")
        .single();
      if (firmAError || !firmARow) {
        throw new Error(`insert firm A failed: ${firmAError?.message}`);
      }

      const { data: firmBRow, error: firmBError } = await service
        .from("firms")
        .insert({ name: `Wave B Firm B ${runId}`, owner_user_id: ownerB.id })
        .select("id")
        .single();
      if (firmBError || !firmBRow) {
        throw new Error(`insert firm B failed: ${firmBError?.message}`);
      }

      const { error: staffAError } = await service.from("firm_members").insert({
        firm_id: firmARow.id,
        user_id: staffA.id,
        role: "staff",
      });
      if (staffAError) {
        throw new Error(`insert staff A failed: ${staffAError.message}`);
      }

      const { error: staffBError } = await service.from("firm_members").insert({
        firm_id: firmBRow.id,
        user_id: staffB.id,
        role: "staff",
      });
      if (staffBError) {
        throw new Error(`insert staff B failed: ${staffBError.message}`);
      }

      const { data: clientsA, error: clientsAError } = await service
        .from("clients")
        .insert([
          { firm_id: firmARow.id, legal_name: `A1 ${runId}` },
          { firm_id: firmARow.id, legal_name: `A2 ${runId}` },
        ])
        .select("id");
      if (clientsAError || !clientsA || clientsA.length !== 2) {
        throw new Error(`insert clients A failed: ${clientsAError?.message}`);
      }

      const { data: archived, error: archivedError } = await service
        .from("clients")
        .insert({
          firm_id: firmARow.id,
          legal_name: `A-archived ${runId}`,
          archived_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (archivedError || !archived) {
        throw new Error(`insert archived A failed: ${archivedError?.message}`);
      }

      const { data: clientsB, error: clientsBError } = await service
        .from("clients")
        .insert([
          { firm_id: firmBRow.id, legal_name: `B1 ${runId}` },
          { firm_id: firmBRow.id, legal_name: `B2 ${runId}` },
        ])
        .select("id");
      if (clientsBError || !clientsB || clientsB.length !== 2) {
        throw new Error(`insert clients B failed: ${clientsBError?.message}`);
      }

      async function seedInvoice(clientId: string, userId: string, tag: string) {
        const { data, error } = await service
          .from("invoices")
          .insert({
            client_id: clientId,
            user_id: userId,
            invoice_number: `INV-${tag}-${runId}`,
            invoice_date: "2026-01-15",
            tax_year: 2026,
            customer_info: { name: tag },
            line_items: [],
            subtotal: 0,
            vat_amount: 0,
            total_amount: 0,
            status: "draft",
          })
          .select("id")
          .single();
        if (error || !data) {
          throw new Error(`insert invoice ${tag} failed: ${error?.message}`);
        }
        return data.id as string;
      }

      const invoiceA = await seedInvoice(clientsA[0]!.id, ownerA.id, "A");
      const invoiceB = await seedInvoice(clientsB[0]!.id, ownerB.id, "B");

      const { data: seqA, error: seqAError } = await service
        .from("invoice_sequences")
        .insert({ client_id: clientsA[0]!.id, tax_year: 2026, last_sequence: 1 })
        .select("id")
        .single();
      if (seqAError || !seqA) {
        throw new Error(`insert sequence A failed: ${seqAError?.message}`);
      }
      const { data: seqB, error: seqBError } = await service
        .from("invoice_sequences")
        .insert({ client_id: clientsB[0]!.id, tax_year: 2026, last_sequence: 1 })
        .select("id")
        .single();
      if (seqBError || !seqB) {
        throw new Error(`insert sequence B failed: ${seqBError?.message}`);
      }

      const { data: archiveA, error: archiveAError } = await service
        .from("invoice_archives")
        .insert({
          invoice_id: invoiceA,
          client_id: clientsA[0]!.id,
          archived_by: ownerA.id,
          retention_expiry: "2033-01-01T00:00:00Z",
          original_data: { tag: "A" },
          checksum: `a-${runId}`,
        })
        .select("id")
        .single();
      if (archiveAError || !archiveA) {
        throw new Error(`insert archive A failed: ${archiveAError?.message}`);
      }
      const { data: archiveB, error: archiveBError } = await service
        .from("invoice_archives")
        .insert({
          invoice_id: invoiceB,
          client_id: clientsB[0]!.id,
          archived_by: ownerB.id,
          retention_expiry: "2033-01-01T00:00:00Z",
          original_data: { tag: "B" },
          checksum: `b-${runId}`,
        })
        .select("id")
        .single();
      if (archiveBError || !archiveB) {
        throw new Error(`insert archive B failed: ${archiveBError?.message}`);
      }

      const { data: auditA, error: auditAError } = await service
        .from("invoice_audit_logs")
        .insert({
          invoice_id: invoiceA,
          client_id: clientsA[0]!.id,
          user_id: ownerA.id,
          action: "created",
        })
        .select("id")
        .single();
      if (auditAError || !auditA) {
        throw new Error(`insert audit A failed: ${auditAError?.message}`);
      }
      const { data: auditB, error: auditBError } = await service
        .from("invoice_audit_logs")
        .insert({
          invoice_id: invoiceB,
          client_id: clientsB[0]!.id,
          user_id: ownerB.id,
          action: "created",
        })
        .select("id")
        .single();
      if (auditBError || !auditB) {
        throw new Error(`insert audit B failed: ${auditBError?.message}`);
      }

      const { error: keysAError } = await service.from("client_keys").insert({
        client_id: clientsA[0]!.id,
        public_key: "pub-a",
        private_key_encrypted: "enc-a",
      });
      if (keysAError) {
        throw new Error(`insert client_keys A failed: ${keysAError.message}`);
      }
      const { error: keysBError } = await service.from("client_keys").insert({
        client_id: clientsB[0]!.id,
        public_key: "pub-b",
        private_key_encrypted: "enc-b",
      });
      if (keysBError) {
        throw new Error(`insert client_keys B failed: ${keysBError.message}`);
      }

      ctx = {
        runId,
        firmA: firmARow.id,
        firmB: firmBRow.id,
        ownerA: ownerA.id,
        ownerB: ownerB.id,
        staffA: staffA.id,
        staffB: staffB.id,
        clientsA: clientsA.map((row) => row.id),
        clientsB: clientsB.map((row) => row.id),
        archivedA: archived.id,
        invoiceA,
        invoiceB,
        sequenceA: seqA.id,
        sequenceB: seqB.id,
        archiveA: archiveA.id,
        archiveB: archiveB.id,
        auditA: auditA.id,
        auditB: auditB.id,
      };

      membersA = [
        {
          role: "owner",
          userId: ownerA.id,
          accessToken: ownerA.accessToken,
          refreshToken: ownerA.refreshToken,
        },
        {
          role: "staff",
          userId: staffA.id,
          accessToken: staffA.accessToken,
          refreshToken: staffA.refreshToken,
        },
      ];
    }, 90_000);

    afterAll(async () => {
      if (!service) return;
      const invoiceIds = [ctx?.invoiceA, ctx?.invoiceB].filter(
        (id): id is string => Boolean(id),
      );
      if (invoiceIds.length > 0) {
        await service.from("invoice_audit_logs").delete().in("invoice_id", invoiceIds);
        await service.from("invoice_archives").delete().in("invoice_id", invoiceIds);
        await service.from("invoices").delete().in("id", invoiceIds);
      }
      const clientIds = [
        ...(ctx?.clientsA ?? []),
        ...(ctx?.clientsB ?? []),
        ctx?.archivedA,
      ].filter((id): id is string => Boolean(id));
      if (clientIds.length > 0) {
        await service.from("client_keys").delete().in("client_id", clientIds);
        await service.from("invoice_sequences").delete().in("client_id", clientIds);
        await service.from("clients").delete().in("id", clientIds);
      }
      const firmIds = [ctx?.firmA, ctx?.firmB].filter(
        (id): id is string => Boolean(id),
      );
      if (firmIds.length > 0) {
        await service.from("firms").delete().in("id", firmIds);
      }
      for (const userId of createdUserIds) {
        await service.auth.admin.deleteUser(userId);
      }
    }, 60_000);

    for (const spec of TENANCY_TABLES) {
      describe(spec.table, () => {
        for (const member of ["owner", "staff"] as const) {
          it(`${member} SELECT sees exactly firm A, zero of firm B`, async () => {
            const actor = membersA.find((m) => m.role === member);
            if (!actor) throw new Error(`missing ${member}`);
            const client = await readyUser(actor.accessToken, actor.refreshToken);
            const { data, error } = await client.from(spec.table).select("*");
            expect(error).toBeNull();
            const keys = new Set(
              (data ?? []).map((row) =>
                rowKey(spec, row as Record<string, unknown>),
              ),
            );
            const expectedA = visibleIds(spec, ctx, "a");
            const expectedB = visibleIds(spec, ctx, "b");
            for (const id of expectedA) {
              expect(keys, `missing own row ${id}`).toContain(id);
            }
            for (const id of expectedB) {
              expect(keys, `leaked firm B row ${id}`).not.toContain(id);
            }
          });

          it(`${member} INSERT into firm B is denied`, async () => {
            const actor = membersA.find((m) => m.role === member);
            if (!actor) throw new Error(`missing ${member}`);
            const client = await readyUser(actor.accessToken, actor.refreshToken);
            const result = await insertIntoForeign(
              client,
              spec,
              ctx,
              actor.userId,
            );
            expectWriteDenied(result);

            const { data: after } = await service
              .from(spec.table)
              .select("*")
              .match(foreignMatch(spec, ctx));
            expect(after?.length ?? 0).toBeGreaterThan(0);
            if (spec.table === "firms") {
              const { count } = await service
                .from("firms")
                .select("id", { count: "exact", head: true })
                .eq("name", `cross-tenant-insert ${ctx.runId}`);
              expect(count ?? 0).toBe(0);
            }
            if (spec.table === "clients") {
              const { count } = await service
                .from("clients")
                .select("id", { count: "exact", head: true })
                .eq("legal_name", `cross-tenant-client ${ctx.runId}`);
              expect(count ?? 0).toBe(0);
            }
            if (spec.table === "firm_members") {
              const { count } = await service
                .from("firm_members")
                .select("firm_id", { count: "exact", head: true })
                .eq("firm_id", ctx.firmB)
                .eq("user_id", actor.userId);
              expect(count ?? 0).toBe(0);
            }
          });

          it(`${member} UPDATE on firm B is a no-op`, async () => {
            const actor = membersA.find((m) => m.role === member);
            if (!actor) throw new Error(`missing ${member}`);
            const client = await readyUser(actor.accessToken, actor.refreshToken);
            const match = foreignMatch(spec, ctx);
            const patch = foreignPatch(spec);
            const result = await client.from(spec.table).update(patch).match(match).select();
            expectWriteDenied(result);

            const { data: after } = await service
              .from(spec.table)
              .select("*")
              .match(match)
              .maybeSingle();
            expect(after).toBeTruthy();
            for (const [key, value] of Object.entries(patch)) {
              expect(
                (after as Record<string, unknown>)[key],
                `${spec.table}.${key} must not change`,
              ).not.toBe(value);
            }
          });

          it(`${member} DELETE on firm B is a no-op`, async () => {
            const actor = membersA.find((m) => m.role === member);
            if (!actor) throw new Error(`missing ${member}`);
            const client = await readyUser(actor.accessToken, actor.refreshToken);
            const match = foreignMatch(spec, ctx);
            const result = await client.from(spec.table).delete().match(match).select();
            expectWriteDenied(result);

            const { data: after } = await service
              .from(spec.table)
              .select("*")
              .match(match)
              .maybeSingle();
            expect(after, `${spec.table} row on firm B must still exist`).toBeTruthy();
          });
        }
      });
    }

    it("archived clients are excluded from SELECT", async () => {
      for (const actor of membersA) {
        const client = await readyUser(actor.accessToken, actor.refreshToken);
        const { data, error } = await client.from("clients").select("id");
        expect(error).toBeNull();
        const ids = new Set((data ?? []).map((row) => row.id));
        expect(ids.has(ctx.archivedA), `${actor.role} saw archived client`).toBe(
          false,
        );
        for (const id of ctx.clientsA) {
          expect(ids.has(id)).toBe(true);
        }
      }
    });

    it("client_keys RPC is client-scoped", async () => {
      const actor = membersA[0];
      if (!actor) throw new Error("missing owner");
      const client = await readyUser(actor.accessToken, actor.refreshToken);

      const own = await client.rpc("get_client_signing_keys", {
        p_client_id: ctx.clientsA[0],
      });
      expect(own.error).toBeNull();
      expect(own.data?.[0]?.public_key).toBe("pub-a");

      const foreign = await client.rpc("get_client_signing_keys", {
        p_client_id: ctx.clientsB[0],
      });
      expect(foreign.error).toBeTruthy();

      const tableRead = await client.from("client_keys").select("*");
      expect(
        tableRead.error != null || (tableRead.data?.length ?? 0) === 0,
      ).toBe(true);
    });
  },
);
