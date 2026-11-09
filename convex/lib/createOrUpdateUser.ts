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

/**
 * Create or reuse a `users` row for Convex Auth.
 *
 * Reclaim (same email, no login) stays available, but
 * `emailVerificationTime` is only written after the email OTP succeeds.
 * Binding the password account on signup is required so the OTP can be
 * sent; Convex Auth withholds the session until verification.
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
            fullName: byEmail.fullName ?? reclaimedName,
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

      const nextName = displayName(name, existing);
      await ctx.db.patch(existing._id, {
        email: email || existing.email,
        name: nextName,
        fullName: existing.fullName ?? nextName,
        companyName: companyName || existing.companyName,
        ...(verified ? { emailVerificationTime: now } : {}),
        updatedAt: now,
      });
      return existing._id;
    }
  }

  const existing = email ? await findUserByEmail(ctx, email) : null;
  if (existing && !existing.deletedAt) {
    const nextName = displayName(name, existing);
    await ctx.db.patch(existing._id, {
      email: email || existing.email,
      name: nextName,
      fullName: existing.fullName ?? nextName,
      supabaseUserId: existing.supabaseUserId ?? existing.externalId,
      ...(companyName ? { companyName } : {}),
      ...(verified ? { emailVerificationTime: now } : {}),
      updatedAt: now,
    });
    return existing._id;
  }

  return await ctx.db.insert("users", {
    externalId: newExternalId(),
    email,
    ...(name ? { name, fullName: name } : {}),
    ...(companyName ? { companyName } : {}),
    ...(verified ? { emailVerificationTime: now } : {}),
    phone: "",
    entityType: "individual",
    defaultCurrency: "NGN",
    fiscalYearStart: 1,
    onboardingCompleted: false,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  });
}
