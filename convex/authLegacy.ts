import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { isEmailVerified } from "./lib/emailVerified";

/**
 * Mark a password account as email-verified when the user row predates
 * required verification. Called on the sign-in flow before Convex Auth
 * checks `authAccounts.emailVerified`.
 */
export const trustLegacyPasswordAccount = internalMutation({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, { email }) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email),
      )
      .unique();
    if (!account || account.emailVerified) {
      return null;
    }
    const user = await ctx.db.get(account.userId);
    if (!user || user.deletedAt) {
      return null;
    }
    if (!isEmailVerified(user)) {
      return null;
    }
    await ctx.db.patch(account._id, { emailVerified: email });
    if (!user.emailVerificationTime) {
      await ctx.db.patch(user._id, {
        emailVerificationTime: user.createdAt,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});
