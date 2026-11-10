/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import * as eraseAccount from "./lib/eraseAccount";
import {
  ALLOWED,
  EXPECTED_KEEPER_REFERENCED_STORAGE,
  EXPECTED_ORPHAN_SEND_LIMITS,
  EXPECTED_ORPHAN_SEQUENCES,
  EXPECTED_UNREFERENCED_STORAGE,
  HIGHEST_PLATFORM_ROLE,
  KEEPER,
  KEEPER_OWNER_CONFIRM,
  ORPHAN_STORAGE_CREATED_FROM,
  PURGE_ORPHANS_CONFIRM,
  STORAGE_REF_FIELDS,
  hardDeleteUserHandler,
  makeKeeperOwnerSuperAdminHandler,
  purgeOrphansHandler,
} from "./adminPurge";

const ORPHAN_CREATED_INSIDE = Date.UTC(2026, 8, 25, 12);
const ORPHAN_CREATED_OUTSIDE = Date.UTC(2026, 8, 29, 0);

const TARGET = [...ALLOWED][1]!;
const ERASED = [...ALLOWED][0]!;
const OFF_LIST = "nn7offlist0000000000000000000001";
const SHARED_NAME = "Acme Trading Ltd";
const SHARED_TIN = "12345678-0001";
const SHARED_RC = "RC999";
const SHARED_INV = "2026-0001";
const TARGET_CLIENT_EXT = "11111111-1111-4111-8111-111111111111";
const KEEPER_CLIENT_EXT = "22222222-2222-4222-8222-222222222222";
const ORPHAN_CLIENT_EXT = "33333333-3333-4333-8333-333333333333";

function fakeDb() {
  const tables: Record<string, Array<Record<string, unknown>>> = {
    users: [],
    firms: [],
    firmMembers: [],
    clients: [],
    clientKeys: [],
    businessProfiles: [],
    invoices: [],
    invoiceArchives: [],
    invoiceAuditLogs: [],
    invoiceSequences: [],
    uploadedFiles: [],
    documents: [],
    expenses: [],
    exportHistory: [],
    importSessions: [],
    importErrors: [],
    transactions: [],
    taxCalculations: [],
    financialStatements: [],
    taxReports: [],
    userTaxYears: [],
    duplicateCandidates: [],
    expenseCategories: [],
    filingAuditLogs: [],
    nrsForms: [],
    formFilingStatuses: [],
    auditLogs: [],
    authSessions: [],
    authRefreshTokens: [],
    authAccounts: [],
    authVerificationCodes: [],
    authVerifiers: [],
    authRateLimits: [],
    authEmailSendLimits: [],
    e2eAuthOtps: [],
    deadlineReminders: [],
    _storage: [],
  };
  let nextId = 1;
  const storageDeleted: string[] = [];
  const indexedQuery = (table: string) => {
    const all = () => tables[table] ?? [];
    return {
      collect: async () => all(),
      unique: async () => all()[0] ?? null,
      first: async () => all()[0] ?? null,
      take: async (n: number) => all().slice(0, n),
      withIndex: (
        _name: string,
        build?: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
      ) => {
        const eqs: Array<{ field: string; value: unknown }> = [];
        const q = {
          eq(field: string, value: unknown) {
            eqs.push({ field, value });
            return q;
          },
        };
        build?.(q);
        const match = () =>
          all().filter((row) =>
            eqs.every((clause) => row[clause.field] === clause.value),
          );
        return {
          unique: async () => match()[0] ?? null,
          first: async () => match()[0] ?? null,
          collect: async () => match(),
        };
      },
    };
  };
  const ctx = {
    tables,
    storageDeleted,
    db: {
      query: indexedQuery,
      get: async (id: string) => {
        if (tables._storage.some((row) => row._id === id)) {
          throw new Error("System tables can only be accessed with db.system.");
        }
        for (const [table, rows] of Object.entries(tables)) {
          if (table === "_storage") continue;
          const row = rows.find((r) => r._id === id);
          if (row) return row;
        }
        return null;
      },
      system: {
        query: indexedQuery,
        get: async (id: string) =>
          tables._storage.find((row) => row._id === id) ?? null,
      },
      insert: async (table: string, doc: Record<string, unknown>) => {
        const _id = `${table}:${nextId++}`;
        tables[table] ??= [];
        tables[table].push({ _id, ...doc });
        return _id;
      },
      patch: async (id: string, patch: Record<string, unknown>) => {
        for (const rows of Object.values(tables)) {
          const row = rows.find((r) => r._id === id);
          if (row) Object.assign(row, patch);
        }
      },
      delete: async (id: string) => {
        for (const table of Object.keys(tables)) {
          tables[table] = tables[table].filter((row) => row._id !== id);
        }
      },
    },
    storage: {
      delete: async (id: string) => {
        storageDeleted.push(id);
        tables._storage = tables._storage.filter((row) => row._id !== id);
      },
    },
  };
  return ctx;
}

