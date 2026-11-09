import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, query } from "./_generated/server";
import { isE2eOtpStoreEnabled } from "./lib/authEmail";

const purposeValidator = v.union(
  v.literal("email-verification"),
  v.literal("password-reset"),
);

type E2eOtpPurpose = "email-verification" | "password-reset";

type E2eOtpActionCtx = {
  runMutation: (
    fn: typeof internal.e2eOtp.save,
    args: { email: string; token: string; purpose: E2eOtpPurpose },
  ) => Promise<null>;
};

/**
 * Persist the last OTP for Playwright on isolated Convex. No-op when Resend
 * is configured so production never stores plaintext codes.
 */
export async function recordE2eOtp(
  ctx: unknown,
  args: { email: string; token: string; purpose: E2eOtpPurpose },
): Promise<void> {
  if (!isE2eOtpStoreEnabled()) return;
  if (!ctx || typeof ctx !== "object" || !("runMutation" in ctx)) return;
  const runMutation = (ctx as E2eOtpActionCtx).runMutation;
  if (typeof runMutation !== "function") return;
  await runMutation(internal.e2eOtp.save, {
    email: args.email,
    token: args.token,
    purpose: args.purpose,
  });
}

export const save = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    purpose: purposeValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!isE2eOtpStoreEnabled()) return null;
    const email = args.email.trim().toLowerCase();
    if (!email || !/^\d{8}$/.test(args.token)) return null;
    const existing = await ctx.db
      .query("e2eAuthOtps")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        token: args.token,
        purpose: args.purpose,
        createdAt: now,
      });
    } else {
      await ctx.db.insert("e2eAuthOtps", {
        email,
        token: args.token,
        purpose: args.purpose,
        createdAt: now,
      });
    }
    return null;
  },
});

export const getForEmail = query({
  args: {
    email: v.string(),
    secret: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { email, secret }) => {
    if (!isE2eOtpStoreEnabled()) return null;
    if (secret !== process.env.AUTH_E2E_OTP?.trim()) return null;
    const row = await ctx.db
      .query("e2eAuthOtps")
      .withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase()))
      .unique();
    return row?.token ?? null;
  },
});
