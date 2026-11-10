import { v } from "convex/values";
import { action, internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser } from "./lib/auth";
import {
  deleteAuthDevicesForUser,
  deleteAuthSessionsForUser,
  recordDeviceHandler,
  summarizeUserAgent,
} from "./lib/authDevices";
import { newDeviceNotice, sendSecurityEmail } from "./lib/authEmail";

export const revokeAllMine = mutation({
  args: {},
  returns: v.object({ revoked: v.number() }),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const revoked = await deleteAuthSessionsForUser(ctx, user._id);
    await deleteAuthDevicesForUser(ctx, user._id);
    return { revoked };
  },
});

export const recordDeviceInternal = internalMutation({
  args: { userAgent: v.string() },
  returns: v.object({
    isNewDevice: v.boolean(),
    notify: v.boolean(),
    email: v.string(),
    deviceLabel: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const result = await recordDeviceHandler(ctx, user, {
      userAgent: args.userAgent,
    });
    return {
      ...result,
      email: user.email,
      deviceLabel: summarizeUserAgent(args.userAgent),
    };
  },
});

export const recordSignIn = action({
  args: { userAgent: v.string() },
  returns: v.object({ notified: v.boolean() }),
  handler: async (ctx, args) => {
    const recorded = await ctx.runMutation(internal.sessions.recordDeviceInternal, {
      userAgent: args.userAgent,
    });
    if (!recorded.notify) {
      return { notified: false };
    }
    const notice = newDeviceNotice(recorded.email, recorded.deviceLabel);
    const sent = await sendSecurityEmail({
      email: recorded.email,
      purpose: "new-device",
      ...notice,
    });
    return { notified: sent };
  },
});
