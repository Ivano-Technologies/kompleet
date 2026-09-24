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

export const getCalculation = query({
  args: { externalId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("taxCalculations")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) return null;
    return {
      id: row.externalId,
      user_id: row.userExternalId,
      tax_type: row.taxType,
      tax_year: row.taxYear,
      calculation_date: row.calculationDate,
      input_data: row.inputData,
      gross_amount: row.grossAmount,
      deductions: row.deductions,
      taxable_amount: row.taxableAmount,
      tax_due: row.taxDue,
      effective_rate: row.effectiveRate ?? null,
      breakdown: row.breakdown,
      is_final: row.isFinal,
      created_at: new Date(row.createdAt).toISOString(),
      updated_at: new Date(row.updatedAt).toISOString(),
    };
  },
});

export const updateCalculation = mutation({
  args: {
    externalId: v.string(),
    inputData: v.optional(v.any()),
    grossAmount: v.optional(v.number()),
    deductions: v.optional(v.number()),
    taxableAmount: v.optional(v.number()),
    taxDue: v.optional(v.number()),
    effectiveRate: v.optional(v.number()),
    breakdown: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("taxCalculations")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) {
      throw new Error("Calculation not found");
    }
    if (row.isFinal) {
      throw new Error("Cannot update finalized calculations");
    }
    await ctx.db.patch(row._id, {
      inputData: args.inputData ?? row.inputData,
      grossAmount: args.grossAmount ?? row.grossAmount,
      deductions: args.deductions ?? row.deductions,
      taxableAmount: args.taxableAmount ?? row.taxableAmount,
      taxDue: args.taxDue ?? row.taxDue,
      effectiveRate: args.effectiveRate ?? row.effectiveRate,
      breakdown: args.breakdown ?? row.breakdown,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Calculation not found");
    return {
      id: updated.externalId,
      user_id: updated.userExternalId,
      tax_type: updated.taxType,
      tax_year: updated.taxYear,
      calculation_date: updated.calculationDate,
      input_data: updated.inputData,
      gross_amount: updated.grossAmount,
      deductions: updated.deductions,
      taxable_amount: updated.taxableAmount,
      tax_due: updated.taxDue,
      effective_rate: updated.effectiveRate ?? null,
      breakdown: updated.breakdown,
      is_final: updated.isFinal,
      created_at: new Date(updated.createdAt).toISOString(),
      updated_at: new Date(updated.updatedAt).toISOString(),
    };
  },
});

export const deleteCalculation = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("taxCalculations")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) {
      throw new Error("Calculation not found");
    }
    if (row.isFinal) {
      throw new Error("Cannot delete finalized calculations");
    }
    await ctx.db.delete(row._id);
    return null;
  },
});

export const finalizeCalculation = mutation({
  args: { externalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("taxCalculations")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) {
      throw new Error("Calculation not found");
    }
    if (row.isFinal) {
      throw new Error("This calculation is already marked as final");
    }
    const now = Date.now();
    await ctx.db.patch(row._id, { isFinal: true, updatedAt: now });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Calculation not found");
    return {
      id: updated.externalId,
      user_id: updated.userExternalId,
      tax_type: updated.taxType,
      tax_year: updated.taxYear,
      calculation_date: updated.calculationDate,
      input_data: updated.inputData,
      gross_amount: updated.grossAmount,
      deductions: updated.deductions,
      taxable_amount: updated.taxableAmount,
      tax_due: updated.taxDue,
      effective_rate: updated.effectiveRate ?? null,
      breakdown: updated.breakdown,
      is_final: updated.isFinal,
      created_at: new Date(updated.createdAt).toISOString(),
      updated_at: new Date(updated.updatedAt).toISOString(),
    };
  },
});

function reportToApi(row: {
  externalId: string;
  userExternalId: string;
  reportType?: string;
  taxYear?: number;
  computationData: unknown;
  createdAt: number;
  updatedAt: number;
}) {
  const extra =
    row.computationData && typeof row.computationData === "object"
      ? (row.computationData as Record<string, unknown>)
      : {};
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    report_type: row.reportType ?? null,
    tax_year: row.taxYear ?? null,
    computation_data: row.computationData,
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
    ...extra,
  };
}

export const listReports = query({
  args: {
    taxYear: v.optional(v.number()),
    reportType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("taxReports")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows
      .map(reportToApi)
      .filter((r) => {
        if (args.taxYear !== undefined && r.tax_year !== args.taxYear) {
          return false;
        }
        if (args.reportType && r.report_type !== args.reportType) {
          return false;
        }
        if (args.status) {
          const status =
            r.computation_data &&
            typeof r.computation_data === "object" &&
            "status" in r.computation_data
              ? String(
                  (r.computation_data as { status?: unknown }).status ?? "",
                )
              : "";
          if (status !== args.status) return false;
        }
        return true;
      });
  },
});

export const getReport = query({
  args: { externalId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("taxReports")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) return null;
    return reportToApi(row);
  },
});

export const saveReport = mutation({
  args: {
    reportType: v.string(),
    taxYear: v.number(),
    computationData: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    const externalId = newExternalId();
    await ctx.db.insert("taxReports", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      reportType: args.reportType,
      taxYear: args.taxYear,
      computationData: args.computationData,
      createdAt: now,
      updatedAt: now,
    });
    const row = await ctx.db
      .query("taxReports")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("Tax report not found");
    return reportToApi(row);
  },
});

export const updateReport = mutation({
  args: {
    externalId: v.string(),
    patch: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("taxReports")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) throw new Error("Report not found");
    const prev =
      row.computationData && typeof row.computationData === "object"
        ? (row.computationData as Record<string, unknown>)
        : {};
    const patch =
      args.patch && typeof args.patch === "object"
        ? (args.patch as Record<string, unknown>)
        : {};
    const next = { ...prev, ...patch };
    await ctx.db.patch(row._id, {
      computationData: next,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Report not found");
    return reportToApi(updated);
  },
});

export const deleteReport = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("taxReports")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) throw new Error("Report not found");
    await ctx.db.delete(row._id);
    return null;
  },
});

export const touchSources = mutation({
  args: { sourceExternalId: v.optional(v.string()) },
  returns: v.object({
    ok: v.boolean(),
    checked: v.union(v.number(), v.literal("all")),
    sourceId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const now = Date.now();
    if (args.sourceExternalId) {
      const row = await ctx.db
        .query("sources")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.sourceExternalId!),
        )
        .unique();
      if (!row) throw new Error("Source not found");
      await ctx.db.patch(row._id, { updatedAt: now });
      return { ok: true, checked: 1, sourceId: row.externalId };
    }
    const rows = await ctx.db.query("sources").collect();
    for (const row of rows) {
      await ctx.db.patch(row._id, { updatedAt: now });
    }
    return { ok: true, checked: "all" as const };
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
