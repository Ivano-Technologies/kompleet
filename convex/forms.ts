import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId } from "./lib/ids";

const formApi = v.object({
  id: v.string(),
  user_id: v.string(),
  form_type: v.string(),
  tax_year: v.union(v.number(), v.null()),
  form_data: v.any(),
  pdf_url: v.union(v.string(), v.null()),
  status: v.string(),
  filed_at: v.union(v.string(), v.null()),
  created_at: v.string(),
  filing_status: v.array(
    v.object({
      status: v.string(),
      filed_date: v.union(v.string(), v.null()),
      confirmation_number: v.union(v.string(), v.null()),
    }),
  ),
});

type FormPayload = {
  form_data?: unknown;
  pdf_url?: string | null;
  status?: string;
  filed_at?: string | null;
  confirmation_number?: string | null;
  notes?: string | null;
};

function readPayload(payload: unknown): FormPayload {
  if (payload && typeof payload === "object") {
    return payload as FormPayload;
  }
  return {};
}

export const listMine = query({
  args: {
    formType: v.optional(v.string()),
    taxYear: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  returns: v.array(formApi),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("nrsForms")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const out = [];
    for (const row of rows) {
      const payload = readPayload(row.payload);
      const status = payload.status ?? "generated";
      if (args.formType && row.formType !== args.formType) continue;
      if (args.taxYear !== undefined && row.taxYear !== args.taxYear) continue;
      if (args.status && status !== args.status) continue;
      const statuses = await ctx.db
        .query("formFilingStatuses")
        .withIndex("by_form", (q) => q.eq("formId", row._id))
        .collect();
      out.push({
        id: row.externalId,
        user_id: row.userExternalId,
        form_type: row.formType,
        tax_year: row.taxYear ?? null,
        form_data: payload.form_data ?? payload,
        pdf_url: payload.pdf_url ?? null,
        status,
        filed_at: payload.filed_at ?? null,
        created_at: new Date(row.createdAt).toISOString(),
        filing_status: statuses.map((s) => ({
          status: s.status,
          filed_date: s.filedAt ? new Date(s.filedAt).toISOString() : null,
          confirmation_number: payload.confirmation_number ?? null,
        })),
      });
    }
    return out;
  },
});

export const getMine = query({
  args: { externalId: v.string() },
  returns: v.union(formApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("nrsForms")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) return null;
    const payload = readPayload(row.payload);
    const statuses = await ctx.db
      .query("formFilingStatuses")
      .withIndex("by_form", (q) => q.eq("formId", row._id))
      .collect();
    return {
      id: row.externalId,
      user_id: row.userExternalId,
      form_type: row.formType,
      tax_year: row.taxYear ?? null,
      form_data: payload.form_data ?? payload,
      pdf_url: payload.pdf_url ?? null,
      status: payload.status ?? "generated",
      filed_at: payload.filed_at ?? null,
      created_at: new Date(row.createdAt).toISOString(),
      filing_status: statuses.map((s) => ({
        status: s.status,
        filed_date: s.filedAt ? new Date(s.filedAt).toISOString() : null,
        confirmation_number: payload.confirmation_number ?? null,
      })),
    };
  },
});

export const createMine = mutation({
  args: {
    formType: v.string(),
    taxYear: v.optional(v.number()),
    formData: v.any(),
    pdfUrl: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: formApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    const externalId = newExternalId();
    const payload: FormPayload = {
      form_data: args.formData,
      pdf_url: args.pdfUrl ?? null,
      status: args.status ?? "generated",
      filed_at: null,
    };
    await ctx.db.insert("nrsForms", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      formType: args.formType,
      taxYear: args.taxYear,
      payload,
      createdAt: now,
    });
    await ctx.db.insert("filingAuditLogs", {
      userId: user._id,
      action: "FORM_GENERATED",
      details: {
        form_id: externalId,
        form_type: args.formType,
        tax_year: args.taxYear,
        timestamp: new Date(now).toISOString(),
      },
      createdAt: now,
    });
    const row = await ctx.db
      .query("nrsForms")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("Form not found");
    return {
      id: row.externalId,
      user_id: row.userExternalId,
      form_type: row.formType,
      tax_year: row.taxYear ?? null,
      form_data: payload.form_data ?? null,
      pdf_url: payload.pdf_url ?? null,
      status: payload.status ?? "generated",
      filed_at: null,
      created_at: new Date(row.createdAt).toISOString(),
      filing_status: [],
    };
  },
});

export const appendDownloadAudit = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("nrsForms")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) throw new Error("Form not found");
    await ctx.db.insert("filingAuditLogs", {
      formId: row._id,
      userId: user._id,
      action: "FORM_DOWNLOADED",
      details: {
        form_type: row.formType,
        tax_year: row.taxYear,
        timestamp: new Date().toISOString(),
      },
      createdAt: Date.now(),
    });
    return null;
  },
});

export const markFiled = mutation({
  args: {
    externalId: v.string(),
    confirmationNumber: v.string(),
    filedAt: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    id: v.string(),
    status: v.string(),
    filedDate: v.union(v.string(), v.null()),
    confirmationNumber: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("nrsForms")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) throw new Error("Form not found");
    const existing = await ctx.db
      .query("formFilingStatuses")
      .withIndex("by_form", (q) => q.eq("formId", row._id))
      .collect();
    if (existing.some((s) => s.status === "filed")) {
      throw new Error("Form is already marked as filed");
    }
    const now = Date.now();
    const filedAt = args.filedAt ? Date.parse(args.filedAt) : now;
    const payload = {
      ...readPayload(row.payload),
      status: "filed",
      filed_at: new Date(Number.isFinite(filedAt) ? filedAt : now).toISOString(),
      confirmation_number: args.confirmationNumber,
      notes: args.notes ?? null,
    };
    await ctx.db.patch(row._id, { payload });
    await ctx.db.insert("formFilingStatuses", {
      formId: row._id,
      userId: user._id,
      status: "filed",
      filedAt: Number.isFinite(filedAt) ? filedAt : now,
      createdAt: now,
    });
    await ctx.db.insert("filingAuditLogs", {
      formId: row._id,
      userId: user._id,
      action: "FORM_FILED",
      details: {
        form_type: row.formType,
        tax_year: row.taxYear,
        confirmation_number: args.confirmationNumber,
        filed_date: payload.filed_at,
        notes: args.notes ?? null,
        timestamp: new Date(now).toISOString(),
      },
      createdAt: now,
    });
    return {
      id: row.externalId,
      status: "filed",
      filedDate: payload.filed_at ?? null,
      confirmationNumber: args.confirmationNumber,
    };
  },
});

export const listFilingStatuses = query({
  args: { externalId: v.string() },
  returns: v.array(
    v.object({
      id: v.string(),
      status: v.string(),
      filed_date: v.union(v.string(), v.null()),
      confirmation_number: v.union(v.string(), v.null()),
      notes: v.union(v.string(), v.null()),
      created_at: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("nrsForms")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) return [];
    const payload = readPayload(row.payload);
    const statuses = await ctx.db
      .query("formFilingStatuses")
      .withIndex("by_form", (q) => q.eq("formId", row._id))
      .collect();
    statuses.sort((a, b) => b.createdAt - a.createdAt);
    return statuses.map((s) => ({
      id: String(s._id),
      status: s.status,
      filed_date: s.filedAt ? new Date(s.filedAt).toISOString() : null,
      confirmation_number: payload.confirmation_number ?? null,
      notes: payload.notes ?? null,
      created_at: new Date(s.createdAt).toISOString(),
    }));
  },
});
