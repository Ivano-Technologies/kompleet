import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId, toMs } from "./lib/ids";

export const listRuleVersions = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      is_active: v.boolean(),
      created_at: v.string(),
    }),
  ),
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const rows = await ctx.db.query("ruleVersions").collect();
    return rows.map((r) => ({
      id: r.externalId,
      is_active: r.isActive,
      created_at: new Date(r.createdAt).toISOString(),
    }));
  },
});

export const listRulesForVersion = query({
  args: {
    versionExternalId: v.string(),
    ruleTypes: v.optional(v.array(v.string())),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const version = await ctx.db
      .query("ruleVersions")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.versionExternalId),
      )
      .unique();
    if (!version) return [];
    let rows = await ctx.db
      .query("taxRules")
      .withIndex("by_version", (q) => q.eq("ruleVersionId", version._id))
      .collect();
    if (args.ruleTypes && args.ruleTypes.length > 0) {
      const allow = new Set(args.ruleTypes);
      rows = rows.filter((r) => allow.has(r.ruleType));
    }
    return rows.map((r) => ({
      id: r.externalId,
      rule_version_id: r.ruleVersionExternalId,
      source_id: r.sourceExternalId ?? null,
      rule_type: r.ruleType,
      rule_key: r.ruleKey,
      rule_value: r.ruleValue,
      confidence_level: r.confidenceLevel,
      last_reviewed_at: r.lastReviewedAt
        ? new Date(r.lastReviewedAt).toISOString()
        : null,
      notes: r.notes ?? null,
    }));
  },
});

export const loadRuleBundle = query({
  args: { ruleTypes: v.optional(v.array(v.string())) },
  returns: v.object({
    activeVersionId: v.union(v.string(), v.null()),
    unverifiedVersionId: v.union(v.string(), v.null()),
    rules: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const versions = await ctx.db.query("ruleVersions").collect();
    const active = versions.find((r) => r.isActive) ?? null;
    const unverified = versions
      .filter((r) => !r.isActive)
      .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

    const pick = async (versionId: typeof active) => {
      if (!versionId) return [];
      let rows = await ctx.db
        .query("taxRules")
        .withIndex("by_version", (q) => q.eq("ruleVersionId", versionId._id))
        .collect();
      if (args.ruleTypes && args.ruleTypes.length > 0) {
        const allow = new Set(args.ruleTypes);
        rows = rows.filter((r) => allow.has(r.ruleType));
      }
      return rows;
    };

    const activeRows = await pick(active);
    const unverifiedRows = await pick(unverified);
    const seen = new Set(
      activeRows.map((r) => `${r.ruleType}.${r.ruleKey}`),
    );
    const merged = [...activeRows];
    for (const row of unverifiedRows) {
      const key = `${row.ruleType}.${row.ruleKey}`;
      if (!seen.has(key)) {
        merged.push(row);
        seen.add(key);
      }
    }
    return {
      activeVersionId: active?.externalId ?? null,
      unverifiedVersionId: unverified?.externalId ?? null,
      rules: merged.map((r) => ({
        id: r.externalId,
        rule_version_id: r.ruleVersionExternalId,
        source_id: r.sourceExternalId ?? null,
        rule_type: r.ruleType,
        rule_key: r.ruleKey,
        rule_value: r.ruleValue,
        confidence_level: r.confidenceLevel,
        last_reviewed_at: r.lastReviewedAt
          ? new Date(r.lastReviewedAt).toISOString()
          : null,
        notes: r.notes ?? null,
      })),
    };
  },
});

export const listSources = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const rows = await ctx.db.query("sources").collect();
    return rows.map((r) => ({
      id: r.externalId,
      name: r.name,
      url: r.url ?? null,
    }));
  },
});

export const listCalculations = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("taxCalculations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rows.map((r) => ({
      id: r.externalId,
      user_id: r.userExternalId,
      tax_type: r.taxType,
      tax_year: r.taxYear,
      calculation_date: r.calculationDate,
      input_data: r.inputData,
      gross_amount: r.grossAmount,
      deductions: r.deductions,
      taxable_amount: r.taxableAmount,
      tax_due: r.taxDue,
      effective_rate: r.effectiveRate ?? null,
      breakdown: r.breakdown,
      is_final: r.isFinal,
      created_at: new Date(r.createdAt).toISOString(),
    }));
  },
});

