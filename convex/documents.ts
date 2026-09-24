import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getCurrentUser, getUserByExternalId } from "./lib/auth";
import { newExternalId, toMs } from "./lib/ids";
import { assertDocumentWorkerToken } from "./lib/workerAuth";

const documentApi = v.object({
  id: v.string(),
  user_id: v.string(),
  status: v.string(),
  document_type: v.union(v.string(), v.null()),
  file_url: v.union(v.string(), v.null()),
  file_name: v.union(v.string(), v.null()),
  content_type: v.union(v.string(), v.null()),
  idempotency_key: v.union(v.string(), v.null()),
  confidence_score: v.union(v.number(), v.null()),
  structured_data: v.union(v.any(), v.null()),
  error_message: v.union(v.string(), v.null()),
  processing_attempt_count: v.number(),
  created_at: v.string(),
  updated_at: v.string(),
});

const staleDocumentApi = v.object({
  documentId: v.string(),
  userId: v.string(),
  idempotencyKey: v.string(),
  processingStartedAt: v.union(v.number(), v.null()),
});

type DocumentPayload = {
  documentType?: string;
  fileUrl?: string;
  confidenceScore?: number | null;
  structuredData?: Record<string, unknown> | null;
  errorMessage?: string | null;
};

function readPayload(payload: unknown): DocumentPayload {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  return payload as DocumentPayload;
}

function mergePayload(
  existing: unknown,
  patch: DocumentPayload,
): DocumentPayload {
  const current = readPayload(existing);
  const next: DocumentPayload = { ...current };
  if (patch.documentType !== undefined) next.documentType = patch.documentType;
  if (patch.fileUrl !== undefined) next.fileUrl = patch.fileUrl;
  if (patch.confidenceScore !== undefined) {
    next.confidenceScore = patch.confidenceScore;
  }
  if (patch.structuredData !== undefined) {
    next.structuredData = patch.structuredData;
  }
  if (patch.errorMessage !== undefined) next.errorMessage = patch.errorMessage;
  return next;
}

function payloadFromArgs(args: {
  documentType?: string;
  fileUrl?: string;
  payload?: unknown;
}): DocumentPayload {
  const fromPayload = readPayload(args.payload);
  return {
    documentType: args.documentType ?? fromPayload.documentType,
    fileUrl: args.fileUrl ?? fromPayload.fileUrl,
    confidenceScore: fromPayload.confidenceScore ?? null,
    structuredData: fromPayload.structuredData ?? null,
    errorMessage: fromPayload.errorMessage ?? null,
  };
}

function toApi(row: Doc<"documents">) {
  const payload = readPayload(row.payload);
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    status: row.status,
    document_type: payload.documentType ?? null,
    file_url: payload.fileUrl ?? null,
    file_name: row.fileName ?? null,
    content_type: row.contentType ?? null,
    idempotency_key: row.idempotencyKey ?? null,
    confidence_score: payload.confidenceScore ?? null,
    structured_data: payload.structuredData ?? null,
    error_message: payload.errorMessage ?? null,
    processing_attempt_count: row.processingAttemptCount,
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
  };
}

async function getByExternalId(
  ctx: QueryCtx | MutationCtx,
  externalId: string,
): Promise<Doc<"documents"> | null> {
  return await ctx.db
    .query("documents")
    .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
    .unique();
}

async function getByUserAndIdempotency(
  ctx: QueryCtx | MutationCtx,
  userId: Doc<"users">["_id"],
  idempotencyKey: string,
): Promise<Doc<"documents"> | null> {
  return await ctx.db
    .query("documents")
    .withIndex("by_user_and_idempotencyKey", (q) =>
      q.eq("userId", userId).eq("idempotencyKey", idempotencyKey),
    )
    .unique();
}

export const getMine = query({
  args: { externalId: v.string() },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userId !== user._id) return null;
    return toApi(row);
  },
});

export const getMineByIdempotencyKey = query({
  args: { idempotencyKey: v.string() },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await getByUserAndIdempotency(ctx, user._id, args.idempotencyKey);
    return row ? toApi(row) : null;
  },
});