function asCtx(db: ReturnType<typeof fakeDb>): MutationCtx {
  return db as unknown as MutationCtx;
}

function snapshot(db: ReturnType<typeof fakeDb>) {
  return JSON.stringify({
    tables: db.tables,
    storageDeleted: db.storageDeleted,
  });
}

function userDoc(
  id: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    _id: id,
    externalId: `ext-${id.slice(0, 8)}`,
    email: `${id.slice(0, 8)}@example.com`,
    name: "Test",
    fullName: "Test User",
    phone: "0800",
    entityType: "individual",
    defaultCurrency: "NGN",
    fiscalYearStart: 1,
    onboardingCompleted: true,
    createdAt: 1,
    updatedAt: 1,
    ...extra,
  };
}

function seedKeeper(db: ReturnType<typeof fakeDb>, extra: Record<string, unknown> = {}) {
  db.tables.users.push(
    userDoc(KEEPER, {
      email: "ivanonigeria@gmail.com",
      externalId: "keeper-ext",
      fullName: "Keeper",
      ...extra,
    }),
  );
  db.tables.firms.push({
    _id: "firms:keeper",
    externalId: "firm-keeper",
    name: "Keeper Firm",
    ownerUserId: KEEPER,
    ownerExternalId: "keeper-ext",
    subscriptionTier: "free",
    createdAt: 1,
  });
  db.tables.firmMembers.push({
    _id: "firmMembers:keeper",
    firmId: "firms:keeper",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    role: "owner",
  });
}

function seedTargetLive(db: ReturnType<typeof fakeDb>) {
  db.tables.users.push(
    userDoc(TARGET, {
      email: "target@example.com",
      externalId: "target-ext",
      fullName: "Target",
      avatarStorageId: "storage:target-avatar",
    }),
  );
  db.tables.firms.push({
    _id: "firms:target",
    externalId: "firm-target",
    name: "Target Firm",
    ownerUserId: TARGET,
    ownerExternalId: "target-ext",
    subscriptionTier: "free",
    createdAt: 1,
  });
  db.tables.firmMembers.push({
    _id: "firmMembers:target",
    firmId: "firms:target",
    userId: TARGET,
    userExternalId: "target-ext",
    role: "owner",
  });
  db.tables.clients.push({
    _id: "clients:target",
    externalId: TARGET_CLIENT_EXT,
    firmId: "firms:target",
    legalName: SHARED_NAME,
    tin: SHARED_TIN,
    rcNumber: SHARED_RC,
    status: "active",
    createdAt: 1,
  });
  db.tables.invoices.push({
    _id: "invoices:target-issued",
    userId: TARGET,
    userExternalId: "target-ext",
    clientId: "clients:target",
    clientExternalId: TARGET_CLIENT_EXT,
    invoiceNumber: SHARED_INV,
    status: "issued",
    isImmutable: true,
    createdAt: 1,
    updatedAt: 1,
  });
  db.tables.invoiceAuditLogs.push({
    _id: "invoiceAuditLogs:target",
    invoiceId: "invoices:target-issued",
    userId: TARGET,
    action: "issued",
    createdAt: 1,
  });
  db.tables.invoiceSequences.push(
    {
      _id: "invoiceSequences:target-user",
      userId: TARGET,
      taxYear: 2026,
      nextNumber: 2,
    },
    {
      _id: "invoiceSequences:target-client",
      clientExternalId: TARGET_CLIENT_EXT,
      taxYear: 2026,
      nextNumber: 2,
    },
  );
  db.tables.authSessions.push({ _id: "authSessions:target", userId: TARGET });
  db.tables.authRefreshTokens.push({
    _id: "authRefreshTokens:target",
    sessionId: "authSessions:target",
  });
  db.tables.authAccounts.push({
    _id: "authAccounts:target",
    userId: TARGET,
    provider: "password",
  });
  db.tables.authVerifiers.push({
    _id: "authVerifiers:target",
    sessionId: "authSessions:target",
  });
  db.tables.uploadedFiles.push({
    _id: "uploadedFiles:target",
    userId: TARGET,
    userExternalId: "target-ext",
    storageId: "storage:target-file",
    filename: "a.pdf",
    contentType: "application/pdf",
    size: 10,
    uploadedAt: 1,
    uploadedBy: TARGET,
    source: "documents",
  });
  db.tables.auditLogs.push({
    _id: "auditLogs:target-old",
    userId: TARGET,
    userExternalId: "target-ext",
    action: "login",
    createdAt: 1,
  });
  db.tables._storage.push(
    { _id: "storage:target-file", size: 10 },
    { _id: "storage:target-avatar", size: 5 },
  );
}

