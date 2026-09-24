import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

export const listMine = query({
  args: {},
  returns: v.array(v.number()),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("userTaxYears")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const years = Array.from(new Set(rows.map((r) => r.taxYear)));
    years.sort((a, b) => b - a);
    return years;
  },
});

export const switchYear = mutation({
  args: { taxYear: v.number() },
  returns: v.object({
    success: v.boolean(),
    year: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const existing = await ctx.db
      .query("userTaxYears")
      .withIndex("by_user_and_year", (q) =>
        q.eq("userId", user._id).eq("taxYear", args.taxYear),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("userTaxYears", {
        userId: user._id,
        userExternalId: user.externalId,
        taxYear: args.taxYear,
        createdAt: Date.now(),
      });
    }
    return { success: true, year: args.taxYear };
  },
});
