import { query } from "./_generated/server";
import { v } from "convex/values";

/** Cheap authenticated ping — not a replacement for Supabase Auth keep-alive. */
export const ping = query({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    users: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return { ok: true, users: identity.subject ? 1 : 0 };
  },
});
