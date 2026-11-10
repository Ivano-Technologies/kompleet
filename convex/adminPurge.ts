/**
 * ONE-OFF hotfix module. Remove in the next release after the prod purge.
 * Internal only. Never deploy or run from this PR without the owner's OK.
 *
 * Ships on hotfix/admin-purge off main @ c1a244f. No schema change.
 */
import { v } from "convex/values";
import type { Doc, Id, TableNames } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { emailSendLimitIdentifier } from "./lib/authResendLimit";
import * as eraseAccount from "./lib/eraseAccount";

export const KEEPER = "nn70z49qsbdrfwszjjwg74pbz98f05rp";
export const ALLOWED = new Set([
  "nn71j50ytsa4h90g3nb10remdn8hy0bn",
  "nn7287k0tc8bxc307ewt4v14ms8f6qaz",
  "nn7fq2mjs7a47cf8fdv3w0zbwh8f7kxj",
  "nn7c2wpr39p2qvswdeshkjptpx8f7dvr",
  "nn7c93rzc1ks8keqq5wt9csvjn8f727r",
  "nn7cs6twzts7hnrsdveaqd04y18f1ctc",
  "nn753am93fn95q6z89mff3v1xn8f13t0",
  "nn7azbg1mdtp0tspkq72gs3bdh8f103d",
  "nn7eh3d201s0t0234n1efzy3zn8f0897",
]);

/** Schema fields typed as a Convex storage id. Scanned at run time. */
export const STORAGE_REF_FIELDS = [
  ["users", "avatarStorageId"],
  ["businessProfiles", "logoStorageId"],
  ["importSessions", "storageId"],
  ["exportHistory", "storageId"],
  ["expenses", "receiptStorageId"],
  ["documents", "storageId"],
  ["uploadedFiles", "storageId"],
] as const;

/** JSON blobs that can hold a nested logo storage id. */
const JSON_STORAGE_TABLES = [
  "invoices",
  "invoiceArchives",
  "auditLogs",
] as const;

const PASSWORD_RESET_PREFIX = "password-reset:";

/** Super admin in this app is users.platformRole = "owner". No env allowlist. */
export const HIGHEST_PLATFORM_ROLE = "owner" as const;

/** Prod leftover counts after the 9 hard deletes (read-only check). */
export const EXPECTED_UNREFERENCED_STORAGE = 51;
export const EXPECTED_ORPHAN_SEQUENCES = 1;
export const EXPECTED_ORPHAN_SEND_LIMITS = 1;
export const EXPECTED_KEEPER_REFERENCED_STORAGE = 8;

type Plan = Record<string, Set<string>>;

type StorageFile = { _id: Id<"_storage">; size?: number };

const add = (plan: Plan, table: string, ids: string[]) => {
  plan[table] ??= new Set();
  for (const id of ids) plan[table].add(id);
};

const counts = (plan: Plan) =>
  Object.fromEntries(Object.entries(plan).map(([table, ids]) => [table, ids.size]));

function asId<T extends TableNames>(id: string): Id<T> {
  return id as Id<T>;
}

async function ownedClients(ctx: MutationCtx, userId: Id<"users">) {
  const firms = await ctx.db
    .query("firms")
    .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", userId))
    .collect();
  const clients: Doc<"clients">[] = [];
  for (const firm of firms) {
    clients.push(
      ...(await ctx.db
        .query("clients")
        .withIndex("by_firm", (q) => q.eq("firmId", firm._id))
        .collect()),
    );
  }
  return { firms, clients };
}

async function collectAll<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
): Promise<Doc<T>[]> {
  return await ctx.db.query(table).collect();
}

function walkStrings(value: unknown, visit: (s: string) => void) {
  if (typeof value === "string") {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, visit);
    return;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      walkStrings(nested, visit);
    }
  }
}

async function listStorageFiles(ctx: MutationCtx): Promise<StorageFile[]> {
  return (await ctx.db.system.query("_storage").collect()) as StorageFile[];
}

async function deleteDoc(ctx: MutationCtx, id: string) {
  const row = await ctx.db.get(asId(id));
  if (row) await ctx.db.delete(asId(id));
}

/**
 * Residue eraseMineHandler keeps (issued/paid/cancelled invoices, firm,
 * clients, sequences, users) plus anything else still linked to the target.
 */