function seedKeeperBusinessData(db: ReturnType<typeof fakeDb>) {
  db.tables.clients.push({
    _id: "clients:keeper",
    externalId: KEEPER_CLIENT_EXT,
    firmId: "firms:keeper",
    legalName: SHARED_NAME,
    tin: SHARED_TIN,
    rcNumber: SHARED_RC,
    status: "active",
    createdAt: 1,
  });
  db.tables.invoices.push({
    _id: "invoices:keeper",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    clientId: "clients:keeper",
    clientExternalId: KEEPER_CLIENT_EXT,
    invoiceNumber: SHARED_INV,
    status: "issued",
    isImmutable: true,
    createdAt: 1,
    updatedAt: 1,
  });
  db.tables.invoiceSequences.push(
    {
      _id: "invoiceSequences:keeper-user",
      userId: KEEPER,
      taxYear: 2026,
      nextNumber: 2,
    },
    {
      _id: "invoiceSequences:keeper-client",
      clientExternalId: KEEPER_CLIENT_EXT,
      taxYear: 2026,
      nextNumber: 2,
    },
  );
  db.tables.auditLogs.push({
    _id: "auditLogs:keeper",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    action: "login",
    createdAt: 1,
  });
}

function seedKeeperStorage(db: ReturnType<typeof fakeDb>) {
  const ids = Array.from(
    { length: EXPECTED_KEEPER_REFERENCED_STORAGE },
    (_, i) => `storage:keeper-${i}`,
  );
  for (const id of ids) db.tables._storage.push({ _id: id, size: 100 });
  db.tables.users[0]!.avatarStorageId = ids[0];
  db.tables.businessProfiles.push({
    _id: "businessProfiles:keeper",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    logoStorageId: ids[1],
    createdAt: 1,
    updatedAt: 1,
  });
  db.tables.uploadedFiles.push({
    _id: "uploadedFiles:keeper",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    storageId: ids[2],
    filename: "k.pdf",
    contentType: "application/pdf",
    size: 100,
    uploadedAt: 1,
    uploadedBy: KEEPER,
    source: "documents",
  });
  db.tables.documents.push({
    _id: "documents:keeper",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    status: "ready",
    storageId: ids[3],
    processingAttemptCount: 0,
    createdAt: 1,
    updatedAt: 1,
  });
  db.tables.expenses.push({
    _id: "expenses:keeper",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    date: "2026-01-01",
    amount: 1,
    currency: "NGN",
    receiptStorageId: ids[4],
    createdAt: 1,
    updatedAt: 1,
  });
  db.tables.exportHistory.push({
    _id: "exportHistory:keeper",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    exportType: "csv",
    status: "ready",
    storageId: ids[5],
    createdAt: 1,
  });
  db.tables.importSessions.push({
    _id: "importSessions:keeper",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    fileName: "a.csv",
    status: "done",
    transactionsImported: 0,
    errorsCount: 0,
    storageId: ids[6],
    createdAt: 1,
  });
  db.tables.uploadedFiles.push({
    _id: "uploadedFiles:keeper-2",
    userId: KEEPER,
    userExternalId: "keeper-ext",
    storageId: ids[7],
    filename: "k2.pdf",
    contentType: "application/pdf",
    size: 100,
    uploadedAt: 1,
    uploadedBy: KEEPER,
    source: "documents",
  });
  return ids;
}

