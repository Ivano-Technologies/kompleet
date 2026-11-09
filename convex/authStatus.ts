import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/auth";
import { isEmailVerified } from "./lib/emailVerified";

export const getMineEmailVerification = query({
  args: {},
  returns: v.union(
    v.object({
      verified: v.boolean(),
      email: v.string(),
      emailVerificationTime: v.union(v.number(), v.null()),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) return null;
    return {
      verified: isEmailVerified(user),
      email: user.email,
      emailVerificationTime: user.emailVerificationTime ?? null,
      createdAt: user.createdAt,
    };
  },
});