async function buildLinkedPlan(ctx: MutationCtx, user: Doc<"users">): Promise<Plan> {
  const plan: Plan = {};
  const userId = user._id;

  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const invoice of invoices) {
    add(
      plan,
      "invoiceArchives",
      (
        await ctx.db
          .query("invoiceArchives")
          .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
          .collect()
      ).map((row) => row._id),
    );
    add(
      plan,
      "invoiceAuditLogs",
      (
        await ctx.db
          .query("invoiceAuditLogs")
          .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
          .collect()
      ).map((row) => row._id),
    );
  }
  add(
    plan,
    "invoices",
    invoices.map((row) => row._id),
  );

  const { firms, clients } = await ownedClients(ctx, userId);
  const targetClientExt = new Set(clients.map((client) => client.externalId));
  for (const client of clients) {
    add(
      plan,
      "clientKeys",
      (
        await ctx.db
          .query("clientKeys")
          .withIndex("by_client", (q) => q.eq("clientId", client._id))
          .collect()
      ).map((row) => row._id),
    );
  }
  add(
    plan,
    "clients",
    clients.map((row) => row._id),
  );
  for (const firm of firms) {
    add(
      plan,
      "firmMembers",
      (
        await ctx.db
          .query("firmMembers")
          .withIndex("by_firm", (q) => q.eq("firmId", firm._id))
          .collect()
      ).map((row) => row._id),
    );
  }
  add(
    plan,
    "firms",
    firms.map((row) => row._id),
  );

  const seqByUser = await ctx.db
    .query("invoiceSequences")
    .withIndex("by_user_and_year", (q) => q.eq("userId", userId))
    .collect();
  add(
    plan,
    "invoiceSequences",
    seqByUser.map((row) => row._id),
  );
  for (const ext of targetClientExt) {
    const rows = await ctx.db
      .query("invoiceSequences")
      .withIndex("by_client_and_year", (q) => q.eq("clientExternalId", ext))
      .collect();
    add(
      plan,
      "invoiceSequences",
      rows
        .filter((row) => row.userId === undefined || row.userId === userId)
        .map((row) => row._id),
    );
  }

  add(
    plan,
    "auditLogs",
    (
      await ctx.db
        .query("auditLogs")
        .withIndex("by_userExternalId", (q) =>
          q.eq("userExternalId", user.externalId),
        )
        .collect()
    ).map((row) => row._id),
  );
  add(plan, "users", [userId]);

  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();
  const sessionIds = new Set(sessions.map((session) => session._id as string));
  for (const session of sessions) {
    add(
      plan,
      "authRefreshTokens",
      (
        await ctx.db
          .query("authRefreshTokens")
          .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
          .collect()
      ).map((row) => row._id),
    );
  }
  add(
    plan,
    "authVerifiers",
    (await collectAll(ctx, "authVerifiers"))
      .filter(
        (row) =>
          typeof row.sessionId === "string" && sessionIds.has(row.sessionId),
      )
      .map((row) => row._id),
  );
  add(
    plan,
    "authSessions",
    sessions.map((row) => row._id),
  );

  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();
  for (const account of accounts) {
    add(
      plan,
      "authVerificationCodes",
      (
        await ctx.db
          .query("authVerificationCodes")
          .withIndex("accountId", (q) => q.eq("accountId", account._id))
          .collect()
      ).map((row) => row._id),
    );
  }
  add(
    plan,
    "authAccounts",
    accounts.map((row) => row._id),
  );

  if (user.email) {
    add(
      plan,
      "authRateLimits",
      (
        await ctx.db
          .query("authRateLimits")
          .withIndex("identifier", (q) => q.eq("identifier", user.email))
          .collect()
      ).map((row) => row._id),
    );
    add(
      plan,
      "e2eAuthOtps",
      (
        await ctx.db
          .query("e2eAuthOtps")
          .withIndex("by_email", (q) => q.eq("email", user.email))
          .collect()
      ).map((row) => row._id),
    );
    for (const purpose of ["email-verification", "password-reset"] as const) {
      const identifier = emailSendLimitIdentifier(purpose, user.email);
      add(
        plan,
        "authEmailSendLimits",
        (
          await ctx.db
            .query("authEmailSendLimits")
            .withIndex("identifier", (q) => q.eq("identifier", identifier))
            .collect()
        ).map((row) => row._id),
      );
    }
  }

  const byUserTables = [
    "uploadedFiles",
    "documents",
    "expenses",
    "exportHistory",
    "transactions",
    "taxCalculations",
    "financialStatements",
    "taxReports",
    "userTaxYears",
    "duplicateCandidates",
    "expenseCategories",
    "filingAuditLogs",
    "businessProfiles",
  ] as const;
  for (const table of byUserTables) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    add(
      plan,
      table,
      rows.map((row) => row._id),
    );
  }
  const importSessions = await ctx.db
    .query("importSessions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  add(
    plan,
    "importSessions",
    importSessions.map((row) => row._id),
  );
  for (const session of importSessions) {
    add(
      plan,
      "importErrors",
      (
        await ctx.db
          .query("importErrors")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect()
      ).map((row) => row._id),
    );
  }
  const forms = await ctx.db
    .query("nrsForms")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  add(
    plan,
    "nrsForms",
    forms.map((row) => row._id),
  );
  for (const form of forms) {
    add(
      plan,
      "formFilingStatuses",
      (
        await ctx.db
          .query("formFilingStatuses")
          .withIndex("by_form", (q) => q.eq("formId", form._id))
          .collect()
      ).map((row) => row._id),
    );
  }
  add(
    plan,
    "deadlineReminders",
    (
      await ctx.db
        .query("deadlineReminders")
        .withIndex("by_user_and_key", (q) => q.eq("userId", userId))
        .collect()
    ).map((row) => row._id),
  );

  const memberships = await ctx.db
    .query("firmMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  add(
    plan,
    "firmMembers",
    memberships.map((row) => row._id),
  );

  return plan;
}