function seedExactOrphans(
  db: ReturnType<typeof fakeDb>,
  opts: {
    unreferenced?: number;
    sequences?: number;
    sendLimits?: number;
    creationTime?: number;
  } = {},
) {
  const unreferenced = opts.unreferenced ?? EXPECTED_UNREFERENCED_STORAGE;
  const sequences = opts.sequences ?? EXPECTED_ORPHAN_SEQUENCES;
  const sendLimits = opts.sendLimits ?? EXPECTED_ORPHAN_SEND_LIMITS;
  const creationTime = opts.creationTime ?? ORPHAN_CREATED_INSIDE;
  for (let i = 0; i < unreferenced; i += 1) {
    db.tables._storage.push({
      _id: `storage:orphan-${i}`,
      size: 51,
      _creationTime: creationTime,
    });
  }
  for (let i = 0; i < sequences; i += 1) {
    db.tables.invoiceSequences.push({
      _id: `invoiceSequences:orphan-${i}`,
      clientExternalId: `${ORPHAN_CLIENT_EXT.slice(0, -1)}${i}`,
      taxYear: 2026,
      nextNumber: 4,
    });
  }
  for (let i = 0; i < sendLimits; i += 1) {
    db.tables.authEmailSendLimits.push({
      _id: `authEmailSendLimits:orphan-${i}`,
      identifier: `password-reset:gone${i}@example.com`,
      lastSentAt: 1,
      hourStartedAt: 1,
      hourCount: 1,
    });
  }
}

function runPurgeOrphans(
  db: ReturnType<typeof fakeDb>,
  dryRun: boolean,
  confirm: string = PURGE_ORPHANS_CONFIRM,
) {
  return purgeOrphansHandler(asCtx(db), { dryRun, confirm });
}

function runKeeperOwner(
  db: ReturnType<typeof fakeDb>,
  dryRun: boolean,
  confirm: string = KEEPER_OWNER_CONFIRM,
) {
  return makeKeeperOwnerSuperAdminHandler(asCtx(db), { dryRun, confirm });
}

async function purge(db: ReturnType<typeof fakeDb>, userId: string, dryRun: boolean) {
  return await hardDeleteUserHandler(asCtx(db), {
    userId: userId as Id<"users">,
    dryRun,
  });
}

