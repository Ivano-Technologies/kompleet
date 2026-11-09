import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { EMAIL_VERIFICATION_REQUIRED_AFTER_MS } from "./lib/emailVerified";
import { normalizeAuthEmail } from "./lib/createOrUpdateUser";

/**
 * Mark a password account as email-verified when that *login* predates
 * required verification. Called on the sign-in flow before Convex Auth
 * checks `authAccounts.emailVerified`.
 *
 * Trust the auth account's creation time, not the users row. Linking a
 * new password to a pre-cutoff profile must still require an OTP.
 */
export async function trustLegacyPasswordAccountHandler(
  ctx: MutationCtx,
  args: { email: string },
) {
  const email = normalizeAuthEmail(args.email);
  if (!email) return null;
  const account = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", "password").eq("providerAccountId", email),
    )
    .unique();
  if (!account || account.emailVerified) {
    return null;
  }
  if (account._creationTime >= EMAIL_VERIFICATION_REQUIRED_AFTER_MS) {
    return null;
  }
  const user = await ctx.db.get(account.userId);
  if (!user || user.deletedAt) {
    return null;
  }
  await ctx.db.patch(account._id, { emailVerified: email });
  if (!user.emailVerificationTime) {
    await ctx.db.patch(user._id, {
      emailVerificationTime: account._creationTime,
      updatedAt: Date.now(),
    });
  }
  return null;
}

export const trustLegacyPasswordAccount = internalMutation({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await trustLegacyPasswordAccountHandler(ctx, args);
  },
});