async function keeperReferencedStorage(
  ctx: MutationCtx,
  keeper: Doc<"users">,
): Promise<Set<string>> {
  const ids = new Set<string>();
  if (keeper.avatarStorageId) ids.add(keeper.avatarStorageId);
  const profile = await ctx.db
    .query("businessProfiles")
    .withIndex("by_user", (q) => q.eq("userId", keeper._id))
    .unique();
  if (profile?.logoStorageId) ids.add(profile.logoStorageId);
  const tables = [
    ["uploadedFiles", "storageId"],
    ["documents", "storageId"],
    ["expenses", "receiptStorageId"],
    ["exportHistory", "storageId"],
    ["importSessions", "storageId"],
  ] as const;
  for (const [table, field] of tables) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_user", (q) => q.eq("userId", keeper._id))
      .collect();
    for (const row of rows) {
      const value = (row as Record<string, unknown>)[field];
      if (typeof value === "string") ids.add(value);
    }
  }
  return ids;
}

/** Throws if any planned row belongs to the keeper. Read-only. */
async function assertKeeperUntouched(ctx: MutationCtx, plan: Plan) {
  const keeper = await ctx.db.get(asId<"users">(KEEPER));
  if (!keeper) throw new Error("Keeper row missing: abort");
  const { firms, clients } = await ownedClients(ctx, keeper._id);
  const keeperIds = new Set<string>([
    keeper._id,
    ...firms.map((firm) => firm._id),
    ...clients.map((client) => client._id),
  ]);
  const keeperClientExt = new Set(clients.map((client) => client.externalId));
  const keeperStorage = await keeperReferencedStorage(ctx, keeper);
  for (const [table, ids] of Object.entries(plan)) {
    for (const id of ids) {
      if (keeperIds.has(id)) {
        throw new Error(`Plan touches keeper ${table} row: abort`);
      }
      if (table === "_storage" && keeperStorage.has(id)) {
        throw new Error("Plan touches keeper storage file: abort");
      }
      const row = (await ctx.db.get(asId(id))) as Record<string, unknown> | null;
      if (!row) continue;
      if (
        row.userId === KEEPER ||
        row.ownerUserId === KEEPER ||
        row.userExternalId === keeper.externalId ||
        row.uploadedBy === KEEPER
      ) {
        throw new Error(`Plan touches keeper-owned ${table} row: abort`);
      }
      if (
        table === "invoiceSequences" &&
        typeof row.clientExternalId === "string" &&
        keeperClientExt.has(row.clientExternalId)
      ) {
        throw new Error("Plan touches keeper invoiceSequence: abort");
      }
    }
  }
}

