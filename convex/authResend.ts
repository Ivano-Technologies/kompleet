import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { AUTH_ERROR_CODES, throwAuthError } from "./lib/authErrors";
import {
  emailSendLimitIdentifier,
  nextEmailSendState,
  type AuthEmailSendPurpose,
} from "./lib/authResendLimit";

export type ConsumeAuthEmailSendResult = {
  allowed: boolean;
  retryAfterSeconds: number | null;
};

type ConsumeCtx = {
  runMutation: (
    fn: typeof internal.authResend.consume,
    args: { email: string; purpose: AuthEmailSendPurpose },
  ) => Promise<ConsumeAuthEmailSendResult>;
};

export async function consumeAuthEmailSend(
  ctx: unknown,
  args: { email: string; purpose: AuthEmailSendPurpose },
): Promise<ConsumeAuthEmailSendResult> {
  if (!ctx || typeof ctx !== "object" || !("runMutation" in ctx)) {
    return { allowed: true, retryAfterSeconds: null };
  }
  const runMutation = (ctx as ConsumeCtx).runMutation;
  if (typeof runMutation !== "function") {
    return { allowed: true, retryAfterSeconds: null };
  }
  return await runMutation(internal.authResend.consume, args);
}

export function assertEmailSendAllowed(result: ConsumeAuthEmailSendResult): void {
  if (!result.allowed) {
    throwAuthError(
      AUTH_ERROR_CODES.RATE_LIMITED,
      result.retryAfterSeconds ?? 60,
    );
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
  returns: v.object({
    allowed: v.boolean(),
    retryAfterSeconds: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email) return { allowed: false, retryAfterSeconds: 60 };
    const identifier = emailSendLimitIdentifier(args.purpose, email);
    const existing = await ctx.db
      .query("authEmailSendLimits")
      .withIndex("identifier", (q) => q.eq("identifier", identifier))
      .unique();
    const now = Date.now();
    const { allowed, next, retryAfterSeconds } = nextEmailSendState(
      existing
        ? {
            lastSentAt: existing.lastSentAt,
            hourStartedAt: existing.hourStartedAt,
            hourCount: existing.hourCount,
          }
        : null,
      now,
    );
    if (!allowed) return { allowed: false, retryAfterSeconds };
    if (existing) {
      await ctx.db.patch(existing._id, next);
    } else {
      await ctx.db.insert("authEmailSendLimits", {
        identifier,
        ...next,
      });
    }
    return { allowed: true, retryAfterSeconds: null };
  },
});