export const createMine = mutation({
  args: {
    externalId: v.optional(v.string()),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    status: v.optional(v.string()),
    documentType: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    payload: v.optional(v.any()),
    storageId: v.optional(v.id("_storage")),
  },
  returns: documentApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (args.idempotencyKey) {
      const existing = await getByUserAndIdempotency(
        ctx,
        user._id,
        args.idempotencyKey,
      );
      if (existing) return toApi(existing);
    }
    if (args.externalId) {
      const existing = await getByExternalId(ctx, args.externalId);
      if (existing && existing.userId === user._id) return toApi(existing);
    }
    const now = Date.now();
    const externalId = args.externalId ?? newExternalId();
    await ctx.db.insert("documents", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      idempotencyKey: args.idempotencyKey,
      status: args.status ?? "queued",
      fileName: args.fileName,
      contentType: args.contentType,
      storageId: args.storageId,
      processingAttemptCount: 0,
      payload: payloadFromArgs(args),
      createdAt: now,
      updatedAt: now,
    });
    const row = await getByExternalId(ctx, externalId);
    if (!row) throw new Error("Document not found");
    return toApi(row);
  },
});

export const updateMineStatus = mutation({
  args: {
    externalId: v.string(),
    status: v.string(),
    confidenceScore: v.optional(v.union(v.number(), v.null())),
    structuredData: v.optional(v.union(v.any(), v.null())),
    errorMessage: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userId !== user._id) return null;
    await ctx.db.patch(row._id, {
      status: args.status,
      payload: mergePayload(row.payload, {
        confidenceScore: args.confidenceScore,
        structuredData: args.structuredData,
        errorMessage: args.errorMessage,
      }),
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(row._id);
    return updated ? toApi(updated) : null;
  },
});

export const workerGetByExternalId = query({
  args: {
    workerToken: v.string(),
    externalId: v.string(),
    userExternalId: v.string(),
  },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    return toApi(row);
  },
});

export const workerGetByIdempotencyKey = query({
  args: {
    workerToken: v.string(),
    idempotencyKey: v.string(),
    userExternalId: v.string(),
  },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const user = await getUserByExternalId(ctx, args.userExternalId);
    if (!user) return null;
    const row = await getByUserAndIdempotency(ctx, user._id, args.idempotencyKey);
    return row ? toApi(row) : null;
  },
});

