import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { normalizeAuthEmail } from "./lib/createOrUpdateUser";
import {
  TOTP_INVALID,
  TOTP_UNAVAILABLE,
  checkTotpFactor,
  encryptNewSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCodes,
  otpauthUri,
  throwTotpError,
  totpEncryptionConfigured,
  verifyTotp,
  type TotpFactorState,
} from "./lib/totp";
import { decryptTotpSecret } from "./lib/totpCrypto";

const statusApi = v.object({
  available: v.boolean(),
  enabled: v.boolean(),
  pending: v.boolean(),
});

async function factorForUser(ctx: MutationCtx, userId: Id<"users">) {
  return await ctx.db
    .query("totpFactors")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

function asState(
  row: {
    encryptedSecret: string;
    enabled: boolean;
    pending: boolean;
    recoveryCodeHashes: string[];
    failedCount: number;
    windowStartedAt: number;
  } | null,
): TotpFactorState | null {
  if (!row) return null;
  return {
    encryptedSecret: row.encryptedSecret,
    enabled: row.enabled,
    pending: row.pending,
    recoveryCodeHashes: row.recoveryCodeHashes,
    failedCount: row.failedCount,
    windowStartedAt: row.windowStartedAt,
  };
}

async function persistCheck(
  ctx: MutationCtx,
  factorId: Id<"totpFactors"> | null,
  result: Awaited<ReturnType<typeof checkTotpFactor>>,
): Promise<void> {
  if (result.status === "failed") {
    if (factorId) {
      await ctx.db.patch(factorId, {
        failedCount: result.failedCount,
        windowStartedAt: result.windowStartedAt,
        updatedAt: Date.now(),
      });
    }
    throwTotpError(TOTP_INVALID);
  }
  if (result.status === "ok" && factorId) {
    const row = await ctx.db.get(factorId);
    if (!row) return;
    const hashes = result.consumedRecoveryHash
      ? row.recoveryCodeHashes.filter((hash) => hash !== result.consumedRecoveryHash)
      : row.recoveryCodeHashes;
    await ctx.db.patch(factorId, {
      recoveryCodeHashes: hashes,
      failedCount: 0,
      windowStartedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

export const getMine = query({
  args: {},
  returns: statusApi,
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("totpFactors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return {
      available: totpEncryptionConfigured(),
      enabled: Boolean(row?.enabled),
      pending: Boolean(row?.pending && !row.enabled),
    };
  },
});

export const startEnrollment = mutation({
  args: {},
  returns: v.object({
    otpauthUri: v.string(),
    secret: v.string(),
    recoveryCodes: v.array(v.string()),
  }),
  handler: async (ctx) => {
    if (!totpEncryptionConfigured()) {
      throw new Error(TOTP_UNAVAILABLE);
    }
    const user = await getCurrentUser(ctx);
    const existing = await factorForUser(ctx, user._id);
    if (existing?.enabled) {
      throw new Error("Two-factor authentication is already on.");
    }
    const secret = generateTotpSecret();
    const recoveryCodes = generateRecoveryCodes();
    const now = Date.now();
    const doc = {
      userId: user._id,
      encryptedSecret: await encryptNewSecret(secret),
      enabled: false,
      pending: true,
      recoveryCodeHashes: await hashRecoveryCodes(recoveryCodes),
      failedCount: 0,
      windowStartedAt: now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
    } else {
      await ctx.db.insert("totpFactors", doc);
    }
    return {
      otpauthUri: otpauthUri(user.email, secret),
      secret,
      recoveryCodes,
    };
  },
});

export const confirmEnrollment = mutation({
  args: { code: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!totpEncryptionConfigured()) {
      throw new Error(TOTP_UNAVAILABLE);
    }
    const user = await getCurrentUser(ctx);
    const existing = await factorForUser(ctx, user._id);
    if (!existing || !existing.pending) {
      throw new Error("Start authenticator setup first.");
    }
    const secret = await decryptTotpSecret(existing.encryptedSecret);
    if (!(await verifyTotp(secret, args.code))) {
      throwTotpError(TOTP_INVALID);
    }
    await ctx.db.patch(existing._id, {
      enabled: true,
      pending: false,
      failedCount: 0,
      windowStartedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const disableMine = mutation({
  args: {
    totpCode: v.optional(v.string()),
    recoveryCode: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const existing = await factorForUser(ctx, user._id);
    if (!existing?.enabled) {
      return null;
    }
    const result = await checkTotpFactor({
      factor: asState(existing),
      totpCode: args.totpCode,
      recoveryCode: args.recoveryCode,
    });
    await persistCheck(ctx, existing._id, result);
    await ctx.db.delete(existing._id);
    return null;
  },
});

export const assertSatisfied = internalMutation({
  args: {
    userId: v.id("users"),
    totpCode: v.optional(v.string()),
    recoveryCode: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await factorForUser(ctx, args.userId);
    const result = await checkTotpFactor({
      factor: asState(existing),
      totpCode: args.totpCode,
      recoveryCode: args.recoveryCode,
    });
    await persistCheck(ctx, existing?._id ?? null, result);
    return null;
  },
});

export const assertSatisfiedByEmail = internalMutation({
  args: {
    email: v.string(),
    totpCode: v.optional(v.string()),
    recoveryCode: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = normalizeAuthEmail(args.email);
    if (!email) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user || user.deletedAt) return null;
    const existing = await factorForUser(ctx, user._id);
    const result = await checkTotpFactor({
      factor: asState(existing),
      totpCode: args.totpCode,
      recoveryCode: args.recoveryCode,
    });
    await persistCheck(ctx, existing?._id ?? null, result);
    return null;
  },
});