const DELETE_ORDER = [
  "authRefreshTokens",
  "authVerificationCodes",
  "authVerifiers",
  "authSessions",
  "authAccounts",
  "authRateLimits",
  "authEmailSendLimits",
  "e2eAuthOtps",
  "importErrors",
  "duplicateCandidates",
  "invoiceArchives",
  "invoiceAuditLogs",
  "clientKeys",
  "formFilingStatuses",
  "nrsForms",
  "invoices",
  "invoiceSequences",
  "clients",
  "firmMembers",
  "firms",
  "uploadedFiles",
  "documents",
  "expenses",
  "exportHistory",
  "importSessions",
  "businessProfiles",
  "transactions",
  "taxCalculations",
  "financialStatements",
  "taxReports",
  "userTaxYears",
  "filingAuditLogs",
  "expenseCategories",
  "deadlineReminders",
  "auditLogs",
  "users",
];

async function deletePlan(ctx: MutationCtx, plan: Plan) {
  const seen = new Set<string>();
  for (const table of DELETE_ORDER) {
    const ids = plan[table];
    if (!ids) continue;
    for (const id of ids) {
      await deleteDoc(ctx, id);
      seen.add(`${table}:${id}`);
    }
  }
  for (const [table, ids] of Object.entries(plan)) {
    for (const id of ids) {
      if (seen.has(`${table}:${id}`)) continue;
      if (table === "_storage") {
        await ctx.storage.delete(id as Id<"_storage">);
        continue;
      }
      await deleteDoc(ctx, id);
    }
  }
}

export async function hardDeleteUserHandler(
  ctx: MutationCtx,
  args: { userId: Id<"users">; dryRun: boolean },
) {
  const { userId, dryRun } = args;
  if (userId === KEEPER) throw new Error("Refusing: keeper account");
  if (!ALLOWED.has(userId)) throw new Error("Refusing: id not on approved list");
  const user = await ctx.db.get(userId);
  if (!user) return { alreadyGone: true as const };
  const willCallErase = !user.deletedAt;

  if (dryRun) {
    const plan = await buildLinkedPlan(ctx, user);
    await assertKeeperUntouched(ctx, plan);
    return {
      dryRun: true as const,
      order: willCallErase
        ? [
            "eraseMineHandler",
            "auditLogsByExternalId(incl. new account_erased row)",
            "residue",
            "users",
          ]
        : [
            "(already erased: skip eraseMineHandler)",
            "auditLogsByExternalId",
            "residue",
            "users",
          ],
      auditLogsExisting: plan.auditLogs?.size ?? 0,
      auditLogsExpectedDeletedOnRun:
        (plan.auditLogs?.size ?? 0) + (willCallErase ? 1 : 0),
      accountErasedRowCaught: true,
      residueCounts: counts(plan),
      keeperUntouched: true as const,
    };
  }

  const prePlan = await buildLinkedPlan(ctx, user);
  await assertKeeperUntouched(ctx, prePlan);
  const auditLogsExisting = prePlan.auditLogs?.size ?? 0;

  if (willCallErase) await eraseAccount.eraseMineHandler(ctx, user);
  const fresh = await ctx.db.get(userId);
  if (!fresh) return { alreadyGone: true as const };
  const postPlan = await buildLinkedPlan(ctx, fresh);
  const plan: Plan = {};
  for (const source of [prePlan, postPlan]) {
    for (const [table, ids] of Object.entries(source)) {
      add(plan, table, [...ids]);
    }
  }
  await assertKeeperUntouched(ctx, plan);
  await deletePlan(ctx, plan);

  const leftAudit = await ctx.db
    .query("auditLogs")
    .withIndex("by_userExternalId", (q) =>
      q.eq("userExternalId", user.externalId),
    )
    .collect();
  if (
    leftAudit.some((row) => row.action === eraseAccount.ACCOUNT_ERASED_ACTION) ||
    leftAudit.length
  ) {
    throw new Error("auditLogs residue remains: abort (rolls back)");
  }
  return {
    deleted: counts(plan),
    auditLogsDeleted: auditLogsExisting + (willCallErase ? 1 : 0),
    calledEraseMine: willCallErase,
  };
}

export const hardDeleteUser = internalMutation({
  args: {
    userId: v.id("users"),
    confirm: v.literal("HARD DELETE"),
    dryRun: v.boolean(),
  },
  handler: async (ctx, { userId, dryRun }) => {
    return await hardDeleteUserHandler(ctx, { userId, dryRun });
  },
});

