import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId } from "./lib/ids";

const statementApi = v.object({
  id: v.string(),
  user_id: v.string(),
  statement_type: v.string(),
  tax_year: v.union(v.number(), v.null()),
  data: v.any(),
  created_at: v.string(),
});

function toApi(row: {
  externalId: string;
  userExternalId: string;
  statementType: string;
  taxYear?: number;
  data: unknown;
  createdAt: number;
}) {
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    statement_type: row.statementType,
    tax_year: row.taxYear ?? null,
    data: row.data,
    created_at: new Date(row.createdAt).toISOString(),
  };
}

export const listMine = query({
  args: {
    statementType: v.optional(v.string()),
    taxYear: v.optional(v.number()),
  },
  returns: v.array(statementApi),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("financialStatements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const filtered = rows.filter((r) => {
      if (args.statementType && r.statementType !== args.statementType) {
        return false;
      }
      if (args.taxYear !== undefined && r.taxYear !== args.taxYear) {
        return false;
      }
      return true;
    });
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    return filtered.map(toApi);
  },
});

export const saveMine = mutation({
  args: {
    statementType: v.string(),
    taxYear: v.optional(v.number()),
    data: v.any(),
  },
  returns: statementApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    const externalId = newExternalId();
    await ctx.db.insert("financialStatements", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      statementType: args.statementType,
      taxYear: args.taxYear,
      data: args.data,
      createdAt: now,
    });
    const row = await ctx.db
      .query("financialStatements")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("Financial statement not found");
    return toApi(row);
  },
});
