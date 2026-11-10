import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId } from "./lib/ids";
import {
  cursorValidator,
  listCursorReturns,
  nextCursorOf,
  paginationOptsFromArgs,
} from "./lib/listPage";

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
    cursor: cursorValidator,
    limit: v.optional(v.number()),
  },
  returns: v.object({
    statements: v.array(statementApi),
    ...listCursorReturns,
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const indexed = ctx.db
      .query("financialStatements")
      .withIndex("by_user", (q) => q.eq("userId", user._id));
    const byType = args.statementType
      ? indexed.filter((q) => q.eq(q.field("statementType"), args.statementType))
      : indexed;
    const byYear =
      args.taxYear !== undefined
        ? byType.filter((q) => q.eq(q.field("taxYear"), args.taxYear))
        : byType;
    const result = await byYear.order("desc").paginate(paginationOptsFromArgs(args));
    return {
      statements: result.page.map(toApi),
      nextCursor: nextCursorOf(result),
      isDone: result.isDone,
    };
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
