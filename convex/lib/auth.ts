import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export function supabaseSubject(identity: {
  subject: string;
  tokenIdentifier: string;
}): string {
  const slash = identity.subject.includes("/")
    ? identity.subject.split("/").pop()
    : identity.subject;
  return slash ?? identity.subject;
}

function identityEmail(identity: { email?: string | null }): string | null {
  return typeof identity.email === "string" && identity.email.length > 0
    ? identity.email.trim().toLowerCase()
    : null;
}

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const authUserId = await getAuthUserId(ctx);
  if (authUserId) {
    const byAuthId = await ctx.db.get(authUserId);
    if (byAuthId && !byAuthId.deletedAt) {
      return byAuthId;
    }
  }

  const byToken = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (byToken && !byToken.deletedAt) {
    return byToken;
  }

  const email = identityEmail(identity);
  if (email) {
    const byEmail = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (byEmail && !byEmail.deletedAt) {
      return byEmail;
    }
  }

  const externalId = supabaseSubject(identity);
  const byExternal = await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
    .unique();
  if (byExternal && !byExternal.deletedAt) {
    return byExternal;
  }

  throw new Error("User not found");
}

export async function getUserByExternalId(
  ctx: QueryCtx | MutationCtx,
  externalId: string,
): Promise<Doc<"users"> | null> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
    .unique();
  if (!user || user.deletedAt) {
    return null;
  }
  return user;
}

export async function getCurrentUserOrNull(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  try {
    return await getCurrentUser(ctx);
  } catch {
    return null;
  }
}

export async function requireOwnedUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"users">> {
  const me = await getCurrentUser(ctx);
  if (me._id !== userId) {
    throw new Error("Unauthorized");
  }
  return me;
}

export async function userCanAccessClient(
  ctx: QueryCtx | MutationCtx,
  clientId: Id<"clients">,
): Promise<boolean> {
  const me = await getCurrentUser(ctx);
  const client = await ctx.db.get(clientId);
  if (!client || client.archivedAt) {
    return false;
  }
  const membership = await ctx.db
    .query("firmMembers")
    .withIndex("by_firm_and_user", (q) =>
      q.eq("firmId", client.firmId).eq("userId", me._id),
    )
    .unique();
  return membership !== null;
}
