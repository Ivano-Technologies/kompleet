import type { Id } from "../_generated/dataModel";
import { newExternalId } from "./ids";

export type AuthUserType =
  | "oauth"
  | "credentials"
  | "email"
  | "phone"
  | "verification";

export function profileEmailIsVerified(
  type: AuthUserType,
  emailVerified?: boolean,
): boolean {
  switch (type) {
    case "verification":
      return emailVerified !== false;
    case "oauth":
    case "credentials":
    case "email":
    case "phone":
      return emailVerified === true;
    default: {
      const _never: never = type;
      return _never;
    }
  }
}

export function normalizeAuthEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export type AuthUserDoc = {
  _id: Id<"users">;
  deletedAt?: number;
  email: string;
  name?: string;
  fullName?: string;
  companyName?: string;
  supabaseUserId?: string;
  externalId: string;
  emailVerificationTime?: number;
};

export type CreateOrUpdateUserArgs = {
  existingUserId: Id<"users"> | null;
  type: AuthUserType;
  profile: Record<string, unknown> & {
    email?: string;
    emailVerified?: boolean;
    name?: unknown;
    companyName?: unknown;
  };
};

export type CreateOrUpdateUserCtx = {
  db: {
    get: (id: Id<"users">) => Promise<AuthUserDoc | null>;
    patch: (id: Id<"users">, value: Record<string, unknown>) => Promise<void>;
    insert: (
      table: "users",
      value: Record<string, unknown>,
    ) => Promise<Id<"users">>;
    query: (table: "users") => {
      withIndex: (
        name: "email",
        fn: (q: { eq: (field: "email", value: string) => unknown }) => unknown,
      ) => { unique: () => Promise<AuthUserDoc | null> };
    };
  };
};

async function findUserByEmail(
  ctx: CreateOrUpdateUserCtx,
  email: string,
): Promise<AuthUserDoc | null> {
  if (!email) return null;
  return await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
}

function displayName(
  profileName: string,
  existing?: AuthUserDoc | null,
): string | undefined {
  if (profileName) return profileName;
  return existing?.name ?? existing?.fullName;
}

/** Prefer a longer stored name (first + last) over a first-name-only leftover. */
export function mergeStoredFullName(
  existing: string | undefined,
  next: string | undefined,
): string | undefined {
  const current = existing?.trim() ?? "";
  const incoming = next?.trim() ?? "";
  if (!current) return incoming || undefined;
  if (!incoming) return current;
  if (incoming.length > current.length) return incoming;
  return current;
}

export function pendingSignupEmail(): string {
  return `unverified+${newExternalId()}@invalid.local`;
}

async function insertSignupUser(
  ctx: CreateOrUpdateUserCtx,
  args: {
    email: string;
    name: string;
    companyName: string;
    verified: boolean;
    now: number;
  },
): Promise<Id<"users">> {
  return await ctx.db.insert("users", {
    externalId: newExternalId(),
    email: args.email,
    ...(args.name ? { name: args.name, fullName: args.name } : {}),
    ...(args.companyName ? { companyName: args.companyName } : {}),
    ...(args.verified ? { emailVerificationTime: args.now } : {}),
    phone: "",
    entityType: "individual",
    defaultCurrency: "NGN",
    fiscalYearStart: 1,
    onboardingCompleted: false,
    lastLoginAt: args.now,
    createdAt: args.now,
    updatedAt: args.now,
  });
}

/**
 * Create or reuse a `users` row for Convex Auth.
 *
 * Unverified sign-up never attaches to an existing row. A temporary user
 * is inserted (placeholder email if the address is taken) so the password
 * account can receive an OTP. Reclaim (lines below) moves that login onto
 * the real user only after verification.
 */
export async function createOrUpdateAuthUser(
  ctx: CreateOrUpdateUserCtx,
  args: CreateOrUpdateUserArgs,
  now = Date.now(),
): Promise<Id<"users">> {
  const email = normalizeAuthEmail(args.profile.email);
  const verified = profileEmailIsVerified(
    args.type,
    args.profile.emailVerified,
  );
  const name =
    typeof args.profile.name === "string" ? args.profile.name.trim() : "";
  const companyName =
    typeof args.profile.companyName === "string"
      ? args.profile.companyName.trim()
      : "";

  if (args.existingUserId) {
    const existing = await ctx.db.get(args.existingUserId);
    if (existing && !existing.deletedAt) {
      if (verified && email) {
        const byEmail = await findUserByEmail(ctx, email);
        if (byEmail && !byEmail.deletedAt && byEmail._id !== existing._id) {
          const reclaimedName = displayName(name, byEmail);
          await ctx.db.patch(byEmail._id, {
            email,
            name: reclaimedName,
            fullName: mergeStoredFullName(byEmail.fullName, reclaimedName),
            companyName: companyName || byEmail.companyName,
            supabaseUserId: byEmail.supabaseUserId ?? byEmail.externalId,
            emailVerificationTime: now,
            updatedAt: now,
          });
          await ctx.db.patch(existing._id, {
            email: `reclaimed+${existing._id}@invalid.local`,
            deletedAt: now,
            updatedAt: now,
          });
          return byEmail._id;
        }
      }

      const byEmail = email ? await findUserByEmail(ctx, email) : null;
      const emailTakenByOther =
        !!byEmail && !byEmail.deletedAt && byEmail._id !== existing._id;
      const nextName = displayName(name, existing);
      await ctx.db.patch(existing._id, {
        email: emailTakenByOther ? existing.email : email || existing.email,
        name: nextName,
        fullName: mergeStoredFullName(existing.fullName, nextName),
        companyName: companyName || existing.companyName,
        ...(verified ? { emailVerificationTime: now } : {}),
        updatedAt: now,
      });
      return existing._id;
    }
  }

  const existing = email ? await findUserByEmail(ctx, email) : null;
  if (existing && !existing.deletedAt) {
    if (verified) {
      const nextName = displayName(name, existing);
      await ctx.db.patch(existing._id, {
        email: email || existing.email,
        name: nextName,
        fullName: mergeStoredFullName(existing.fullName, nextName),
        supabaseUserId: existing.supabaseUserId ?? existing.externalId,
        ...(companyName ? { companyName } : {}),
        emailVerificationTime: now,
        updatedAt: now,
      });
      return existing._id;
    }
    return await insertSignupUser(ctx, {
      email: pendingSignupEmail(),
      name,
      companyName,
      verified: false,
      now,
    });
  }

  return await insertSignupUser(ctx, {
    email,
    name,
    companyName,
    verified,
    now,
  });
}
