import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import { deleteInvoiceTree } from "./lib/eraseAccount";
import {
  OTP_PURGE_GRACE_MS,
  RETENTION_BATCH,
  SESSION_PURGE_GRACE_MS,
  isPastExpiry,
  shouldPurgeDeletedUser,
  shouldPurgeInvoice,
} from "./lib/retention";

const summary = v.object({
  otps: v.number(),
  sessions: v.number(),
  refreshTokens: v.number(),
  invoices: v.number(),
  users: v.number(),
  reschedule: v.boolean(),
});

async function purgeExpiredCodes(ctx: MutationCtx, now: number): Promise<number> {
  const rows = await ctx.db
    .query("authVerificationCodes")
    .order("asc")
    .take(RETENTION_BATCH);
  let deleted = 0;
  for (const row of rows) {
    if (!isPastExpiry(row.expirationTime, now, OTP_PURGE_GRACE_MS)) continue;
    await ctx.db.delete(row._id);
    deleted += 1;
  }
  return deleted;
}

async function purgeExpiredSessions(
  ctx: MutationCtx,
  now: number,
): Promise<{ sessions: number; refreshTokens: number }> {
  const sessions = await ctx.db
    .query("authSessions")
    .order("asc")
    .take(RETENTION_BATCH);
  let sessionCount = 0;
  let tokenCount = 0;
  for (const session of sessions) {
    if (!isPastExpiry(session.expirationTime, now, SESSION_PURGE_GRACE_MS)) {
      continue;
    }
    const tokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const token of tokens) {
      await ctx.db.delete(token._id);
      tokenCount += 1;
    }
    await ctx.db.delete(session._id);
    sessionCount += 1;
  }
  const orphanTokens = await ctx.db
    .query("authRefreshTokens")
    .order("asc")
    .take(RETENTION_BATCH);
  for (const token of orphanTokens) {
    if (!isPastExpiry(token.expirationTime, now, SESSION_PURGE_GRACE_MS)) {
      continue;
    }
    await ctx.db.delete(token._id);
    tokenCount += 1;
  }
  return { sessions: sessionCount, refreshTokens: tokenCount };
}

async function purgeDeletedAccountResidue(
  ctx: MutationCtx,
  now: number,
): Promise<{ invoices: number; users: number }> {
  const deletedUsers = await ctx.db
    .query("users")
    .withIndex("by_deletedAt", (q) => q.gt("deletedAt", 0))
    .take(RETENTION_BATCH);
  let invoices = 0;
  let users = 0;
  for (const user of deletedUsers) {
    const kept = await ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const remaining: Doc<"invoices">[] = [];
    for (const invoice of kept) {
      if (shouldPurgeInvoice(invoice, now)) {
        await deleteInvoiceTree(ctx, invoice._id);
        invoices += 1;
      } else {
        remaining.push(invoice);
      }
    }
    if (!shouldPurgeDeletedUser(user, remaining.length, now)) continue;
    const audit = await ctx.db
      .query("auditLogs")
      .withIndex("by_userExternalId", (q) =>
        q.eq("userExternalId", user.externalId),
      )
      .collect();
    for (const row of audit) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(user._id);
    users += 1;
  }
  return { invoices, users };
}

export async function purgeExpiredHandler(ctx: MutationCtx, now = Date.now()) {
  const otps = await purgeExpiredCodes(ctx, now);
  const sessions = await purgeExpiredSessions(ctx, now);
  const residue = await purgeDeletedAccountResidue(ctx, now);
  const reschedule =
    otps >= RETENTION_BATCH ||
    sessions.sessions >= RETENTION_BATCH ||
    residue.users >= RETENTION_BATCH;
  return {
    otps,
    sessions: sessions.sessions,
    refreshTokens: sessions.refreshTokens,
    invoices: residue.invoices,
    users: residue.users,
    reschedule,
  };
}

export const purgeExpired = internalMutation({
  args: {},
  returns: summary,
  handler: async (ctx): Promise<{
    otps: number;
    sessions: number;
    refreshTokens: number;
    invoices: number;
    users: number;
    reschedule: boolean;
  }> => {
    const result = await purgeExpiredHandler(ctx);
    if (result.reschedule) {
      await ctx.scheduler.runAfter(0, internal.retention.purgeExpired);
    }
    return result;
  },
});
