import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/** Post-backfill checksums. Auth-less because it is internal-only. */
export const checksums = internalQuery({
  args: {},
  returns: v.object({
    users: v.number(),
    transactions: v.number(),
    sumAmount: v.number(),
    categories: v.number(),
    importSessions: v.number(),
    importErrors: v.number(),
    exportHistory: v.number(),
    expenseCategories: v.number(),
    sources: v.number(),
    ruleVersions: v.number(),
    taxRules: v.number(),
    firms: v.number(),
    clients: v.number(),
    invoices: v.number(),
    expenses: v.number(),
    documents: v.number(),
  }),
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    let sumAmount = 0;
    for (const row of transactions) {
      sumAmount += row.amount;
    }
    return {
      users: (await ctx.db.query("users").collect()).length,
      transactions: transactions.length,
      sumAmount,
      categories: (await ctx.db.query("categories").collect()).length,
      importSessions: (await ctx.db.query("importSessions").collect()).length,
      importErrors: (await ctx.db.query("importErrors").collect()).length,
      exportHistory: (await ctx.db.query("exportHistory").collect()).length,
      expenseCategories: (await ctx.db.query("expenseCategories").collect())
        .length,
      sources: (await ctx.db.query("sources").collect()).length,
      ruleVersions: (await ctx.db.query("ruleVersions").collect()).length,
      taxRules: (await ctx.db.query("taxRules").collect()).length,
      firms: (await ctx.db.query("firms").collect()).length,
      clients: (await ctx.db.query("clients").collect()).length,
      invoices: (await ctx.db.query("invoices").collect()).length,
      expenses: (await ctx.db.query("expenses").collect()).length,
      documents: (await ctx.db.query("documents").collect()).length,
    };
  },
});
