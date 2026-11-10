import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_AUTH_DEVICES } from "./sessionPolicy";

export async function deviceFingerprint(userAgent: string): Promise<string> {
  const normalized = userAgent.trim().toLowerCase().slice(0, 512) || "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function summarizeUserAgent(userAgent: string): string {
  const trimmed = userAgent.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 180) : "Unknown device";
}

export type RecordDeviceResult = {
  isNewDevice: boolean;
  notify: boolean;
};

export async function recordDeviceHandler(
  ctx: MutationCtx,
  user: Pick<Doc<"users">, "_id">,
  args: { userAgent: string; now?: number },
): Promise<RecordDeviceResult> {
  const now = args.now ?? Date.now();
  const fingerprint = await deviceFingerprint(args.userAgent);
  const existing = await ctx.db
    .query("authDevices")
    .withIndex("by_user_and_fingerprint", (q) =>
      q.eq("userId", user._id).eq("fingerprint", fingerprint),
    )
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, {
      lastSeenAt: now,
      userAgent: summarizeUserAgent(args.userAgent),
    });
    return { isNewDevice: false, notify: false };
  }

  const others = await ctx.db
    .query("authDevices")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();

  await ctx.db.insert("authDevices", {
    userId: user._id,
    fingerprint,
    userAgent: summarizeUserAgent(args.userAgent),
    createdAt: now,
    lastSeenAt: now,
  });

  if (others.length >= MAX_AUTH_DEVICES) {
    const oldest = others.reduce((min, row) =>
      row.lastSeenAt < min.lastSeenAt ? row : min,
    );
    await ctx.db.delete(oldest._id);
  }

  return { isNewDevice: true, notify: others.length > 0 };
}

export async function deleteAuthSessionsForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<number> {
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();
  for (const session of sessions) {
    const tokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const token of tokens) {
      await ctx.db.delete(token._id);
    }
    await ctx.db.delete(session._id);
  }
  return sessions.length;
}

export async function deleteAuthDevicesForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const devices = await ctx.db
    .query("authDevices")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const device of devices) {
    await ctx.db.delete(device._id);
  }
}