describe("adminPurge", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.AUTH_RESEND_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the typed storage-id fields used by purgeOrphans", () => {
    expect(STORAGE_REF_FIELDS).toEqual([
      ["users", "avatarStorageId"],
      ["businessProfiles", "logoStorageId"],
      ["importSessions", "storageId"],
      ["exportHistory", "storageId"],
      ["expenses", "receiptStorageId"],
      ["documents", "storageId"],
      ["uploadedFiles", "storageId"],
    ]);
  });

  describe("hardDeleteUser", () => {
    it("dryRun writes nothing, including no audit insert", async () => {
      const spy = vi.spyOn(eraseAccount, "eraseMineHandler");
      const db = fakeDb();
      seedKeeper(db);
      seedTargetLive(db);
      const before = snapshot(db);
      const result = await purge(db, TARGET, true);
      expect(spy).not.toHaveBeenCalled();
      expect(snapshot(db)).toBe(before);
      expect(db.tables.auditLogs.some((row) => row.action === "account_erased")).toBe(
        false,
      );
      expect(result).toMatchObject({
        dryRun: true,
        keeperUntouched: true,
        accountErasedRowCaught: true,
      });
      if (!("auditLogsExpectedDeletedOnRun" in result)) {
        throw new Error("expected dry-run shape");
      }
      expect(result.auditLogsExpectedDeletedOnRun).toBe(
        (result.auditLogsExisting ?? 0) + 1,
      );
    });

    it("refuses the keeper id", async () => {
      const db = fakeDb();
      seedKeeper(db);
      await expect(purge(db, KEEPER, true)).rejects.toThrow(
        "Refusing: keeper account",
      );
    });

    it("refuses a non-allowlisted id", async () => {
      const db = fakeDb();
      seedKeeper(db);
      await expect(purge(db, OFF_LIST, true)).rejects.toThrow(
        "Refusing: id not on approved list",
      );
    });

    it("real run removes all target rows including invoices and account_erased", async () => {
      const db = fakeDb();
      seedKeeper(db);
      seedKeeperBusinessData(db);
      seedTargetLive(db);
      const dry = await purge(db, TARGET, true);
      if (!("auditLogsExpectedDeletedOnRun" in dry)) {
        throw new Error("expected dry-run shape");
      }
      const result = await purge(db, TARGET, false);
      if (!("auditLogsDeleted" in result)) {
        throw new Error("expected real-run shape");
      }
      expect(result.calledEraseMine).toBe(true);
      expect(result.auditLogsDeleted).toBe(dry.auditLogsExpectedDeletedOnRun);
      expect(db.tables.users.map((row) => row._id)).toEqual([KEEPER]);
      expect(db.tables.invoices.map((row) => row._id)).toEqual(["invoices:keeper"]);
      expect(
        db.tables.auditLogs.filter((row) => row.userExternalId === "target-ext"),
      ).toHaveLength(0);
      expect(db.tables.auditLogs.some((row) => row.action === "account_erased")).toBe(
        false,
      );
      expect(db.tables.authSessions).toHaveLength(0);
      expect(db.tables.authAccounts).toHaveLength(0);
      expect(db.tables.authVerifiers).toHaveLength(0);
      expect(db.tables.firms.map((row) => row._id)).toEqual(["firms:keeper"]);
    });

    it("returns alreadyGone on a second real run", async () => {
      const db = fakeDb();
      seedKeeper(db);
      seedTargetLive(db);
      await purge(db, TARGET, false);
      expect(await purge(db, TARGET, false)).toEqual({ alreadyGone: true });
    });

    it("leaves keeper sequences when names, TIN, RC and invoice numbers match", async () => {
      const db = fakeDb();
      seedKeeper(db);
      seedKeeperBusinessData(db);
      seedTargetLive(db);
      const keeperBefore = {
        sequences: db.tables.invoiceSequences
          .filter((row) => String(row._id).includes("keeper"))
          .map((row) => ({ ...row })),
        clients: db.tables.clients.filter((row) => row._id === "clients:keeper").length,
        invoices: db.tables.invoices.filter((row) => row.userId === KEEPER).length,
        audits: db.tables.auditLogs.filter((row) => row.userExternalId === "keeper-ext")
          .length,
      };
      await purge(db, TARGET, false);
      expect(
        db.tables.invoiceSequences.filter((row) =>
          String(row._id).includes("keeper"),
        ),
      ).toHaveLength(2);
      expect(db.tables.invoiceSequences).toEqual(
        expect.arrayContaining(keeperBefore.sequences),
      );
      expect(db.tables.clients.some((row) => row._id === "clients:keeper")).toBe(true);
      expect(db.tables.invoices.filter((row) => row.userId === KEEPER)).toHaveLength(
        keeperBefore.invoices,
      );
      expect(
        db.tables.auditLogs.filter((row) => row.userExternalId === "keeper-ext"),
      ).toHaveLength(keeperBefore.audits);
      expect(db.tables.invoiceSequences.some((row) => row.userId === TARGET)).toBe(
        false,
      );
    });

    it("purges an already-erased user with no auth rows", async () => {
      const spy = vi.spyOn(eraseAccount, "eraseMineHandler");
      const db = fakeDb();
      seedKeeper(db);
      db.tables.users.push(
        userDoc(ERASED, {
          email: "deleted-erased@deleted.invalid",
          externalId: "erased-ext",
          name: "Deleted user",
          fullName: "Deleted user",
          deletedAt: 9,
        }),
      );
      db.tables.firms.push({
        _id: "firms:erased",
        name: "Deleted firm",
        ownerUserId: ERASED,
        ownerExternalId: "erased-ext",
        externalId: "firm-erased",
        subscriptionTier: "free",
        createdAt: 1,
      });
      db.tables.clients.push({
        _id: "clients:erased",
        externalId: "44444444-4444-4444-8444-444444444444",
        firmId: "firms:erased",
        legalName: "Deleted user",
        status: "active",
        createdAt: 1,
      });
      db.tables.invoices.push(
        {
          _id: "invoices:erased-paid",
          userId: ERASED,
          userExternalId: "erased-ext",
          status: "paid",
          invoiceNumber: "2026-0002",
          isImmutable: true,
          createdAt: 1,
          updatedAt: 1,
        },
        {
          _id: "invoices:erased-cancelled",
          userId: ERASED,
          userExternalId: "erased-ext",
          status: "cancelled",
          invoiceNumber: "2026-0003",
          isImmutable: true,
          createdAt: 1,
          updatedAt: 1,
        },
      );
      db.tables.invoiceSequences.push({
        _id: "invoiceSequences:erased",
        userId: ERASED,
        taxYear: 2026,
        nextNumber: 3,
      });
      db.tables.auditLogs.push({
        _id: "auditLogs:erased",
        userId: ERASED,
        userExternalId: "erased-ext",
        action: "account_erased",
        createdAt: 1,
      });
      const result = await purge(db, ERASED, false);
      expect(spy).not.toHaveBeenCalled();
      if (!("calledEraseMine" in result)) throw new Error("expected real-run shape");
      expect(result.calledEraseMine).toBe(false);
      expect(db.tables.users.map((row) => row._id)).toEqual([KEEPER]);
      expect(db.tables.invoices).toHaveLength(0);
      expect(db.tables.firms.map((row) => row._id)).toEqual(["firms:keeper"]);
      expect(
        db.tables.auditLogs.filter((row) => row.userExternalId === "erased-ext"),
      ).toHaveLength(0);
    });
  });

  describe("purgeOrphans", () => {
    function seedReadyOrphans(db: ReturnType<typeof fakeDb>) {
      seedKeeper(db);
      seedKeeperBusinessData(db);
      const keeperFiles = seedKeeperStorage(db);
      seedExactOrphans(db);
      return keeperFiles;
    }

    it("dryRun writes nothing", async () => {
      const db = fakeDb();
      seedReadyOrphans(db);
      const before = snapshot(db);
      const result = await runPurgeOrphans(db, true);
      expect(snapshot(db)).toBe(before);
      expect(result).toMatchObject({
        dryRun: true,
        unreferencedStorageCount: EXPECTED_UNREFERENCED_STORAGE,
        orphanInvoiceSequenceIds: ["invoiceSequences:orphan-0"],
        orphanAuthEmailSendLimitIds: ["authEmailSendLimits:orphan-0"],
        keeperUntouched: true,
      });
    });

    it("keeps referenced files and deletes unreferenced ones", async () => {
      const db = fakeDb();
      const keeperFiles = seedReadyOrphans(db);
      const result = await runPurgeOrphans(db, false);
      expect(result).toMatchObject({
        dryRun: false,
        deletedStorageCount: EXPECTED_UNREFERENCED_STORAGE,
        deletedInvoiceSequences: EXPECTED_ORPHAN_SEQUENCES,
        deletedAuthEmailSendLimits: EXPECTED_ORPHAN_SEND_LIMITS,
      });
      expect(db.tables._storage.map((row) => row._id).sort()).toEqual(
        [...keeperFiles].sort(),
      );
      expect(db.tables.invoiceSequences.map((row) => row._id).sort()).toEqual(
        ["invoiceSequences:keeper-client", "invoiceSequences:keeper-user"].sort(),
      );
      expect(db.tables.authEmailSendLimits).toHaveLength(0);
    });

    it("refuses unless the keeper is the only user and leftover counts match", async () => {
      const extraUser = fakeDb();
      seedKeeper(extraUser);
      seedKeeperStorage(extraUser);
      seedExactOrphans(extraUser);
      extraUser.tables.users.push(userDoc(TARGET));
      await expect(runPurgeOrphans(extraUser, true)).rejects.toThrow(
        "keeper is not the only remaining user",
      );

      const wrongCount = fakeDb();
      seedKeeper(wrongCount);
      seedKeeperStorage(wrongCount);
      seedExactOrphans(wrongCount, { unreferenced: EXPECTED_UNREFERENCED_STORAGE - 1 });
      await expect(runPurgeOrphans(wrongCount, true)).rejects.toThrow(
        "unreferenced storage files",
      );
    });

    it("does not call ctx.db.get on _storage ids", async () => {
      const db = fakeDb();
      seedReadyOrphans(db);
      const get = db.db.get;
      db.db.get = async (id: string) => {
        if (String(id).startsWith("storage:")) {
          throw new Error("System tables can only be accessed with db.system.");
        }
        return await get(id);
      };
      await expect(runPurgeOrphans(db, true)).resolves.toMatchObject({
        dryRun: true,
        unreferencedStorageCount: EXPECTED_UNREFERENCED_STORAGE,
      });
    });

    it("refuses an unreferenced file outside 24-28 Sep 2026 WAT", async () => {
      const db = fakeDb();
      seedKeeper(db);
      seedKeeperStorage(db);
      seedExactOrphans(db);
      db.tables._storage.find((row) => row._id === "storage:orphan-0")!._creationTime =
        ORPHAN_CREATED_OUTSIDE;
      await expect(runPurgeOrphans(db, true)).rejects.toThrow(
        "outside 24-28 Sep 2026 WAT",
      );
      expect(ORPHAN_CREATED_OUTSIDE).toBeGreaterThanOrEqual(
        Date.UTC(2026, 8, 28, 23),
      );
      expect(ORPHAN_STORAGE_CREATED_FROM).toBe(Date.UTC(2026, 8, 23, 23));
    });

    it("refuses 52 unreferenced files", async () => {
      const db = fakeDb();
      seedKeeper(db);
      seedKeeperStorage(db);
      seedExactOrphans(db, { unreferenced: 52 });
      await expect(runPurgeOrphans(db, true)).rejects.toThrow(
        "unreferenced storage files",
      );
    });

    it("refuses 0 or 2 orphan sequences and send-limit rows", async () => {
      const zeroSeq = fakeDb();
      seedKeeper(zeroSeq);
      seedKeeperStorage(zeroSeq);
      seedExactOrphans(zeroSeq, { sequences: 0 });
      await expect(runPurgeOrphans(zeroSeq, true)).rejects.toThrow(
        "orphan invoiceSequences rows",
      );

      const twoSeq = fakeDb();
      seedKeeper(twoSeq);
      seedKeeperStorage(twoSeq);
      seedExactOrphans(twoSeq, { sequences: 2 });
      await expect(runPurgeOrphans(twoSeq, true)).rejects.toThrow(
        "orphan invoiceSequences rows",
      );

      const zeroLimit = fakeDb();
      seedKeeper(zeroLimit);
      seedKeeperStorage(zeroLimit);
      seedExactOrphans(zeroLimit, { sendLimits: 0 });
      await expect(runPurgeOrphans(zeroLimit, true)).rejects.toThrow(
        "orphan authEmailSendLimits rows",
      );

      const twoLimit = fakeDb();
      seedKeeper(twoLimit);
      seedKeeperStorage(twoLimit);
      seedExactOrphans(twoLimit, { sendLimits: 2 });
      await expect(runPurgeOrphans(twoLimit, true)).rejects.toThrow(
        "orphan authEmailSendLimits rows",
      );
    });

    it("refuses a confirm mismatch", async () => {
      const db = fakeDb();
      seedReadyOrphans(db);
      await expect(runPurgeOrphans(db, true, "HARD DELETE")).rejects.toThrow(
        "confirm must be",
      );
    });

    it("treats a sequence with only nextNumber and taxYear as an orphan", async () => {
      const db = fakeDb();
      seedKeeper(db);
      seedKeeperStorage(db);
      seedExactOrphans(db, { sequences: 0 });
      db.tables.invoiceSequences.push({
        _id: "invoiceSequences:unlinked",
        taxYear: 2026,
        nextNumber: 4,
      });
      const result = await runPurgeOrphans(db, true);
      expect(result).toMatchObject({
        dryRun: true,
        orphanInvoiceSequenceIds: ["invoiceSequences:unlinked"],
      });
    });

    it("does not treat a keeper-client sequence as an orphan", async () => {
      const db = fakeDb();
      seedReadyOrphans(db);
      db.tables.invoiceSequences.push({
        _id: "invoiceSequences:keeper-ext-only",
        clientExternalId: KEEPER_CLIENT_EXT,
        taxYear: 2026,
        nextNumber: 9,
      });
      const result = await runPurgeOrphans(db, true);
      if (!("orphanInvoiceSequenceIds" in result)) {
        throw new Error("expected dry-run shape");
      }
      expect(result.orphanInvoiceSequenceIds).toEqual([
        "invoiceSequences:orphan-0",
      ]);
      expect(result.orphanInvoiceSequenceIds).not.toContain(
        "invoiceSequences:keeper-ext-only",
      );
    });

    it("does not treat a userId-only sequence as an orphan", async () => {
      const db = fakeDb();
      seedReadyOrphans(db);
      db.tables.invoiceSequences.push({
        _id: "invoiceSequences:userid-only",
        userId: "nn7syntheticuserid00000000000001",
        taxYear: 2026,
        nextNumber: 3,
      });
      const result = await runPurgeOrphans(db, true);
      if (!("orphanInvoiceSequenceIds" in result)) {
        throw new Error("expected dry-run shape");
      }
      expect(result.orphanInvoiceSequenceIds).toEqual([
        "invoiceSequences:orphan-0",
      ]);
      expect(result.orphanInvoiceSequenceIds).not.toContain(
        "invoiceSequences:userid-only",
      );
    });
  });

  describe("makeKeeperOwnerSuperAdmin", () => {
    it("dryRun shows before/after and writes nothing", async () => {
      const db = fakeDb();
      seedKeeper(db);
      const before = snapshot(db);
      const result = await runKeeperOwner(db, true);
      expect(snapshot(db)).toBe(before);
      expect(result).toMatchObject({
        dryRun: true,
        highestExistingRole: HIGHEST_PLATFORM_ROLE,
        envAllowlist: null,
        wouldWrite: true,
        after: {
          platformRole: "owner",
          firmOwnerAsserted: true,
        },
      });
    });

    it("sets platformRole owner only and asserts firm ownership", async () => {
      const db = fakeDb();
      seedKeeper(db);
      const result = await runKeeperOwner(db, false);
      expect(db.tables.users[0]?.platformRole).toBe("owner");
      expect(db.tables.firms[0]?.ownerUserId).toBe(KEEPER);
      expect(result).toMatchObject({
        dryRun: false,
        after: { platformRole: "owner", firmOwnerAsserted: true },
      });
    });

    it("throws if the keeper does not own a firm", async () => {
      const db = fakeDb();
      db.tables.users.push(userDoc(KEEPER, { email: "ivanonigeria@gmail.com" }));
      await expect(runKeeperOwner(db, true)).rejects.toThrow(
        "Keeper is not the firm owner: abort",
      );
    });

    it("refuses a keeper email mismatch", async () => {
      const db = fakeDb();
      seedKeeper(db, { email: "other@example.com" });
      await expect(runKeeperOwner(db, true)).rejects.toThrow(
        "keeper email mismatch",
      );
    });

    it("refuses a confirm mismatch", async () => {
      const db = fakeDb();
      seedKeeper(db);
      await expect(runKeeperOwner(db, true, "PURGE ORPHANS")).rejects.toThrow(
        "confirm must be",
      );
    });

    it("is idempotent when run twice", async () => {
      const db = fakeDb();
      seedKeeper(db);
      await runKeeperOwner(db, false);
      const afterFirst = snapshot(db);
      const second = await runKeeperOwner(db, false);
      expect(second).toMatchObject({
        dryRun: false,
        after: { platformRole: "owner", firmOwnerAsserted: true },
      });
      expect(db.tables.users[0]?.platformRole).toBe("owner");
      expect(snapshot(db)).toBe(afterFirst);
    });
  });
});