export const saveCalculation = mutation({
  args: {
    taxType: v.string(),
    taxYear: v.number(),
    calculationDate: v.optional(v.string()),
    inputData: v.any(),
    grossAmount: v.number(),
    deductions: v.optional(v.number()),
    taxableAmount: v.number(),
    taxDue: v.number(),
    effectiveRate: v.optional(v.number()),
    breakdown: v.any(),
    isFinal: v.optional(v.boolean()),
    externalId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    const externalId = args.externalId ?? newExternalId();
    const existing = args.externalId
      ? await ctx.db
          .query("taxCalculations")
          .withIndex("by_externalId", (q) =>
            q.eq("externalId", args.externalId!),
          )
          .unique()
      : null;
    const fields = {
      userId: user._id,
      userExternalId: user.externalId,
      taxType: args.taxType,
      taxYear: args.taxYear,
      calculationDate:
        args.calculationDate ?? new Date().toISOString().slice(0, 10),
      inputData: args.inputData,
      grossAmount: args.grossAmount,
      deductions: args.deductions ?? 0,
      taxableAmount: args.taxableAmount,
      taxDue: args.taxDue,
      effectiveRate: args.effectiveRate,
      breakdown: args.breakdown,
      isFinal: args.isFinal ?? false,
      updatedAt: now,
    };
    if (existing && existing.userId === user._id) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("taxCalculations", {
        externalId,
        createdAt: now,
        ...fields,
      });
    }
    const row = await ctx.db
      .query("taxCalculations")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    return {
      id: row?.externalId,
      user_id: user.externalId,
      tax_type: args.taxType,
      tax_year: args.taxYear,
      tax_due: args.taxDue,
      is_final: args.isFinal ?? false,
    };
  },
});

export const upsertSourceFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    name: v.string(),
    url: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sources")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        url: args.url,
        updatedAt: now,
      });
      return existing.externalId;
    }
    await ctx.db.insert("sources", {
      externalId: args.externalId,
      name: args.name,
      url: args.url,
      createdAt: toMs(args.createdAt) ?? now,
      updatedAt: now,
    });
    return args.externalId;
  },
});

export const upsertRuleVersionFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    version: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ruleVersions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        version: args.version,
        isActive: args.isActive,
        updatedAt: now,
      });
      return existing.externalId;
    }
    await ctx.db.insert("ruleVersions", {
      externalId: args.externalId,
      version: args.version,
      isActive: args.isActive,
      createdAt: toMs(args.createdAt) ?? now,
      updatedAt: now,
    });
    return args.externalId;
  },
});

export const upsertTaxRuleFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    ruleVersionExternalId: v.string(),
    sourceExternalId: v.optional(v.string()),
    ruleType: v.string(),
    ruleKey: v.string(),
    ruleValue: v.any(),
    confidenceLevel: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const version = await ctx.db
      .query("ruleVersions")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.ruleVersionExternalId),
      )
      .unique();
    if (!version) throw new Error("Rule version not found");
    let sourceId;
    if (args.sourceExternalId) {
      const source = await ctx.db
        .query("sources")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.sourceExternalId!),
        )
        .unique();
      sourceId = source?._id;
    }
    const existing = await ctx.db
      .query("taxRules")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const fields = {
      ruleVersionId: version._id,
      ruleVersionExternalId: version.externalId,
      sourceId,
      sourceExternalId: args.sourceExternalId,
      ruleType: args.ruleType,
      ruleKey: args.ruleKey,
      ruleValue: args.ruleValue,
      confidenceLevel: args.confidenceLevel,
      notes: args.notes,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing.externalId;
    }
    await ctx.db.insert("taxRules", {
      externalId: args.externalId,
      ...fields,
    });
    return args.externalId;
  },
});
