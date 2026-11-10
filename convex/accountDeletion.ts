import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import {
  DELETE_ACCOUNT_PHRASE,
  eraseMineHandler,
} from "./lib/eraseAccount";

export const eraseMine = mutation({
  args: { confirmText: v.string() },
  returns: v.object({
    erased: v.boolean(),
    keptInvoices: v.number(),
  }),
  handler: async (ctx, args) => {
    if (args.confirmText.trim() !== DELETE_ACCOUNT_PHRASE) {
      throw new ConvexError("Type delete my account to confirm.");
    }
    const user = await getCurrentUser(ctx);
    return await eraseMineHandler(ctx, user);
  },
});
