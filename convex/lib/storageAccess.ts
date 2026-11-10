import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isPlatformAdmin } from "./auth";
import { throwForbidden } from "./errors";

/**
 * True when the caller may read a Convex storage URL for this id:
 * platform admin, or a row they own that points at the blob.
 */
export async function userCanAccessStorageId(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
  storageId: Id<"_storage">,
): Promise<boolean> {
  if (isPlatformAdmin(user)) return true;
  if (user.avatarStorageId === storageId) return true;

  const profile = await ctx.db
    .query("businessProfiles")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .unique();
  if (profile?.logoStorageId === storageId) return true;

  const uploaded = await ctx.db
    .query("uploadedFiles")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first();
  if (uploaded) return uploaded.userId === user._id;

  const expense = await ctx.db
    .query("expenses")
    .withIndex("by_receiptStorageId", (q) =>
      q.eq("receiptStorageId", storageId),
    )
    .first();
  if (expense) return expense.userId === user._id;

  const document = await ctx.db
    .query("documents")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first();
  if (document) return document.userId === user._id;

  const importSession = await ctx.db
    .query("importSessions")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first();
  if (importSession) return importSession.userId === user._id;

  const exportRow = await ctx.db
    .query("exportHistory")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first();
  if (exportRow) return exportRow.userId === user._id;

  const logoHolder = await ctx.db
    .query("businessProfiles")
    .withIndex("by_logoStorageId", (q) => q.eq("logoStorageId", storageId))
    .first();
  if (logoHolder) return logoHolder.userId === user._id;

  const avatarHolder = await ctx.db
    .query("users")
    .withIndex("by_avatarStorageId", (q) => q.eq("avatarStorageId", storageId))
    .first();
  if (avatarHolder) return avatarHolder._id === user._id;

  return false;
}

/**
 * Block attaching another tenant's blob to the caller's row.
 * Unreferenced ids (in-progress uploads) are allowed.
 */
export async function assertStorageAssignableToUser(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
  storageId: Id<"_storage"> | undefined,
): Promise<void> {
  if (!storageId) return;
  if (isPlatformAdmin(user)) return;
  if (user.avatarStorageId === storageId) return;

  const uploaded = await ctx.db
    .query("uploadedFiles")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first();
  if (uploaded && uploaded.userId !== user._id) throwForbidden();

  const expense = await ctx.db
    .query("expenses")
    .withIndex("by_receiptStorageId", (q) =>
      q.eq("receiptStorageId", storageId),
    )
    .first();
  if (expense && expense.userId !== user._id) throwForbidden();

  const document = await ctx.db
    .query("documents")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first();
  if (document && document.userId !== user._id) throwForbidden();

  const importSession = await ctx.db
    .query("importSessions")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first();
  if (importSession && importSession.userId !== user._id) throwForbidden();

  const exportRow = await ctx.db
    .query("exportHistory")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first();
  if (exportRow && exportRow.userId !== user._id) throwForbidden();

  const logoHolders = await ctx.db
    .query("businessProfiles")
    .withIndex("by_logoStorageId", (q) => q.eq("logoStorageId", storageId))
    .collect();
  if (logoHolders.some((row) => row.userId !== user._id)) throwForbidden();

  const avatarHolder = await ctx.db
    .query("users")
    .withIndex("by_avatarStorageId", (q) => q.eq("avatarStorageId", storageId))
    .first();
  if (avatarHolder && avatarHolder._id !== user._id) throwForbidden();
}
