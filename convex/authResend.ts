import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import {
  EMAIL_SEND_RATE_LIMIT_MESSAGE,
  emailSendLimitIdentifier,
  nextEmailSendState,
  type AuthEmailSendPurpose,
} from "./lib/authResendLimit";

type ConsumeCtx = {
  runMutation: (
    fn: typeof internal.authResend.consume,
    args: { email: string; purpose: AuthEmailSendPurpose },
  ) => Promise<boolean>;
};

export async function consumeAuthEmailSend(
  ctx: unknown,
  args: { email: string; purpose: AuthEmailSendPurpose },
): Promise<boolean> {
  if (!ctx || typeof ctx !== "object" || !("runMutation" in ctx)) {
    return true;
  }
  const runMutation = (ctx as ConsumeCtx).runMutation;
  if (typeof runMutation !== "function") return true;
  return await runMutation(internal.authResend.consume, args);
}

export function assertEmailSendAllowed(allowed: boolean): void {
  if (!allowed) {
    throw new Error(EMAIL_SEND_RATE_LIMIT_MESSAGE);
  }
}

const purposeValidator = v.union(
  v.literal("email-verification"),
  v.literal("password-reset"),
);

export const consume = internalMutation({
  args: {
    email: v.string(),
    purpose: purposeValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email) return false;
    const identifier = emailSendLimitIdentifier(args.purpose, email);
    const existing = await ctx.db
      .query("authEmailSendLimits")
      .withIndex("identifier", (q) => q.eq("identifier", identifier))
      .unique();
    const now = Date.now();
    const { allowed, next } = nextEmailSendState(
      existing
        ? {
            lastSentAt: existing.lastSentAt,
            hourStartedAt: existing.hourStartedAt,
            hourCount: existing.hourCount,
          }
        : null,
      now,
    );
    if (!allowed) return false;
    if (existing) {
      await ctx.db.patch(existing._id, next);
    } else {
      await ctx.db.insert("authEmailSendLimits", {
        identifier,
        ...next,
      });
    }
    return true;
  },
});
