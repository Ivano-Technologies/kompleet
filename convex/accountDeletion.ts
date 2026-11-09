import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { eraseMineHandler } from "./lib/eraseAccount";

export const eraseMine = mutation({
  args: {},
  returns: v.object({
    erased: v.boolean(),
    keptInvoices: v.number(),
  }),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await eraseMineHandler(ctx, user);
  },
});