async function collectReferencedStorageIds(
  ctx: MutationCtx,
  storageIds: Set<string>,
): Promise<Set<string>> {
  const referenced = new Set<string>();
  const addIfStorage = (value: unknown) => {
    if (typeof value === "string" && storageIds.has(value)) referenced.add(value);
  };
  for (const [table, field] of STORAGE_REF_FIELDS) {
    const rows = await collectAll(ctx, table);
    for (const row of rows) {
      addIfStorage((row as Record<string, unknown>)[field]);
    }
  }
  for (const table of JSON_STORAGE_TABLES) {
    const rows = await collectAll(ctx, table);
    for (const row of rows) walkStrings(row, addIfStorage);
  }
  return referenced;
}

function refuseCount(label: string, expected: number, found: number): never {
  throw new Error(`Refusing: expected ${expected} ${label}, found ${found}`);
}

async function buildOrphanPlan(ctx: MutationCtx) {
  const keeper = await ctx.db.get(asId<"users">(KEEPER));
  if (!keeper) throw new Error("Keeper row missing: abort");

  const users = await collectAll(ctx, "users");
  if (users.length !== 1 || users[0]?._id !== keeper._id) {
    throw new Error("Refusing: keeper is not the only remaining user");
  }

  const files = await listStorageFiles(ctx);
  const storageIds = new Set(files.map((file) => file._id as string));
  const referenced = await collectReferencedStorageIds(ctx, storageIds);
  const keeperStorage = await keeperReferencedStorage(ctx, keeper);
  if (keeperStorage.size !== EXPECTED_KEEPER_REFERENCED_STORAGE) {
    refuseCount(
      "keeper-referenced storage files",
      EXPECTED_KEEPER_REFERENCED_STORAGE,
      keeperStorage.size,
    );
  }

  const unreferencedStorage = files.filter((file) => !referenced.has(file._id));
  for (const file of unreferencedStorage) {
    if (keeperStorage.has(file._id)) {
      throw new Error("Plan touches keeper storage file: abort");
    }
  }
  if (unreferencedStorage.length !== EXPECTED_UNREFERENCED_STORAGE) {
    refuseCount(
      "unreferenced storage files",
      EXPECTED_UNREFERENCED_STORAGE,
      unreferencedStorage.length,
    );
  }

  const clients = await collectAll(ctx, "clients");
  const clientExt = new Set(clients.map((client) => client.externalId));
  const clientIds = new Set(clients.map((client) => client._id as string));
  const { clients: keeperClients } = await ownedClients(ctx, keeper._id);
  const keeperClientExt = new Set(keeperClients.map((client) => client.externalId));

  const sequences = await collectAll(ctx, "invoiceSequences");
  const orphanSequences = sequences.filter((row) => {
    if (row.userId === keeper._id) return false;
    if (row.userId !== undefined) return false;
    if (
      typeof row.clientExternalId === "string" &&
      keeperClientExt.has(row.clientExternalId)
    ) {
      return false;
    }
    const extGone =
      typeof row.clientExternalId === "string" &&
      !clientExt.has(row.clientExternalId);
    const idGone =
      typeof row.clientId === "string" && !clientIds.has(row.clientId);
    return extGone || idGone;
  });
  if (orphanSequences.length !== EXPECTED_ORPHAN_SEQUENCES) {
    refuseCount(
      "orphan invoiceSequences rows",
      EXPECTED_ORPHAN_SEQUENCES,
      orphanSequences.length,
    );
  }

  const emails = new Set(
    users.map((row) => row.email.trim().toLowerCase()).filter(Boolean),
  );
  const keeperEmail = keeper.email.trim().toLowerCase();
  const sendLimits = await collectAll(ctx, "authEmailSendLimits");
  const orphanSendLimits = sendLimits.filter((row) => {
    if (!row.identifier.startsWith(PASSWORD_RESET_PREFIX)) return false;
    const email = row.identifier.slice(PASSWORD_RESET_PREFIX.length);
    if (email === keeperEmail) return false;
    return !emails.has(email);
  });
  if (orphanSendLimits.length !== EXPECTED_ORPHAN_SEND_LIMITS) {
    refuseCount(
      "orphan authEmailSendLimits rows",
      EXPECTED_ORPHAN_SEND_LIMITS,
      orphanSendLimits.length,
    );
  }

  const bytes = unreferencedStorage.reduce(
    (sum, file) => sum + (typeof file.size === "number" ? file.size : 0),
    0,
  );

  const plan: Plan = {};
  add(
    plan,
    "_storage",
    unreferencedStorage.map((file) => file._id),
  );
  add(
    plan,
    "invoiceSequences",
    orphanSequences.map((row) => row._id),
  );
  add(
    plan,
    "authEmailSendLimits",
    orphanSendLimits.map((row) => row._id),
  );
  await assertKeeperUntouched(ctx, plan);

  return {
    keeper,
    plan,
    unreferencedStorage,
    orphanSequences,
    orphanSendLimits,
    bytes,
    keeperStorage,
  };
}