export const workerUpdateStatus = mutation({
  args: {
    workerToken: v.string(),
    externalId: v.string(),
    userExternalId: v.string(),
    status: v.string(),
    confidenceScore: v.optional(v.union(v.number(), v.null())),
    structuredData: v.optional(v.union(v.any(), v.null())),
    errorMessage: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    await ctx.db.patch(row._id, {
      status: args.status,
      payload: mergePayload(row.payload, {
        confidenceScore: args.confidenceScore,
        structuredData: args.structuredData,
        errorMessage: args.errorMessage,
      }),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const workerClaimQueued = mutation({
  args: {
    workerToken: v.string(),
    externalId: v.string(),
    userExternalId: v.string(),
    maxProcessingAttempts: v.optional(v.number()),
  },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    if (row.status !== "queued") return null;

    const maxAttempts = args.maxProcessingAttempts ?? 3;
    const nextAttemptCount = row.processingAttemptCount + 1;
    const now = Date.now();

    if (nextAttemptCount > maxAttempts) {
      await ctx.db.patch(row._id, {
        status: "failed",
        processingAttemptCount: nextAttemptCount,
        payload: mergePayload(row.payload, {
          errorMessage: "max_processing_attempts_exceeded",
        }),
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.patch(row._id, {
      status: "processing",
      processingStartedAt: now,
      processingAttemptCount: nextAttemptCount,
      updatedAt: now,
    });
    const claimed = await ctx.db.get(row._id);
    return claimed ? toApi(claimed) : null;
  },
});

export const workerCompleteProcessing = mutation({
  args: {
    workerToken: v.string(),
    externalId: v.string(),
    userExternalId: v.string(),
    structuredData: v.any(),
    confidenceScore: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    if (row.status !== "processing") return null;
    const now = Date.now();
    await ctx.db.patch(row._id, {
      status: "validated",
      payload: mergePayload(row.payload, {
        structuredData: args.structuredData,
        confidenceScore: args.confidenceScore,
        errorMessage: null,
      }),
      updatedAt: now,
    });
    await ctx.db.patch(row._id, {
      status: "completed",
      updatedAt: now,
    });
    return null;
  },
});

export const workerFailProcessing = mutation({
  args: {
    workerToken: v.string(),
    externalId: v.string(),
    userExternalId: v.string(),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    if (row.status !== "processing") return null;
    await ctx.db.patch(row._id, {
      status: "failed",
      payload: mergePayload(row.payload, { errorMessage: args.errorMessage }),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const workerMarkNeedsReview = mutation({
  args: {
    workerToken: v.string(),
    externalId: v.string(),
    userExternalId: v.string(),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    if (row.status !== "processing") return null;
    await ctx.db.patch(row._id, {
      status: "needs_review",
      payload: mergePayload(row.payload, { errorMessage: args.reason }),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const workerFindStaleProcessing = query({
  args: {
    workerToken: v.string(),
    olderThanMinutes: v.number(),
    limit: v.number(),
    now: v.number(),
  },
  returns: v.array(staleDocumentApi),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const threshold = args.now - args.olderThanMinutes * 60 * 1000;
    const rows = await ctx.db
      .query("documents")
      .withIndex("by_status_and_processingStartedAt", (q) =>
        q.eq("status", "processing").lt("processingStartedAt", threshold),
      )
      .take(args.limit);
    return rows.map((row) => ({
      documentId: row.externalId,
      userId: row.userExternalId,
      idempotencyKey: row.idempotencyKey ?? "",
      processingStartedAt: row.processingStartedAt ?? null,
    }));
  },
});

export const workerRequeueStale = mutation({
  args: {
    workerToken: v.string(),
    externalId: v.string(),
    userExternalId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return false;
    if (row.status !== "processing") return false;
    await ctx.db.patch(row._id, {
      status: "queued",
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const getByExternalIdInternal = internalQuery({
  args: { externalId: v.string(), userExternalId: v.string() },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    return toApi(row);
  },
});

export const getByIdempotencyKeyInternal = internalQuery({
  args: { idempotencyKey: v.string(), userExternalId: v.string() },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getUserByExternalId(ctx, args.userExternalId);
    if (!user) return null;
    const row = await getByUserAndIdempotency(ctx, user._id, args.idempotencyKey);
    return row ? toApi(row) : null;
  },
});

export const updateStatusInternal = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.string(),
    status: v.string(),
    confidenceScore: v.optional(v.union(v.number(), v.null())),
    structuredData: v.optional(v.union(v.any(), v.null())),
    errorMessage: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    await ctx.db.patch(row._id, {
      status: args.status,
      payload: mergePayload(row.payload, {
        confidenceScore: args.confidenceScore,
        structuredData: args.structuredData,
        errorMessage: args.errorMessage,
      }),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const claimQueuedInternal = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.string(),
    maxProcessingAttempts: v.optional(v.number()),
  },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    if (row.status !== "queued") return null;

    const maxAttempts = args.maxProcessingAttempts ?? 3;
    const nextAttemptCount = row.processingAttemptCount + 1;
    const now = Date.now();

    if (nextAttemptCount > maxAttempts) {
      await ctx.db.patch(row._id, {
        status: "failed",
        processingAttemptCount: nextAttemptCount,
        payload: mergePayload(row.payload, {
          errorMessage: "max_processing_attempts_exceeded",
        }),
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.patch(row._id, {
      status: "processing",
      processingStartedAt: now,
      processingAttemptCount: nextAttemptCount,
      updatedAt: now,
    });
    const claimed = await ctx.db.get(row._id);
    return claimed ? toApi(claimed) : null;
  },
});

export const completeProcessingInternal = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.string(),
    structuredData: v.any(),
    confidenceScore: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    if (row.status !== "processing") return null;
    const now = Date.now();
    await ctx.db.patch(row._id, {
      status: "validated",
      payload: mergePayload(row.payload, {
        structuredData: args.structuredData,
        confidenceScore: args.confidenceScore,
        errorMessage: null,
      }),
      updatedAt: now,
    });
    await ctx.db.patch(row._id, {
      status: "completed",
      updatedAt: now,
    });
    return null;
  },
});

export const failProcessingInternal = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.string(),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    if (row.status !== "processing") return null;
    await ctx.db.patch(row._id, {
      status: "failed",
      payload: mergePayload(row.payload, { errorMessage: args.errorMessage }),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const markNeedsReviewInternal = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.string(),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return null;
    if (row.status !== "processing") return null;
    await ctx.db.patch(row._id, {
      status: "needs_review",
      payload: mergePayload(row.payload, { errorMessage: args.reason }),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const findStaleProcessingInternal = internalQuery({
  args: {
    olderThanMinutes: v.number(),
    limit: v.number(),
    now: v.number(),
  },
  returns: v.array(staleDocumentApi),
  handler: async (ctx, args) => {
    const threshold = args.now - args.olderThanMinutes * 60 * 1000;
    const rows = await ctx.db
      .query("documents")
      .withIndex("by_status_and_processingStartedAt", (q) =>
        q.eq("status", "processing").lt("processingStartedAt", threshold),
      )
      .take(args.limit);
    return rows.map((row) => ({
      documentId: row.externalId,
      userId: row.userExternalId,
      idempotencyKey: row.idempotencyKey ?? "",
      processingStartedAt: row.processingStartedAt ?? null,
    }));
  },
});

export const requeueStaleInternal = internalMutation({
  args: { externalId: v.string(), userExternalId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const row = await getByExternalId(ctx, args.externalId);
    if (!row || row.userExternalId !== args.userExternalId) return false;
    if (row.status !== "processing") return false;
    await ctx.db.patch(row._id, {
      status: "queued",
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const patchInternal = internalMutation({
  args: {
    externalId: v.string(),
    status: v.optional(v.string()),
    processingStartedAt: v.optional(v.number()),
    processingAttemptCount: v.optional(v.number()),
    payload: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await getByExternalId(ctx, args.externalId);
    if (!row) throw new Error("Document not found");
    await ctx.db.patch(row._id, {
      status: args.status ?? row.status,
      processingStartedAt: args.processingStartedAt ?? row.processingStartedAt,
      processingAttemptCount:
        args.processingAttemptCount ?? row.processingAttemptCount,
      payload: args.payload ?? row.payload,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const upsertFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.string(),
    status: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    documentType: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    confidenceScore: v.optional(v.union(v.number(), v.null())),
    structuredData: v.optional(v.union(v.any(), v.null())),
    errorMessage: v.optional(v.union(v.string(), v.null())),
    processingStartedAt: v.optional(v.union(v.string(), v.number(), v.null())),
    processingAttemptCount: v.optional(v.number()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await getUserByExternalId(ctx, args.userExternalId);
    if (!user) {
      throw new Error(
        `User ${args.userExternalId} not found; backfill users first`,
      );
    }
    const existing = await getByExternalId(ctx, args.externalId);
    const now = Date.now();
    const fields = {
      userId: user._id,
      userExternalId: user.externalId,
      status: args.status ?? existing?.status ?? "queued",
      idempotencyKey: args.idempotencyKey ?? existing?.idempotencyKey,
      fileName: args.fileName ?? existing?.fileName,
      contentType: args.contentType ?? existing?.contentType,
      processingStartedAt:
        toMs(args.processingStartedAt) ?? existing?.processingStartedAt,
      processingAttemptCount:
        args.processingAttemptCount ?? existing?.processingAttemptCount ?? 0,
      payload: mergePayload(existing?.payload, {
        documentType: args.documentType,
        fileUrl: args.fileUrl,
        confidenceScore: args.confidenceScore,
        structuredData: args.structuredData,
        errorMessage: args.errorMessage,
      }),
      createdAt: toMs(args.createdAt) ?? existing?.createdAt ?? now,
      updatedAt: toMs(args.updatedAt) ?? now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing.externalId;
    }
    await ctx.db.insert("documents", {
      externalId: args.externalId,
      ...fields,
    });
    return args.externalId;
  },
});