export async function purgeOrphansHandler(
  ctx: MutationCtx,
  args: { dryRun: boolean },
) {
  const built = await buildOrphanPlan(ctx);
  const storageIds = built.unreferencedStorage.map((file) => file._id);
  const sequenceIds = built.orphanSequences.map((row) => row._id);
  const sendLimitIds = built.orphanSendLimits.map((row) => row._id);
  if (args.dryRun) {
    return {
      dryRun: true as const,
      unreferencedStorageIds: storageIds,
      unreferencedStorageCount: storageIds.length,
      unreferencedStorageBytes: built.bytes,
      orphanInvoiceSequenceIds: sequenceIds,
      orphanAuthEmailSendLimitIds: sendLimitIds,
      keeperUntouched: true as const,
    };
  }
  await deletePlan(ctx, built.plan);
  return {
    dryRun: false as const,
    deletedStorageCount: storageIds.length,
    deletedStorageBytes: built.bytes,
    deletedInvoiceSequences: sequenceIds.length,
    deletedAuthEmailSendLimits: sendLimitIds.length,
    keeperUntouched: true as const,
  };
}

export const purgeOrphans = internalMutation({
  args: { dryRun: v.boolean() },
  handler: async (ctx, args) => {
    return await purgeOrphansHandler(ctx, args);
  },
});

async function assertKeeperOwnsFirm(ctx: MutationCtx, keeper: Doc<"users">) {
  const firms = await ctx.db
    .query("firms")
    .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", keeper._id))
    .collect();
  if (firms.length === 0) {
    throw new Error("Keeper is not the firm owner: abort");
  }
  return firms;
}

export async function makeKeeperOwnerSuperAdminHandler(
  ctx: MutationCtx,
  args: { dryRun: boolean },
) {
  const keeper = await ctx.db.get(asId<"users">(KEEPER));
  if (!keeper) throw new Error("Keeper row missing: abort");
  const firms = await assertKeeperOwnsFirm(ctx, keeper);
  const before = {
    userId: keeper._id,
    platformRole: keeper.platformRole ?? null,
    firmOwnerUserIds: firms.map((firm) => firm.ownerUserId),
  };
  const after = {
    userId: keeper._id,
    platformRole: HIGHEST_PLATFORM_ROLE,
    firmOwnerUserIds: firms.map(() => keeper._id),
    firmOwnerAsserted: true as const,
  };
  const wouldWrite = before.platformRole !== HIGHEST_PLATFORM_ROLE;

  if (args.dryRun) {
    return {
      dryRun: true as const,
      highestExistingRole: HIGHEST_PLATFORM_ROLE,
      envAllowlist: null,
      before,
      after,
      wouldWrite,
    };
  }

  if (wouldWrite) {
    await ctx.db.patch(keeper._id, {
      platformRole: HIGHEST_PLATFORM_ROLE,
      updatedAt: Date.now(),
    });
  }
  const fresh = (await ctx.db.get(keeper._id))!;
  return {
    dryRun: false as const,
    highestExistingRole: HIGHEST_PLATFORM_ROLE,
    envAllowlist: null,
    before,
    after: {
      userId: fresh._id,
      platformRole: fresh.platformRole ?? null,
      firmOwnerUserIds: firms.map((firm) => firm.ownerUserId),
      firmOwnerAsserted: true as const,
    },
  };
}

export const makeKeeperOwnerSuperAdmin = internalMutation({
  args: { dryRun: v.boolean() },
  handler: async (ctx, args) => {
    return await makeKeeperOwnerSuperAdminHandler(ctx, args);
  },
});
